const express = require("express")
const path = require("path")
const multer = require("multer")
const axios = require('axios');
require("dotenv").config()
const { loadTokenUid,signToken } = require('./utils/token');
const { query } = require("./utils/query");

const port = process.env.PORT || 3000

const app = express()

app.use(function (req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-COntrol-Allow-Headers", "*");
	res.header("Access-COntrol-Allow-Methods", "DELETE,PUT,POST,GET,OPTIONS");
	if (req.method == "OPTIONS") res.sendStatus(200);
	else next();
})

app.use(express.json())

const upload = multer({
	dest: "./public/upload/temp"
})

app.use(upload.any())


app.use(express.static(path.join(__dirname, "public")))


app.get("/", (req, res) => {
	res.send({
		code: 200,
		msg: "ok"
	})
})

app.use("/api", require("./routers/UserRouter"))

app.use("/api", require("./routers/GroupRouter"))

app.use("/api", require("./routers/UploadRouter"))

const { createServer } = require("http")
const cors = require('cors')
const { Server } = require("socket.io")

const httpServer = createServer(app)

const io = new Server(httpServer, {
	cors: {
		origin: '*',
		methods: ['GET', 'POST']
	}
})

app.use(cors())

io.on('connection', (socket) => {
	socket.on('join room', async (data) => {
		const { group_id ,token } = data
		const user_id = await loadTokenUid(token)
		if (!user_id) return
		const res = await query("select * from GroupMembers where group_id = ? and user_id = ?", [group_id, user_id])
		if (!res.length) return
		socket.join(group_id)
	})

	socket.on('send message', async (data) => {
		const { group_id ,token, message_content } = data
		const user_id = await loadTokenUid(token)
		if (!user_id) return
		const res = await query("select * from GroupMembers where group_id = ? and user_id = ?", [group_id, user_id])
		if (!res.length) return
		io.to(group_id).emit('received message', { user_id, message_content })
	})

	socket.on('disconnect', async (data) => {
		const { group_id ,token } = data
		const user_id = await loadTokenUid(token)
		if (!user_id) return
		const res = await query("select * from GroupMembers where group_id = ? and user_id = ?", [group_id, user_id])
		if (!res.length) return
		socket.leave(group_id)
	})
})

httpServer.listen(port, () => {
	console.log(`Server listening on: http://localhost:${port}/`)
})