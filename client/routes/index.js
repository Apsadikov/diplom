let express = require('express');
let router = express.Router();
let serverService = require("../service/server-service");
let userService = require("../service/user-service");

router.get('/', function (req, res, next) {
    res.render('index', {userId: userService.generateUserId()});
});

router.get('/servers', function (req, res, next) {
    res.json(serverService.getRabbitMqServers());
});

router.get('/users/:id/server', function (req, res, next) {
    try {
        res.send(serverService.getNodeJSServer(req.params.id));
    } catch (error) {
        res.status(400).end();
    }
});

module.exports = router;
