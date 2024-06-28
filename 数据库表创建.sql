CREATE TABLE Users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    password VARCHAR(100) NOT NULL,
    avatar VARCHAR(255) DEFAULT '/avatar/users/default.jpg',
    login_token VARCHAR(255),
    last_login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Groups (
    group_id INT AUTO_INCREMENT PRIMARY KEY,
    group_name VARCHAR(100) NOT NULL,
    group_avatar VARCHAR(255) DEFAULT '/avatar/groups/default.jpg',
    owner_id INT,
    description TEXT,
    FOREIGN KEY (owner_id) REFERENCES Users(user_id)
);

CREATE TABLE GroupMembers (
    member_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    group_id INT,
    role INT DEFAULT 2,
    join_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (group_id) REFERENCES Groups(group_id)
);

CREATE TABLE GroupMessages (
    message_id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT,
    group_id INT,
    message_content TEXT,
    send_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES Users(user_id),
    FOREIGN KEY (group_id) REFERENCES Groups(group_id)
);

CREATE TABLE GroupJoinRequests (
    request_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    group_id INT,
    status INT,
    handler_id INT,
    request_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    handle_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (group_id) REFERENCES Groups(group_id),
    FOREIGN KEY (handler_id) REFERENCES Users(user_id)
);

CREATE TABLE GroupAnnouncements (
    announcement_id INT AUTO_INCREMENT PRIMARY KEY,
    announcement_content TEXT,
    group_id INT,
    publisher_id INT,
    publish_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES Groups(group_id),
    FOREIGN KEY (publisher_id) REFERENCES Users(user_id)
);