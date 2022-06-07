let nodejsServers = require("../nodejs-servers.json");
let rabbitmqServers = require("../rabbitmq-servers.json");

module.exports.getNodeJSServer = function (userId) {
    if (isNaN(parseInt(userId))) {
        throw new Error("id is not int");
    }
    let hash = parseInt(userId) % 3;
    let availableServers = nodejsServers.filter(server => server.hash === hash);
    return availableServers[getRandomIntInclusive(availableServers.length)];
}

module.exports.getRabbitMqServers = function () {
    return rabbitmqServers;
}

function getRandomIntInclusive(to) {
    return Math.floor(Math.random() * to);
}
