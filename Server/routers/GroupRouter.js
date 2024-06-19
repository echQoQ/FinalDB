const express = require('express');
const router = express.Router();

const { query } = require('../utils/query');
const { loadTokenUid } = require('../utils/token');

// 搜索群组列表
router.post('/group/list', async (req, res) => {
    try {
        let { keyword = '', page = 1, limit = 10 } = req.body;

        // 确定偏移量
        const offset = (page - 1) * limit;

        // 查询满足条件的群组总数
        const countResult = await query(
            'SELECT COUNT(*) as total FROM Groups WHERE group_name LIKE ? OR description LIKE ?',
            [`%${keyword}%`, `%${keyword}%`]
        );
        const total = countResult[0].total;

        // 查询满足条件的群组列表
        const groups = await query(
            'SELECT * FROM Groups WHERE group_name LIKE ? OR description LIKE ? LIMIT ? OFFSET ?',
            [`%${keyword}%`, `%${keyword}%`, parseInt(limit), parseInt(offset)]
        );

        // 返回响应
        res.status(200).send({
            status: 'success',
            data: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                groups
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

// 创建群组
router.post('/group/create', async (req, res) => {
    try {
        const { token } = req.headers;
        const { group_name, group_avatar = '/avatar/groups/default.jpg', description } = req.body;

        if (!group_name || !description) {
            return res.status(400).send({
                status: 'error',
                message: 'Group name and description are required',
                code: 400
            });
        }

        const owner_id = await loadTokenUid(token);
        if (!owner_id) {
            return res.status(401).send({
                status: 'error',
                message: 'Invalid token',
                code: 401
            });
        }

        // 创建群组
        const result = await query(
            'INSERT INTO Groups (group_name, group_avatar, owner_id, description) VALUES (?, ?, ?, ?)',
            [group_name, group_avatar, owner_id, description]
        );

        const group_id = result.insertId;

        // 因为触发器已经处理了插入GroupMembers的操作，所以这里不需要再手动插入

        res.status(201).send({
            status: 'success',
            data: {
                group_id,
                group_name,
                group_avatar,
                owner_id,
                description
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

// 删除群组
router.post('/group/delete', async (req, res) => {
    try {
        const { token } = req.headers;
        const { group_id } = req.body;

        if (!group_id) {
            return res.status(400).send({
                status: 'error',
                message: 'Group ID is required',
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

        // 检查用户是否有权限删除群组
        const group = await query('SELECT * FROM Groups WHERE group_id = ?', [group_id]);
        if (group.length === 0) {
            return res.status(404).send({
                status: 'error',
                message: 'Group not found',
                code: 404
            });
        }

        if (group[0].owner_id !== user_id) {
            return res.status(403).send({
                status: 'error',
                message: 'Only the group owner can delete the group',
                code: 403
            });
        }

        // 删除群组
        await query('DELETE FROM Groups WHERE group_id = ?', [group_id]);

        res.status(200).send({
            status: 'success',
            message: 'Group deleted successfully'
        });
    } catch (err) {

        res.status(500).send({
            status: 'error',
            message: err.message,
            code: 500
        });
    }
});

// 申请加入群组
router.post('/group/join_request/send', async (req, res) => {
    try {
        const { token } = req.headers;
        const { group_id } = req.body;

        if (!group_id) {
            return res.status(400).send({
                status: 'error',
                message: 'Group ID is required',
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

        // 检查用户是否已经是群组成员
        const memberExists = await query(
            'SELECT * FROM GroupMembers WHERE user_id = ? AND group_id = ?',
            [user_id, group_id]
        );
        if (memberExists.length > 0) {
            return res.status(400).send({
                status: 'error',
                message: 'User is already a member of this group',
                code: 400
            });
        }

        // 检查是否已经申请过加入
        const requestExists = await query(
            'SELECT * FROM GroupJoinRequests WHERE user_id = ? AND group_id = ? AND status = 0',
            [user_id, group_id]
        );
        if (requestExists.length > 0) {
            return res.status(400).send({
                status: 'error',
                message: 'User has already requested to join this group',
                code: 400
            });
        }

        // 插入加群申请记录
        await query(
            'INSERT INTO GroupJoinRequests (user_id, group_id) VALUES (?, ?)',
            [user_id, group_id]
        );

        res.status(200).send({
            status: 'success',
            message: 'Join request submitted successfully'
        });
    } catch (err) {
        res.status(500).send({
            status: 'error',
            message: err.message,
            code: 500
        });
    }
});


// 处理入群申请
router.post('/group/join_request/handle', async (req, res) => {
    try {
        const { token } = req.headers;
        const { request_id, status } = req.body;

        if (!request_id || !status) {
            return res.status(400).send({
                status: 'error',
                message: 'Request ID and status are required',
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

        // 查询加群申请信息
        const request = await query('SELECT * FROM GroupJoinRequests WHERE request_id = ? AND status = 0', [request_id]);
        if (request.length === 0) {
            return res.status(404).send({
                status: 'error',
                message: 'Join request not found',
                code: 404
            });
        }

        const group_id = request[0].group_id;

        // 检查用户是否有权限处理加群请求
        const handlerRole = await query(
            'SELECT role FROM GroupMembers WHERE user_id = ? AND group_id = ?',
            [user_id, group_id]
        );
        if (handlerRole.length === 0 || handlerRole[0].role > 1) {
            return res.status(403).send({
                status: 'error',
                message: 'Only group owners and admins can handle join requests',
                code: 403
            });
        }

        // 更新加群申请状态
        await query('UPDATE GroupJoinRequests SET status = ?, handler_id = ? WHERE request_id = ?',
            [status, user_id, request_id]);

        res.status(200).send({
            status: 'success',
            message: 'Join request handled successfully'
        });
    } catch (err) {
        res.status(500).send({
            status: 'error',
            message: err.message,
            code: 500
        });
    }
});

// 获取入群申请列表
router.get('/group/join_request/list', async (req, res) => {
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
		
        // 查询当前用户管理的群组
        const groups = await query(
            'SELECT group_id FROM GroupMembers WHERE user_id = ? AND role <= 1',
            [user_id]
        );

        if (groups.length === 0) {
            return res.status(404).send({
                status: 'error',
                message: 'No groups found for the user',
                code: 404
            });
        }

        const groupIds = groups.map(group => group.group_id);

        // 查询未处理的入群申请列表
        const pendingRequests = await query(`
            SELECT r.request_id, r.user_id, r.group_id, r.status, r.request_time,
                   u.username as username, g.group_name as group_name
            FROM GroupJoinRequests r
            JOIN Users u ON r.user_id = u.user_id
            JOIN Groups g ON r.group_id = g.group_id
            WHERE r.group_id IN (${groupIds.join(',')})
            AND r.status = 0
        `);

        // 查询已处理的入群申请列表
        const handledRequests = await query(`
            SELECT r.request_id, r.user_id, r.group_id, r.status, r.request_time, r.handle_time,
                   u.username as username, g.group_name as group_name,
                   h.username as handler
            FROM GroupJoinRequests r
            JOIN Users u ON r.user_id = u.user_id
            JOIN Groups g ON r.group_id = g.group_id
            LEFT JOIN Users h ON r.handler_id = h.user_id
            WHERE r.group_id IN (${groupIds.join(',')})
            AND r.status IN (1, 2)
        `);

        const response = {
            pendingRequests: pendingRequests,
            handledRequests: handledRequests
        };

        res.status(200).send({
            status: 'success',
            data: response
        });
    } catch (err) {
        res.status(500).send({
            status: 'error',
            message: err.message,
            code: 500
        });
    }
});

// 获取群消息
router.post('/group/message/list', async (req, res) => {
    try {
        const { token } = req.headers;
        const { group_id, offset = 0, limit = 10 } = req.body;

        if (!group_id) {
            return res.status(400).send({
                status: 'error',
                message: 'Group ID is required',
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

        // 检查用户是否是群组成员
        const member = await query(
            'SELECT * FROM GroupMembers WHERE user_id = ? AND group_id = ?',
            [user_id, group_id]
        );
        if (member.length === 0) {
            return res.status(403).send({
                status: 'error',
                message: 'You are not a member of this group',
                code: 403
            });
        }

        // 查询群消息
        const messages = await query(
            'SELECT * FROM GroupMessages WHERE group_id = ? ORDER BY send_time DESC LIMIT ?, ?',
            [group_id, parseInt(offset), parseInt(limit)]
        );

        res.status(200).send({
            status: 'success',
            data: messages
        });
    } catch (err) {
        res.status(500).send({
            status: 'error',
            message: err.message,
            code: 500
        });
    }
});

//发送群消息
router.post('/group/message/send', async (req, res) => {
    try {
        const { token } = req.headers;
        const { group_id, message_content } = req.body;

        if (!group_id || !message_content) {
            return res.status(400).send({
                status: 'error',
                message: 'Group ID and message content are required',
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

        // 检查用户是否是群组成员
        const member = await query(
            'SELECT * FROM GroupMembers WHERE user_id = ? AND group_id = ?',
            [user_id, group_id]
        );
        if (member.length === 0) {
            return res.status(403).send({
                status: 'error',
                message: 'User is not a member of this group',
                code: 403
            });
        }

        // 插入群消息
        await query(
            'INSERT INTO GroupMessages (sender_id, group_id, message_content, send_time) VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
            [user_id, group_id, message_content]
        );

        res.status(200).send({
            status: 'success',
            message: 'Message sent successfully'
        });
    } catch (err) {
        res.status(500).send({
            status: 'error',
            message: err.message,
            code: 500
        });
    }
});

// 撤回群消息
router.post('/group/message/revoke', async (req, res) => {
    try {
        const { token } = req.headers;
        const { message_id } = req.body;

        if (!message_id) {
            return res.status(400).send({
                status: 'error',
                message: 'Message ID is required',
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

        // 查询消息详情，获取群组ID、发送者ID和消息内容
        const message = await query(
            'SELECT group_id, sender_id FROM GroupMessages WHERE message_id = ?',
            [message_id]
        );
        if (message.length === 0) {
            return res.status(404).send({
                status: 'error',
                message: 'Message not found',
                code: 404
            });
        }

        const group_id = message[0].group_id;
        const sender_id = message[0].sender_id;

        // 查询用户在群组中的角色
        const userRole = await query(
            'SELECT role FROM GroupMembers WHERE user_id = ? AND group_id = ?',
            [user_id, group_id]
        );
        if (userRole.length === 0) {
            return res.status(403).send({
                status: 'error',
                message: 'User is not a member of this group',
                code: 403
            });
        }

        // 检查权限：管理员（role=1）和群主（role=0）可以撤回任何人的消息
        // 普通成员只能撤回自己的消息
        if (userRole[0].role !== 0 && userRole[0].role !== 1 && sender_id !== user_id) {
            return res.status(403).send({
                status: 'error',
                message: 'Permission denied: Only group owners and admins can revoke others\' messages',
                code: 403
            });
        }

        // 删除消息
        await query(
            'DELETE FROM GroupMessages WHERE message_id = ?',
            [message_id]
        );

        res.status(200).send({
            status: 'success',
            message: 'Message revoked successfully'
        });
    } catch (err) {
        res.status(500).send({
            status: 'error',
            message: err.message,
            code: 500
        });
    }
});


// 获取群组成员列表
router.get('/group/member/list', async (req, res) => {
    try {
        const { token } = req.headers;
        const { group_id } = req.query;

        if (!group_id) {
            return res.status(400).send({
                status: 'error',
                message: 'Group ID is required',
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

        // 检查用户是否是群组成员
        const member = await query(
            'SELECT * FROM GroupMembers WHERE user_id = ? AND group_id = ?',
            [user_id, group_id]
        );
        if (member.length === 0) {
            return res.status(403).send({
                status: 'error',
                message: 'You are not a member of this group',
                code: 403
            });
        }

        // 查询群组成员列表
        const members = await query(
            'SELECT gm.*, u.username, u.avatar FROM GroupMembers gm JOIN Users u ON gm.user_id = u.user_id WHERE gm.group_id = ? order by gm.role',
            [group_id]
        );

        res.status(200).send({
            status: 'success',
            data: members
        });
    } catch (err) {
        res.status(500).send({
            status: 'error',
            message: err.message,
            code: 500
        });
    }
});

// 批量剔除群成员
router.post('/group/member/remove', async (req, res) => {
    try {
        const { token } = req.headers;
        const { group_id, member_ids } = req.body;

        if (!group_id || !member_ids || !Array.isArray(member_ids)) {
            return res.status(400).send({
                status: 'error',
                message: 'Group ID and member IDs are required, and member IDs must be an array',
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

        // 获取当前用户在群组中的角色
        const [handlerRoleResult] = await query(
            'SELECT role FROM GroupMembers WHERE user_id = ? AND group_id = ?',
            [user_id, group_id]
        );
        if (!handlerRoleResult) {
            return res.status(403).send({
                status: 'error',
                message: 'You are not a member of this group',
                code: 403
            });
        }
        const handlerRole = handlerRoleResult.role;

        // 获取群主的用户ID
        const [groupOwnerResult] = await query(
            'SELECT owner_id FROM Groups WHERE group_id = ?',
            [group_id]
        );
        if (!groupOwnerResult) {
            return res.status(404).send({
                status: 'error',
                message: 'Group not found',
                code: 404
            });
        }
        const groupOwnerId = groupOwnerResult.owner_id;

        if (handlerRole > 1) {
            return res.status(403).send({
                status: 'error',
                message: 'Only group owners and admins can remove members',
                code: 403
            });
        }

        // 检查要剔除的成员列表，确保群主不会被踢出，管理员只能被群主踢出
        const membersToKick = await query(
            'SELECT user_id, role FROM GroupMembers WHERE user_id IN (?) AND group_id = ?',
            [member_ids, group_id]
        );

        const validMemberIds = [];
        for (const member of membersToKick) {
            if (member.user_id === groupOwnerId) {
                // 群主不能被踢出
                continue;
            }
            if (member.role === 1 && handlerRole !== 0) {
                // 管理员只能被群主踢出
                continue;
            }
            validMemberIds.push(member.user_id);
        }

        if (validMemberIds.length === 0) {
            return res.status(403).send({
                status: 'error',
                message: 'No valid members to remove',
                code: 403
            });
        }

        // 批量删除群成员
        const placeholders = validMemberIds.map(() => '?').join(',');
        await query(
            `DELETE FROM GroupMembers WHERE user_id IN (${placeholders}) AND group_id = ?`,
            [...validMemberIds, group_id]
        );

        res.status(200).send({
            status: 'success',
            message: 'Members removed successfully'
        });
    } catch (err) {
        res.status(500).send({
            status: 'error',
            message: err.message,
            code: 500
        });
    }
});

// 修改群组名称
router.post('/group/update/name', async (req, res) => {
    try {
        const { token } = req.headers;
        const { group_id, new_group_name } = req.body;

        if (!group_id || !new_group_name) {
            return res.status(400).send({
                status: 'error',
                message: 'Group ID and new group name are required',
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

        // 检查用户权限
        const group = await query('SELECT * FROM Groups WHERE group_id = ?', [group_id]);
        if (group.length === 0) {
            return res.status(404).send({
                status: 'error',
                message: 'Group not found',
                code: 404
            });
        }

        if (group[0].owner_id !== user_id) {
            return res.status(403).send({
                status: 'error',
                message: 'Only the group owner can update the group name',
                code: 403
            });
        }

        // 更新群组名称
        await query('UPDATE Groups SET group_name = ? WHERE group_id = ?', [new_group_name, group_id]);

        res.status(200).send({
            status: 'success',
            message: 'Group name updated successfully'
        });
    } catch (err) {
        res.status(500).send({
            status: 'error',
            message: err.message,
            code: 500
        });
    }
});

// 修改群组描述
router.post('/group/update/description', async (req, res) => {
    try {
        const { token } = req.headers;
        const { group_id, new_description } = req.body;

        if (!group_id || !new_description) {
            return res.status(400).send({
                status: 'error',
                message: 'Group ID and new description are required',
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

        // 检查用户权限
        const group = await query('SELECT * FROM Groups WHERE group_id = ?', [group_id]);
        if (group.length === 0) {
            return res.status(404).send({
                status: 'error',
                message: 'Group not found',
                code: 404
            });
        }

        if (group[0].owner_id !== user_id) {
            return res.status(403).send({
                status: 'error',
                message: 'Only the group owner can update the group description',
                code: 403
            });
        }

        // 更新群组描述
        await query('UPDATE Groups SET description = ? WHERE group_id = ?', [new_description, group_id]);

        res.status(200).send({
            status: 'success',
            message: 'Group description updated successfully'
        });
    } catch (err) {
        res.status(500).send({
            status: 'error',
            message: err.message,
            code: 500
        });
    }
});

// 修改群组描述
router.post('/group/update/description', async (req, res) => {
    try {
        const { token } = req.headers;
        const { group_id, new_description } = req.body;

        if (!group_id || !new_description) {
            return res.status(400).send({
                status: 'error',
                message: 'Group ID and new description are required',
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

        // 检查用户权限
        const group = await query('SELECT * FROM Groups WHERE group_id = ?', [group_id]);
        if (group.length === 0) {
            return res.status(404).send({
                status: 'error',
                message: 'Group not found',
                code: 404
            });
        }

        if (group[0].owner_id !== user_id) {
            return res.status(403).send({
                status: 'error',
                message: 'Only the group owner can update the group description',
                code: 403
            });
        }

        // 更新群组描述
        await query('UPDATE Groups SET description = ? WHERE group_id = ?', [new_description, group_id]);

        res.status(200).send({
            status: 'success',
            message: 'Group description updated successfully'
        });
    } catch (err) {
        res.status(500).send({
            status: 'error',
            message: err.message,
            code: 500
        });
    }
});



// 发布群公告
router.post('/group/announcement/create', async (req, res) => {
    try {
        const { token } = req.headers;
        const { group_id, announcement_content } = req.body;

        if (!group_id || !announcement_content) {
            return res.status(400).send({
                status: 'error',
                message: 'Group ID and announcement content are required',
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

        // 检查用户权限
        const member = await query('SELECT * FROM GroupMembers WHERE user_id = ? AND group_id = ?', [user_id, group_id]);
        if (member.length === 0 || member[0].role > 1) {
            return res.status(403).send({
                status: 'error',
                message: 'Only group owners and admins can publish announcements',
                code: 403
            });
        }

        // 发布公告
        const result = await query(
            'INSERT INTO GroupAnnouncements (announcement_content, group_id, publisher_id) VALUES (?, ?, ?)',
            [announcement_content, group_id, user_id]
        );

        const announcement_id = result.insertId;

        res.status(201).send({
            status: 'success',
            data: {
                announcement_id,
                announcement_content,
                group_id,
                publisher_id: user_id,
                publish_time: new Date().toISOString()
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

// 删除群公告
router.post('/group/announcement/delete', async (req, res) => {
    try {
        const { token } = req.headers;
        const { announcement_id } = req.body;

        if (!announcement_id) {
            return res.status(400).send({
                status: 'error',
                message: 'Announcement ID is required',
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

        // 获取公告信息
        const announcement = await query('SELECT * FROM GroupAnnouncements WHERE announcement_id = ?', [announcement_id]);
        if (announcement.length === 0) {
            return res.status(404).send({
                status: 'error',
                message: 'Announcement not found',
                code: 404
            });
        }

        const group_id = announcement[0].group_id;

        // 检查用户权限
        const member = await query('SELECT * FROM GroupMembers WHERE user_id = ? AND group_id = ?', [user_id, group_id]);
        if (member.length === 0 || member[0].role > 1) {
            return res.status(403).send({
                status: 'error',
                message: 'Only group owners and admins can delete announcements',
                code: 403
            });
        }

        // 删除公告
        await query('DELETE FROM GroupAnnouncements WHERE announcement_id = ?', [announcement_id]);

        res.status(200).send({
            status: 'success',
            message: 'Announcement deleted successfully'
        });
    } catch (err) {
        res.status(500).send({
            status: 'error',
            message: err.message,
            code: 500
        });
    }
});


// 获取公告列表
router.get('/group/announcement/list', async (req, res) => {
    try {
        const { token } = req.headers;
        const { group_id, page = 1, limit = 10 } = req.query;

        if (!group_id) {
            return res.status(400).send({
                status: 'error',
                message: 'Group ID is required',
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

        // 检查用户是否是群组成员
        const member = await query('SELECT * FROM GroupMembers WHERE user_id = ? AND group_id = ?', [user_id, group_id]);
        if (member.length === 0) {
            return res.status(403).send({
                status: 'error',
                message: 'You are not a member of this group',
                code: 403
            });
        }

        const offset = (page - 1) * limit;

        // 获取公告列表
        const announcements = await query(
            'SELECT * FROM GroupAnnouncements WHERE group_id = ? ORDER BY publish_time DESC LIMIT ? OFFSET ?',
            [group_id, parseInt(limit), parseInt(offset)]
        );

        // 获取公告总数
        const totalResults = await query('SELECT COUNT(*) AS total FROM GroupAnnouncements WHERE group_id = ?', [group_id]);
        const totalAnnouncements = totalResults[0].total;

        res.status(200).send({
            status: 'success',
            data: {
                announcements,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: totalAnnouncements
                }
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

// 退出群聊
router.post('/group/leave', async (req, res) => {
    try {
        const { token } = req.headers;
        const { group_id } = req.body;

        if (!group_id) {
            return res.status(400).send({
                status: 'error',
                message: 'Group ID is required',
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

        // 检查用户是否是群组成员
        const member = await query('SELECT * FROM GroupMembers WHERE user_id = ? AND group_id = ?', [user_id, group_id]);
        if (member.length === 0) {
            return res.status(403).send({
                status: 'error',
                message: 'You are not a member of this group',
                code: 403
            });
        }

        // 如果用户是群主，禁止退出群聊
        const group = await query('SELECT * FROM Groups WHERE group_id = ?', [group_id]);
        if (group.length > 0 && group[0].owner_id === user_id) {
            return res.status(403).send({
                status: 'error',
                message: 'Group owner cannot leave the group',
                code: 403
            });
        }

        // 删除群组成员记录
        await query('DELETE FROM GroupMembers WHERE user_id = ? AND group_id = ?', [user_id, group_id]);

        res.status(200).send({
            status: 'success',
            message: 'You have successfully left the group'
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