var db = require('../database');
var msg = require('../model/message');
var config = require('../config');
var log = require('../log');
var user = require('../model/user');
var Packet = require('../packet');

var message = {
    _methods: {},
    route: function (client, packet) {
        var fn = this._methods[packet.getSubType()];

        if (fn !== undefined)
            fn(client, packet);
    },
    handle: function (subtype, fn) {
        this._methods[subtype] = fn;
        return this;
    }
};

message
    .handle(config.packet.PACKET_MESSAGE, function (client, packet) {
        //var addrBinarySize = config.address.size / 2;
        var data = packet.getData();

        console.log(data);
        /*
        // SET DESTINATION
        var dest = new Buffer(addrBinarySize);
        data.copy(dest, 0, 0, addrBinarySize);

        // LOAD KEY LENGTH
        var length = data.readInt16LE(addrBinarySize);

        // LOAD KEY
        var key = new Buffer(length);
        data.copy(key, 0, addrBinarySize + 2, addrBinarySize + 2 + length);

        // SET MESSAGE
        var msgdata = new Buffer(data.length - (addrBinarySize + 2 + length));
        data.copy(msgdata, 0, addrBinarySize + 2 + length);
        */
        var obj = {
            data: data.data,
            source: client.getAddress(),
            destination: data.destination,
            isRead: false,
            destination_key: db.hextobin(data.destination_key),
            source_key: db.hextobin(data.source_key)
        };

        msg.create(obj, function (err, doc) {
            if (err) {
                log.error(err);
                return;
            }

            var controller = require('../controller');

            var addr = db.bintohex(data.destination);

            console.log(addr);
            console.log(controller.clients[addr]);
            if (controller.clients[addr] !== undefined && controller.clients[addr] !== null) {
                // DESTINATION CLIENT IS ONLINE HERE

                var pack = new Packet(doc._id.toString(), config.packet.PACKET_MESSAGE, config.packet.PACKET_MESSAGE_NEW);
                controller.clients[addr].send(pack);
            }
        });
    })
    .handle(config.packet.PACKET_MESSAGE_LIST, function (client, packet) {
        msg.find({ destination: client.getAddress() }).limit(10).sort('-_id').exec(function (err, docs) {
            if (err) {
                log.error(err);
                return;
            }

            if (docs.length == 0) {
                log.info('No messages');
                return;
            }

            var arr = new Array();

            for (var i = 0; i < docs.length; i++) {
                arr.push((docs[i]._id.toString()));
            }

            var pack = new Packet(arr, config.packet.PACKET_MESSAGE, config.packet.PACKET_MESSAGE_LIST);
            pack.switchToJson();
            client.send(pack);
        });
    })
    .handle(config.packet.PACKET_MESSAGE_GET, function (client, packet) {
        var data = packet.getData();

        if (data === null) {
            log.error("Wrong get packet # null!");
            return;
        }

        if (data.length !== config.message.size) {
            log.error("Wrong get packet # wrong size!");
            return;
        }

        var msgid = "";
        for (var i = 0; i < config.message.size; i++)
            msgid += String.fromCharCode(data[i]);

        msg.findById(msgid, function (err, doc) {
            if (err) {
                log.error(err);
                return;
            }

            if (doc === null) {
                log.info("Message not exists!");
                return;
            }

            var key = client.getAddress() == doc.source.toString() ? doc.source_key.toString('base64') : doc.destination_key.toString('base64');

            var msg = {
                id: doc._id.toString(),
                source: doc.source.toString(),
                destination: doc.destination.toString(),
                key: key,
                data: doc.data.toString('base64')
            };

            var pack = new Packet(JSON.stringify(msg), config.packet.PACKET_MESSAGE, config.packet.PACKET_MESSAGE_GET);
            client.send(pack);
        });
    })
    .handle(config.packet.PACKET_MESSAGE_QUERY, function (client, packet) {
        var query = {};

        var data = packet.getData();

        if(data.source === null) {
            query.destination = client.getAddress();
        } else if(data.source !== undefined ) {
            //TODO: CHECK ADDRESS
            query.source = data.source;

        }


        console.log(query);

        msg.find(query).limit(10).sort('-_id').exec(function(err, docs) {
            if (err) {
                log.error(err);
                return;
            }

            if (docs.length == 0) {
                log.info('No messages');
                return;
            }

            var arr = new Array();
            for (var i = 0; i < docs.length; i++) {
                arr.push((docs[i]._id.toString()));
            }

            var pack = new Packet(arr, config.packet.PACKET_MESSAGE, config.packet.PACKET_MESSAGE_LIST);
            pack.switchToJson();
            client.send(pack);
        });
    });

module.exports = message;