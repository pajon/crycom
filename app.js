var WebSocketServer = require('ws').Server
var packet = require('./lib/packet')
var controller = require('./lib/controller')
var client = require('./lib/client')
var db = require('./lib/database')
var config = require('./lib/config')
var server = require('./lib/server')

var http = require('http')
var express = require('express')
var app = express()
var port = process.env.PORT || 8000;

app.use(function(req, res, next){
    var hostarr = req.headers.host.split(":");
    var host = null;
    if(typeof hostarr === 'object') {
        host = hostarr[0];
    } else
        host = hostarr;


    if (host.match(/^app.crycom.(loc|net)$/) === null) {
        if(host.match(/crycom.(loc|net)$/) === null)
            res.redirect('http://app.crycom.net' + req.url);
        else {
            var dname = host.split(".");
            res.redirect('http://app.crycom.' + dname[dname.length - 1] + req.url);
        }
    } else {
        next();
    }
});

app.use(express.static(__dirname + '/static'));



var srv = http.createServer(app);
srv.listen(port);


console.log("LISTENING: %d", port);

// CONNECT TO DATABASE
db.connect();

var wss = new WebSocketServer({server: srv})


wss.on('connection', function (ws) {
    ws.client = new Client(ws);

    server.addClient(ws.client);


    var interval = setInterval(function () {
        var pack = new Packet(null, config.packet.PACKET_SYSTEM, config.packet.PACKET_SYSTEM_LIVE);
        ws.send(pack.toJson());
    }, config.client.noop * 1000);

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

        clearInterval(interval);
    });
});
