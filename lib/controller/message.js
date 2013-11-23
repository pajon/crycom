var db = require('../database');
var msg = require('../model/message');
var conv = require('../model/conversation');
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
        var data = packet.getData();


        msg.createMsg({
            parent: data.parent,
            data: data.data,
            source: client.getAddress(),
            destination: data.destination,
            isRead: false,
            destination_key: db.hextobin(data.destination_key),
            source_key: db.hextobin(data.source_key)
        });
/*
        var execute = function(data) {
            var obj = {
                parent: data.parent,
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

                var addr = data.destination;

                if (controller.clients[addr] !== undefined && controller.clients[addr] !== null) {
                    // DESTINATION CLIENT IS ONLINE HERE

                    console.log(data.parent);

                    doc.executeConversation(function() {
                        var pack = new Packet(doc._id.toString(), config.packet.PACKET_MESSAGE, config.packet.PACKET_MESSAGE_NEW);
                        controller.clients[addr].send(pack);
                    });
                }
            });
        }

        if(data.parent !== undefined && data.parent !== null) {
            msg.findOne({ _id: data.parent }).exec(function (err, doc) {
                if (err) {
                    log.error(err);
                    return;
                }

                if (doc.length == 0) {
                    log.info('No message');
                    return;
                }

                if(doc.destination !== client.getAddress() && doc.source !== client.getAddress()) {
                    console.log(doc.destination);
                    console.log(doc.source);
                    console.log(client.getAddress());
                    log.info('Wrong parent message!');
                    return;
                }

                execute(data);
            });
        } else {
            execute(data);
        }

    */

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