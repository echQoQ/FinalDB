const jwt = require("jsonwebtoken")
const { query } = require('./query');
require("dotenv").config()
const secretKey = process.env.JWT_SECRET_KEY

const loadTokenUid = async (token) => {
	let res = jwt.verify(token, secretKey);
	if (res != null && res.exp > Date.now()) {
		let sql = "select * from users where user_id = ? and login_token = ?"
		let res2 = await query(sql, [res.user_id, token])
		if (res2.length == 0) {
		    return 0
		}
		return res.user_id
	} else {
		console.log(res)
		return 0
	}
}

const signToken = (user_id) => {
	let payload = {
		user_id: user_id,
		exp: Date.now() + 1000 * 60 * 60 * 24 * 3// 3 days
	}
	return jwt.sign(payload, secretKey)
}

module.exports = { 
	loadTokenUid,
	signToken
}