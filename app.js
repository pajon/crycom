var WebSocketServer = require('ws').Server;
var packet = require('./lib/packet');
var controller = require('./lib/controller');
var client = require('./lib/client');
var db = require('./lib/database');

// CONNECT TO DATABASE
db.connect();

var wss = new WebSocketServer({port: 8000})

wss.on('connection', function (ws) {
    ws.client = new Client(ws);

    ws.on('error', function (error) {
        console.log('error: %s', error);
    });

    ws.on('message', function (message, flags) {
        var p;
        if (flags.binary === undefined) {
            p = new Packet();
            p.fromJson(message.toString());
        } else {
            p = new Packet(message);
        }
        controller.route(ws.client, p);
    });

    ws.on('close', function (code, message) {
        if (ws.client.isLogged()) {
            ws.client.disconnect();
        }

    });
});
