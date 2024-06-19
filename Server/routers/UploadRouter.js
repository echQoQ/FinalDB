const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { query } = require('../utils/query');
const { loadTokenUid } = require('../utils/token');

const router = express.Router();

const userAvatarDir = path.join(__dirname, '../public/avatar/users');
const groupAvatarDir = path.join(__dirname, '../public/avatar/groups');

// 确保目录存在
if (!fs.existsSync(userAvatarDir)) {
    fs.mkdirSync(userAvatarDir, { recursive: true });
}
if (!fs.existsSync(groupAvatarDir)) {
    fs.mkdirSync(groupAvatarDir, { recursive: true });
}

// 设置 Multer 存储
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let destinationDir;
        if (req.url.includes('/user/avatar')) {
            destinationDir = userAvatarDir;
        } else if (req.url.includes('/group/avatar')) {
            destinationDir = groupAvatarDir;
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

// 修改个人头像
router.post('/user/update/avatar', upload.single('avatar'), async (req, res) => {
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

        if (!req.file) {
            return res.status(400).send({
                status: 'error',
                message: 'No file uploaded',
                code: 400
            });
        }

        const avatarPath = `/avatar/users/${req.file.filename}`;

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
router.post('/group/update/avatar', upload.single('avatar'), async (req, res) => {
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

        if (!req.file) {
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

        const avatarPath = `/avatar/groups/${req.file.filename}`;

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

module.exports = router;
