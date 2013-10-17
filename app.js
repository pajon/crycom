var WebSocketServer = require('ws').Server;
var packet = require('./lib/packet');
var controller = require('./lib/controller');
var client = require('./lib/client');
var db = require('./lib/database');

//db.connect();



var http = require('http')
var port = process.env.PORT || 80;

var server = http.createServer();
server.listen(port);

console.log('http server listening on %d', port);

var wss = new WebSocketServer({server: server, port: 8000})

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
