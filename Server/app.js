const express = require("express")
const path = require("path")
const multer = require("multer")
const axios = require('axios');
require("dotenv").config()
const { loadTokenUid,signToken } = require('./utils/token');
const { query } = require("./utils/query");
const fs = require('fs');

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

const userAvatarDir = path.join(__dirname, 'public/avatar/users');
const groupAvatarDir = path.join(__dirname, 'public/avatar/groups');
const defaultDir = path.join(__dirname, 'public/upload/images');

// 确保目录存在
if (!fs.existsSync(userAvatarDir)) {
    fs.mkdirSync(userAvatarDir, { recursive: true });
}
if (!fs.existsSync(groupAvatarDir)) {
    fs.mkdirSync(groupAvatarDir, { recursive: true });
}
if (!fs.existsSync(defaultDir)) {
    fs.mkdirSync(defaultDir, { recursive: true });
}

// 设置 Multer 存储
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let destinationDir;
        if (req.url.includes('/user')) {
            destinationDir = userAvatarDir;
        } else if (req.url.includes('/group')) {
            destinationDir = groupAvatarDir;
        } else {
            destinationDir = defaultDir;
        }
        cb(null, destinationDir);
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        cb(null, Date.now() + ext); // 使用时间戳作为文件名
    }
});

// 文件过滤
const fileFilter = (req, file, cb) => {
    // 只接受图片文件
    if (!file.mimetype.startsWith('image/')) {
        return cb(new Error('File is not an image'), false);
    }
    cb(null, true);
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

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
		try {
			const { group_id ,token } = data
			const user_id = await loadTokenUid(token)
			if (!user_id) return
			const res = await query("select * from GroupMembers where group_id = ? and user_id = ?", [group_id, user_id])
			if (!res.length) return
			socket.join(group_id)
			//console.log(`${user_id}进入房间${group_id}`)
		} catch (err) {
			console.log(err)
		}
	})

    socket.on('send message', async (data) => {
        try {
            const { group_id, token, message_content } = data;
            const user_id = await loadTokenUid(token);
            if (!user_id) return;

            // 检查用户是否是群组成员
            const res = await query("SELECT * FROM GroupMembers WHERE group_id = ? AND user_id = ?", [group_id, user_id]);
            if (!res.length) return;

            let role = res[0].role

            // 插入消息到数据库
            const insertResult = await query(
                "INSERT INTO GroupMessages (sender_id, group_id, message_content) VALUES (?, ?, ?)",
                [user_id, group_id, message_content]
            );
            const message_id = insertResult.insertId;

            // 获取发送者信息
            const user = await query(
                "SELECT username, avatar FROM Users WHERE user_id = ?",
                [user_id]
            );
            const { username, avatar } = user[0];

            // 获取发送时间
            const send_time = new Date().toISOString();

            // 广播新消息
            const messageData = {
                message_id,
                sender_id: user_id,
                message_content,
                send_time,
                username,
                avatar,
                role
            };


            io.to(group_id).emit('received message', messageData);
        } catch (err) {
            console.log(err);
        }
	})

    socket.on('recall message', async (data) => {
        try {
            const { group_id, message_id, token } = data;
            const user_id = await loadTokenUid(token);
            if (!user_id) return;

            // 获取消息信息
            const message = await query(
                'SELECT * FROM GroupMessages WHERE message_id = ?',
                [message_id]
            );
            if (!message.length) return;

            const { sender_id } = message[0];

            // 检查用户是否是消息的发送者或群组的管理员/群主
            const member = await query(
                'SELECT * FROM GroupMembers WHERE user_id = ? AND group_id = ?',
                [user_id, group_id]
            );
            if (!member.length) return;

            const { role } = member[0];
            if (user_id !== sender_id && role > 1) return;

            // 删除消息
            await query('DELETE FROM GroupMessages WHERE message_id = ?', [message_id]);

            // 广播消息撤回事件
            io.to(group_id).emit('message recalled', message_id);
        } catch (err) {
            console.log(err);
        }
    });

	socket.on('leave room', async (data) => {
		try {
			const { group_id ,token } = data
			const user_id = await loadTokenUid(token)
			if (!user_id) return
			const res = await query("select * from GroupMembers where group_id = ? and user_id = ?", [group_id, user_id])
			if (!res.length) return
			//console.log(`${user_id}退出房间${group_id}`)
			socket.leave(group_id)
		} catch (err) {
			console.log(err)
		}
		
	})
})

httpServer.listen(port, () => {
	console.log(`Server listening on: http://localhost:${port}/`)
})