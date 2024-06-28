const express = require('express');
const multer = require('multer');
const path = require('path');
const { query } = require('../utils/query');
const { loadTokenUid } = require('../utils/token');

const router = express.Router();

// 修改个人头像
router.post('/user/update/avatar', async (req, res) => {
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

        if (!req.files) {
            return res.status(400).send({
                status: 'error',
                message: 'No file uploaded',
                code: 400
            });
        }

        const avatarPath = `/avatar/users/${req.files[0].filename}`;

        await query('UPDATE Users SET avatar = ? WHERE user_id = ?', [avatarPath, user_id]);

        res.status(200).send({
            status: 'success',
            message: 'Avatar updated successfully',
            data: { avatar: avatarPath }
        });
    } catch (err) {
        res.status(500).send({
            status: 'error',
            message: err.message,
            code: 500
        });
    }
});

// 修改群头像
router.post('/group/update/avatar', async (req, res) => {
    try {
        const { token } = req.headers;
        const { group_id } = req.body;

        const user_id = await loadTokenUid(token);
        if (!user_id) {
            return res.status(401).send({
                status: 'error',
                message: 'Invalid token',
                code: 401
            });
        }

        if (!req.files) {
            return res.status(400).send({
                status: 'error',
                message: 'No file uploaded',
                code: 400
            });
        }

        // 检查用户是否是群主或管理员
        const result = await query(
            'SELECT role FROM GroupMembers WHERE user_id = ? AND group_id = ?',
            [user_id, group_id]
        );

        if (result.length === 0 || ![0, 1].includes(result[0].role)) {
            return res.status(403).send({
                status: 'error',
                message: 'You do not have permission to update the group avatar',
                code: 403
            });
        }

        const avatarPath = `/avatar/groups/${req.files[0].filename}`;

        await query('UPDATE Groups SET group_avatar = ? WHERE group_id = ?', [avatarPath, group_id]);

        res.status(200).send({
            status: 'success',
            message: 'Group avatar updated successfully',
            data: { avatar: avatarPath }
        });
    } catch (err) {
        res.status(500).send({
            status: 'error',
            message: err.message,
            code: 500
        });
    }
});


// 上传图片
router.post('/image/upload', async (req, res) => {
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

        if (!req.files) {
            return res.status(400).send({
                status: 'error',
                message: 'No file uploaded',
                code: 400
            });
        }

        const imagePath = `/upload/images/${req.files[0].filename}`;

        res.status(200).send({
            status: 'success',
            message: 'Image uploaded successfully',
            data: { image: imagePath }
        });
    } catch (err) {
        console.log(err)
        res.status(500).send({
            status: 'error',
            message: err.message,
            code: 500
        });
    }
});


module.exports = router;
