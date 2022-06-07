let usernameText = document.getElementById("username-text");
let username = document.getElementById("username");
let loginForm = document.getElementById("login-form");
let userId = parseInt(document.querySelector('meta[name="user-id"]').content);
let messageText = document.getElementById("message-text");
let messageList = document.getElementById("messages");
let userList = document.getElementById("users");
let serverId = document.getElementById("server-id");
let connection = null;
let currentUserId = null;

async function getServer(userId) {
    let result = await fetch("http://localhost:3000/users/" + userId + "/server");
    return await result.json();
}

async function connect() {
    if (usernameText.value && usernameText.value.trim().length !== 0) {
        loginForm.style.display = "none";
        let server = await getServer(userId);
        serverId.innerHTML = (server.hash + 1);
        username.innerHTML = usernameText.value.trim();
        createWebSocketConnection(userId, server.ip, server.port);
    }
}

function createWebSocketConnection(userId, ip, port) {
    connection = io('http://' + ip + ":" + port, {
        transports: ['websocket'],
        query: {
            user_id: userId,
            user_name: username.innerHTML
        },
    });

    connection.on("connect", function () {
        connection.emit('hello', {});
    });

    connection.on("message", function (message) {
        receiveMessage(message.sender_user_id, message.text);
    });

    connection.on("join", function (message) {
        userJoin(message.user_id, message.user_name);
        if (!message.is_reply) {
            connection.emit('hello', JSON.stringify({
                receiver_user_id: message.user_id,
            }));
        }
    });

    connection.on("leave", function (message) {
        userLeave(message.user_id);
    });

    connection.on("disconnect", function () {
        userList.innerHTML = "";
        hideDialog();
    })
}

function test(userId) {
    for (let i = 0; i < 1000; i++) {
        setTimeout(() => {
            messageText.value = "test " + i;
            sendMessage();
        }, 100 * i);
    }
}

function sendMessage() {
    if (!currentUserId) {
        return;
    }
    if (messageText.value && messageText.value.trim().length !== 0) {
        connection.emit('message', JSON.stringify({
            receiver_user_id: currentUserId,
            text: messageText.value.trim()
        }));
        messageList.innerHTML += '<div class="message"><div class="message-right">' + messageText.value.trim() + '</div></div>';
        messageText.value = "";
        messageList.scrollTop = messageList.scrollHeight;
    }
}

function receiveMessage(userId, text) {
    userId = parseInt(userId);
    if (currentUserId && userId === currentUserId) {
        messageList.innerHTML += '  <div class="message-left">' + text + '</div>';
    }
}

let lastUserElement = null;

function selectDialog(event, userId) {
    hideDialog();
    if (lastUserElement) {
        lastUserElement.style.background = "#fff";
    }
    lastUserElement = event;
    lastUserElement.style.background = "#eee";
    currentUserId = userId;
}

function hideDialog() {
    currentUserId = null;
    messageText.innerHTML = "";
    messageList.innerHTML = "";
}

function userLeave(userId) {
    userId = parseInt(userId);
    if (document.querySelector("[data-user-id='" + userId + "']")) {
        document.querySelector("[data-user-id='" + userId + "']").remove();
    }
    if (userId === currentUserId) {
        hideDialog();
    }
}

function userJoin(userId, userName) {
    if (parseInt(userId) === parseInt(document.querySelector('meta[name="user-id"]').content)) {
        console.log("ok");
        return;
    }
    userLeave(userId);
    let html = '<div class="user" data-user-id="' + userId + '" onclick="selectDialog(this,' + userId + ')">' + userName + '</div>';
    userList.insertBefore(createHTMLFromText(html), userList.firstChild);
}

function createHTMLFromText(string) {
    let element = document.createElement('div');
    element.innerHTML = string.trim();
    return element.firstChild;
}