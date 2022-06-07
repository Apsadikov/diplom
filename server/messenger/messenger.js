let rabbitMqServers = require("../rabbitmq/rabbitmq-servers");

module.exports.init = function (server) {
    const io = require('socket.io')(server, {transports: ["websocket"]})
    io.use((socket, next) => {
        socket.user_id = socket.handshake.query.user_id;
        socket.user_name = socket.handshake.query.user_name;
        next();
    });

    rabbitMqServers.createRabbitMqConsumerConnections();
    rabbitMqServers.createRabbitMqProducerConnection((message) => {
        message = JSON.parse(message.toString());
        if (message.type === "leave") {
            io.emit("leave", message.body);
        }
        if (message.type === "join") {
            if (message.body.receiver_user_id) {
                io.to(message.body.receiver_user_id).emit("join", message.body);
            } else {
                io.emit("join", message.body);
            }
        }
        if (message.type === "message") {
            io.to(message.body.receiver_user_id).emit("message", message.body);
        }
    });

    io.on('connection', (socket) => {
        socket.join(socket.user_id);

        socket.on("disconnect", () => {
            rabbitMqServers.sendMessageAll({
                type: "leave",
                body: {
                    user_id: socket.user_id
                }
            });
        });

        socket.on("hello", function (message) {
            if (typeof message === "string") {
                message = JSON.parse(message);
            }
            if (message.receiver_user_id) {
                rabbitMqServers.sendMessage(message.receiver_user_id, {
                    type: "join",
                    body: {
                        user_id: socket.user_id,
                        user_name: socket.user_name,
                        receiver_user_id: message.receiver_user_id,
                        is_reply: true
                    }
                })
            } else {
                rabbitMqServers.sendMessageAll({
                    type: "join",
                    body: {
                        user_id: socket.user_id,
                        user_name: socket.user_name
                    }
                });
            }
        });

        socket.on("message", async function (message) {
            message = JSON.parse(message);
            message.sender_user_id = socket.user_id;
            rabbitMqServers.sendMessage(message.receiver_user_id, {
                type: "message",
                body: message
            });
        });

    });
}