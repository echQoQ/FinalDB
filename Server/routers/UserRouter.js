const express = require('express');
const router = express.Router();
const md5 = require('js-md5');
const { query } = require('../utils/query');
const { loadTokenUid,signToken } = require('../utils/token');

// 用户注册
router.post('/user/signup', async (req, res) => {
    try {
        let { username, password } = req.body;

        // 输入格式验证
        if (!username || !password) {
            return res.status(400).send({
                status: 'error',
                message: 'Username and password are required',
                code: 400
            });
        }

        if (username.length < 3 || username.length > 50) {
            return res.status(400).send({
                status: 'error',
                message: 'Username must be between 3 and 50 characters',
                code: 400
            });
        }

        // 强密码要求（示例：至少8个字符，包含大小写字母和数字）
        const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).send({
                status: 'error',
                message: 'Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, and one number',
                code: 400
            });
        }

        // 加密密码
        password = md5(password);

        // 检查用户名是否已经存在
        const userExists = await query('SELECT * FROM Users WHERE username = ?', [username]);
        if (userExists.length > 0) {
            return res.status(400).send({
                status: 'error',
                message: 'Username already exists',
                code: 400
            });
        }

        // 插入新用户
        await query('INSERT INTO Users (username, password) VALUES (?, ?)', [username, password]);
        res.status(200).send({
            status: 'success',
            data: { message: 'User registered successfully' }
        });
    } catch (err) {
        res.status(500).send({
            status: 'error',
            message: err.message,
            code: 500
        });
    }
});

// 用户登录
router.post('/user/login', async (req, res) => {
    try {
        let { username, password } = req.body;
        password = md5(password);

        // 查询用户
        const user = await query('SELECT * FROM Users WHERE username = ? AND password = ?', [username, password]);
        if (user.length === 0) {
            return res.status(401).send({
                status: 'error',
                message: 'Invalid username or password',
                code: 401
            });
        }

        // 生成登录令牌
        const user_id = user[0].user_id;
        const token = signToken(user_id);

        // 更新用户的登录令牌（触发器会自动更新 last_login_time）
        await query('UPDATE Users SET login_token = ? WHERE user_id = ?', [token, user_id]);

        res.status(200).send({
            status: 'success',
            data: { token, username, user_id }
        });
    } catch (err) {
        res.status(500).send({
            status: 'error',
            message: err.message,
            code: 500
        });
    }
});


// 修改用户名
router.post('/user/update/username', async (req, res) => {
    try {
        const { token } = req.headers;
        const { new_username } = req.body;

        if (!new_username) {
            return res.status(400).send({
                status: 'error',
                message: 'New username is required',
                code: 400
            });
        }

        const user_id = await loadTokenUid(token);
        if (!user_id) {
            return res.status(401).send({
                status: 'error',
                message: 'Invalid token',
                code: 401
            });
        }

        // 检查新用户名是否已被使用
        const existingUser = await query('SELECT * FROM Users WHERE username = ? AND user_id != ?', [new_username, user_id]);
        if (existingUser.length > 0) {
            return res.status(400).send({
                status: 'error',
                message: 'Username already exists',
                code: 400
            });
        }

        // 更新用户名
        await query('UPDATE Users SET username = ? WHERE user_id = ?', [new_username, user_id]);

        res.status(200).send({
            status: 'success',
            message: 'Username updated successfully'
        });
    } catch (err) {
        res.status(500).send({
            status: 'error',
            message: err.message,
            code: 500
        });
    }
});

// 获取本人头像
router.get('/user/avatar', async (req, res) => {
    try {
        const { token } = req.headers;

        const user_id = await loadTokenUid(token);
        if (!user_id) {
            return res.status(401).send({
                status: 'error',
                message: 'Invalid token',
                code: 401
            });
        }

        // 获取用户头像
        const user = await query('SELECT avatar FROM Users WHERE user_id = ?', [user_id]);
        if (user.length === 0) {
            return res.status(404).send({
                status: 'error',
                message: 'User not found',
                code: 404
            });
        }

        res.status(200).send({
            status: 'success',
            data: {
                avatar: user[0].avatar
            }
        });
    } catch (err) {
        res.status(500).send({
            status: 'error',
            message: err.message,
            code: 500
        });
    }
});


// 获取用户基本信息
router.get('/user/info', async (req, res) => {
    try {
        const { token } = req.headers;

        const user_id = await loadTokenUid(token);
        if (!user_id) {
            return res.status(401).send({
                status: 'error',
                message: 'Invalid token',
                code: 401
            });
        }

        const user = await query('SELECT user_id, username, avatar, last_login_time FROM Users WHERE user_id = ?', [user_id]);
        if (user.length === 0) {
            return res.status(404).send({
                status: 'error',
                message: 'User not found',
                code: 404
            });
        }

        res.status(200).send({
            status: 'success',
            data: user[0]
        });
    } catch (err) {
        res.status(500).send({
            status: 'error',
            message: err.message,
            code: 500
        });
    }
});

// 修改用户基本信息
router.post('/user/update/info', async (req, res) => {
    try {
        const { token } = req.headers;
        const { username, avatar } = req.body;

        if (!username && !avatar) {
            return res.status(400).send({
                status: 'error',
                message: 'Username or avatar is required',
                code: 400
            });
        }

        const user_id = await loadTokenUid(token);
        if (!user_id) {
            return res.status(401).send({
                status: 'error',
                message: 'Invalid token',
                code: 401
            });
        }

        // 检查新用户名是否已被使用（排除当前用户）
        if (username) {
            const existingUser = await query('SELECT * FROM Users WHERE username = ? AND user_id != ?', [username, user_id]);
            if (existingUser.length > 0) {
                return res.status(400).send({
                    status: 'error',
                    message: 'Username already exists',
                    code: 400
                });
            }
        }

        // 更新用户信息
        const updates = [];
        const values = [];

        if (username) {
            updates.push('username = ?');
            values.push(username);
        }

        if (avatar) {
            updates.push('avatar = ?');
            values.push(avatar);
        }

        values.push(user_id);

        await query(`UPDATE Users SET ${updates.join(', ')} WHERE user_id = ?`, values);

        res.status(200).send({
            status: 'success',
            message: 'User information updated successfully'
        });
    } catch (err) {
        res.status(500).send({
            status: 'error',
            message: err.message,
            code: 500
        });
    }
});


// 修改密码
router.post('/user/update/password', async (req, res) => {
    try {
        const { token } = req.headers;
        const { old_password, new_password } = req.body;

        if (!old_password || !new_password) {
            return res.status(400).send({
                status: 'error',
                message: 'Old password and new password are required',
                code: 400
            });
        }

        const user_id = await loadTokenUid(token);
        if (!user_id) {
            return res.status(401).send({
                status: 'error',
                message: 'Invalid token',
                code: 401
            });
        }

        // 验证旧密码
        const user = await query('SELECT password FROM Users WHERE user_id = ?', [user_id]);
        if (user.length === 0 || user[0].password !== md5(old_password)) {
            return res.status(400).send({
                status: 'error',
                message: 'Old password is incorrect',
                code: 400
            });
        }

        // 更新密码
        await query('UPDATE Users SET password = ? WHERE user_id = ?', [md5(new_password), user_id]);

        res.status(200).send({
            status: 'success',
            message: 'Password updated successfully'
        });
    } catch (err) {
        res.status(500).send({
            status: 'error',
            message: err.message,
            code: 500
        });
    }
});


module.exports = router;
