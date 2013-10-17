var db = require('../database');
var user = require('../model/user');
var log = require('../log');
var rsa = require('ursa');

var contact = {
    route: function (client, packet) {

        switch (packet.getSubType()) {
            case packet.PACKET_CONTACT_LIST:

                user.findOne({ address: client.getAddress() }).populate('contact').exec(function (err, doc) {
                    if (err) {
                        log.error("Error: %s!", err);
                        return;
                    }

                    if (doc === null) {
                        log.info("User not exist!");
                        return;
                    }

                    var contacts = doc.contact;

                    var length = 0;
                    var tmp = new Array();
                    for (var i = 0; i < contacts.length; i++) {
                        var name = contacts[i].name + " " + contacts[i].surname;
                        var binkey = db.hextobin(contacts[i].address);

                        tmp.push(name);
                        tmp.push(binkey);

                        length += name.length;
                        length += 1; // zero byte
                        length += 32; // address
                    }

                    var out = new Buffer(length);
                    var index = 0;
                    for (var i = 0; i < tmp.length / 2; i++) {
                        var name = tmp[i * 2];
                        var binkey = tmp[i * 2 + 1];

                        out.write(name, index, name.length);
                        index += name.length;
                        out.writeInt8(0, index);
                        index += 1;
                        binkey.copy(out, index);
                        index += 32;

                    }

                    var pack = new Packet(out, packet.PACKET_CONTACT, packet.PACKET_CONTACT_LIST);
                    client.send(pack);
                });
                break;
            case packet.PACKET_CONTACT_ADD:
                user.findOne({ address: client.getAddress() }).exec(function (err, doc) {
                    if (err) {
                        log.error("Error: %s!", err);
                        return;
                    }

                    if (doc === null) {
                        log.info("User not exist!");
                        return;
                    }

                    var addr = db.bintohex(packet.getData());

                    user.findOne({ address: addr }).exec(function (err, ndoc) {
                        if (err) {
                            log.error("Error: %s!", err);
                            return;
                        }

                        if (ndoc === null) {
                            log.info("User not exist!");
                            var pack = new Packet(null, packet.PACKET_CONTACT, packet.PACKET_CONTACT_REJECT);
                            pack.setData("Unknown contact!");
                            client.send(pack);
                            return;
                        }

                        if (doc.contact === undefined) {
                            doc.contact = new Array();
                        } else {
                            if (doc.contact.indexOf(ndoc._id) !== -1) {
                                // CONTACT IS ALREADY ADDED
                                var pack = new Packet(null, packet.PACKET_CONTACT, packet.PACKET_CONTACT_REJECT);
                                pack.setData("Already exists");

                                // SEND RESPONSE
                                client.send(pack);
                                return;
                            }
                        }

                        doc.contact.push(ndoc._id);

                        doc.save(function (err) {
                            var pack = new Packet();
                            pack.setType(packet.PACKET_CONTACT);

                            // CHECK ERROR
                            if (err) {
                                log.error("Error: %s!", err);
                                pack.setSubType(packet.PACKET_CONTACT_REJECT);
                            } else
                                pack.setSubType(packet.PACKET_CONTACT_ACCEPT);

                            // SEND RESPONSE
                            client.send(pack);
                        });
                    });

                });
                break;
            case packet.PACKET_CONTACT_PUBKEY:
                user.findOne({ address: db.bintohex(packet.getData()) }).exec(function (err, doc) {
                    if (err) {
                        log.error("Error: %s!", err);
                        return;
                    }

                    if (doc === null) {
                        log.info("User not exist!");
                        return;
                    }

                    if(doc.pubkey === undefined) {
                        log.info("Client dont have pubkey");
                        return;
                    }

                    var pub = rsa.createPublicKey(doc.pubkey);

                    var modulus = pub.getModulus().toString('hex').toUpperCase();


                    var outData = new Buffer(packet.getData().length + modulus.length);
                    packet.getData().copy(outData);
                    outData.write(modulus, packet.getData().length);


                    var out = new Packet(outData, packet.PACKET_CONTACT, packet.PACKET_CONTACT_PUBKEY);
                    client.send(out);
                });
                break;
        }
    }
};

module.exports = contact;