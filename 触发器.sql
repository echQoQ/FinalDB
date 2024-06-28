--只有群主或者管理员能处理入群请求

DELIMITER //

CREATE TRIGGER BeforeUpdateRequestStatus
BEFORE UPDATE ON GroupJoinRequests
FOR EACH ROW
BEGIN
    DECLARE handlerRole INT;

    -- 获取处理人的角色
    SELECT role INTO handlerRole
    FROM GroupMembers
    WHERE user_id = NEW.handler_id AND group_id = NEW.group_id;

    -- 检查处理人是否是群主或管理员
    IF handlerRole NOT IN (0, 1) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Only group owners and admins can handle join requests.';
    END IF;

    -- 检查status是否是1或2
    IF NEW.status NOT IN (1, 2) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'The status must be 1 or 2.';
    END IF;

    -- 如果status为1（同意加群请求），在GroupMembers表中添加一条记录
    IF NEW.status = 1 THEN
        INSERT INTO GroupMembers (user_id, group_id, role, join_time)
        VALUES (NEW.user_id, NEW.group_id, 2, CURRENT_TIMESTAMP);
    END IF;
		
		SET NEW.handle_time = CURRENT_TIMESTAMP;
END //

DELIMITER ;

DELIMITER //

CREATE TRIGGER before_insert_GroupJoinRequests
BEFORE INSERT ON GroupJoinRequests
FOR EACH ROW
BEGIN
    SET NEW.status = 0;
		SET NEW.request_time = CURRENT_TIMESTAMP;
END;
//

DELIMITER ;


--解散群聊时，其对应的各信息一并删除

DELIMITER //

CREATE TRIGGER after_delete_Groups
AFTER DELETE ON Groups
FOR EACH ROW
BEGIN
    DELETE FROM GroupMembers WHERE group_id = OLD.group_id;
    DELETE FROM GroupMessages WHERE group_id = OLD.group_id;
    DELETE FROM GroupJoinRequests WHERE group_id = OLD.group_id;
    DELETE FROM GroupAnnouncements WHERE group_id = OLD.group_id;
END;
//

DELIMITER ;

-- 创建群组时，在群成员表添加一位role=0的记录

DELIMITER //
CREATE TRIGGER after_insert_Groups
AFTER INSERT ON Groups
FOR EACH ROW
BEGIN
    INSERT INTO GroupMembers (user_id, group_id, role, join_time)
    VALUES (NEW.owner_id, NEW.group_id, 0, CURRENT_TIMESTAMP);
END;
//
DELIMITER ;