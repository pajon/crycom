var WebSocketServer = require('ws').Server;
var packet = require('./lib/packet');
var controller = require('./lib/controller');
var client = require('./lib/client');
var db = require('./lib/database');

var http = require('http')
    , express = require('express')
    , app = express()
    , port = process.env.PORT || 8000;

app.use(express.static(__dirname + '/static'));

var server = http.createServer(app);
server.listen(port);


console.log("LISTENING: %d", port);

// CONNECT TO DATABASE
db.connect();

var wss = new WebSocketServer({server: server})

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
