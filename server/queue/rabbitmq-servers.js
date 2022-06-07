let got = require("got");
let amqp = require('amqplib/callback_api');
let serverHash = process.env.HASH;
let rabbitMqConnections = [];
let servers = [];
const EXCHANGE_NAME = "chat";

async function getRabbitMQServers() {
    let response = await got("http://client:3000/servers");
    servers = JSON.parse(response.body);
    return servers;
}

function getRabbitMQConnectionForUser(userId) {
    let hash = parseInt(userId) % servers.length;
    return rabbitMqConnections.filter(connection => hash === connection.hash)[0].connection;
}

module.exports.sendMessage = function (receiverUserId, message) {
    getRabbitMQConnectionForUser(receiverUserId).publish(EXCHANGE_NAME, "", Buffer.from(JSON.stringify(message)));
}

module.exports.sendMessageAll = function (message) {
    for (let i = 0; i < rabbitMqConnections.length; i++) {
        rabbitMqConnections[i].connection.publish(EXCHANGE_NAME, "", Buffer.from(JSON.stringify(message)));
    }
}

let user = "myuser";
let password = "mypassword";
module.exports.createRabbitMqProducerConnection = async function (callback) {
    await getRabbitMQServers();
    let server = servers.filter(server => server.hash === parseInt(serverHash))[0];
    amqp.connect('amqp://' + user + ':' + password + '@' + server.ip + ':5672', function (error0, connection) {
        if (error0) {
            throw error0;
        }
        connection.createChannel(function (error1, channel) {
            if (error1) {
                throw error1;
            }

            channel.assertExchange(EXCHANGE_NAME, "fanout", {
                durable: false
            });

            channel.assertQueue('', {
                exclusive: true
            }, function (error2, queue) {
                if (error2) {
                    throw error2;
                }
                channel.bindQueue(queue.queue, EXCHANGE_NAME, '');

                channel.consume(queue.queue, function (message) {
                    if (message.content) {
                        callback(message.content);
                    }
                }, {
                    noAck: true
                });
            });
        });
    });
}

module.exports.createRabbitMqConsumerConnections = async function () {
    await getRabbitMQServers();
    return new Promise((resolve, reject) => {
        for (let i = 0; i < servers.length; i++) {
            amqp.connect('amqp://' + user + ':' + password + '@' + servers[i].ip + ':5672', function (error0, connection) {
                if (error0) {
                    reject(error0);
                }
                connection.createChannel(function (error1, channel) {
                    if (error1) {
                        reject(error1);
                    }

                    channel.assertExchange(EXCHANGE_NAME, "fanout", {
                        durable: false
                    });

                    rabbitMqConnections.push({
                        hash: servers[i].hash,
                        connection: channel
                    });
                });
            });
        }
        resolve();
    });
}