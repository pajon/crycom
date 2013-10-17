var db = require('../database');
var msg = require('../model/message');
var config = require('../config');
var log = require('../log');
var user = require('../model/user');

var message = {
    route: function (client, packet) {

        switch (packet.getSubType()) {
            case packet.PACKET_MESSAGE:

                var addrBinarySize = config.address.size / 2;
                var data = packet.getData();

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

                var obj = {
                    data: msgdata,
                    source: client.getAddress(),
                    destination: db.bintohex(dest),
                    isRead: false,
                    key: key
                };

                msg.create(obj, function (err, doc) {
                    if (err) {
                        log.error(err);
                        return;
                    }

                    var controller = require('../controller');

                    var addr = db.bintohex(dest);

                    if (controller.clients[addr] !== undefined &&controller.clients[addr] !== null) {
                        // DESTINATION CLIENT IS ONLINE HERE

                        var pack = new Packet(doc._id.toString(), packet.PACKET_MESSAGE, packet.PACKET_MESSAGE_NEW);
                        controller.clients[addr].send(pack);
                    }

                    /*
                     user.findOne({ address: addr }, function(err, doc) {
                     console.log(doc);
                     });
                     */
                });

                break;
            case packet.PACKET_MESSAGE_LIST:

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

                    var buffer = new Buffer(docs.length * config.message.size)

                    for (var i = 0; i < docs.length; i++) {
                        arr.push((docs[i]._id.toString()));
                        buffer.write(docs[i]._id.toString(), i * config.message.size);
                    }


                    //var pack = new Packet(buffer, packet.PACKET_MESSAGE, packet.PACKET_MESSAGE_LIST);
                    var pack = new Packet(arr, packet.PACKET_MESSAGE, packet.PACKET_MESSAGE_LIST);
                    pack.switchToJson();
                    client.send(pack);
                });
                break;
            case packet.PACKET_MESSAGE_GET:
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

                    var index = 0;
                    var buffer = new Buffer(
                        config.message.size / 2 +
                            config.address.size / 2 +
                            4 + 4 + doc.key.length + doc.data.length
                    );

                    db.hextobin(doc._id.toString()).copy(buffer);
                    index += (config.message.size / 2); // BINARY SIZE

                    if (doc.source == client.getAddress()) {
                        db.hextobin(doc.destination.toString()).copy(buffer, index);
                    } else {
                        db.hextobin(doc.source.toString()).copy(buffer, index);
                    }
                    index += (config.address.size / 2);

                    buffer.writeInt32LE(doc.key.length, index);
                    index += 4;
                    buffer.writeInt32LE(doc.data.length, index);
                    index += 4;

                    doc.key.copy(buffer, index);
                    index += doc.key.length;
                    doc.data.copy(buffer, index);
                    index += doc.data.length;

                    var pack = new Packet(buffer, packet.PACKET_MESSAGE, packet.PACKET_MESSAGE_GET);
                    client.send(pack);
                });
                break;
        }
    }
};

module.exports = message;