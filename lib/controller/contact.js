var db = require('../database');
var user = require('../model/user');
var log = require('../log');
var rsa = require('ursa');
var config = require('../config');

var contact = {
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

if (config.sandbox) {
    contact.handle(config.packet.PACKET_CONTACT_LIST, function (client, packet) {
        user.find({}).exec(function (err, docs) {
            if (err) {
                log.error("Error: %s!", err);
                return;
            }

            var tmp = new Array();
            for (var i = 0; i < docs.length; i++) {
                if (client.getAddress() == docs[i].address)
                    continue;

                tmp.push({
                    name: docs[i].name,
                    key: docs[i].address
                });
            }

            var out = JSON.stringify(tmp);

            var pack = new Packet(out, config.packet.PACKET_CONTACT, config.packet.PACKET_CONTACT_LIST);
            client.send(pack);
        });
    });
} else {
    contact.handle(config.packet.PACKET_CONTACT_LIST, function (client, packet) {
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
            var tmp = new Array();

            for (var i = 0; i < contacts.length; i++) {
                tmp.push({
                    name: contacts[i].name,
                    key: contacts[i].address
                });
            }

            var out = JSON.stringify(tmp);

            var pack = new Packet(null, config.packet.PACKET_CONTACT, config.packet.PACKET_CONTACT_LIST);
            pack.setData(out);
            client.send(pack);
        });
    });
}

contact.handle(config.packet.PACKET_CONTACT_ADD, function (client, packet) {
    user.findOne({ address: client.getAddress() }).exec(function (err, doc) {
        if (err) {
            log.error("Error: %s!", err);
            return;
        }

        if (doc === null) {
            log.info("User not exist!");
            return;
        }

        var addr = packet.getData().address;

        user.findOne({ address: addr }).exec(function (err, ndoc) {
            if (err) {
                log.error("Error: %s!", err);
                return;
            }

            if (ndoc === null) {
                log.info("User not exist!");
                var pack = new Packet(null, config.packet.PACKET_CONTACT, config.packet.PACKET_CONTACT_REJECT);
                pack.setData("Unknown contact!");
                client.send(pack);
                return;
            }

            if (doc.contact === undefined) {
                doc.contact = new Array();
            } else {
                if (doc.contact.indexOf(ndoc._id) !== -1) {
                    // CONTACT IS ALREADY ADDED
                    var pack = new Packet(null, config.packet.PACKET_CONTACT, config.packet.PACKET_CONTACT_REJECT);
                    pack.setData("Already exists");

                    // SEND RESPONSE
                    client.send(pack);
                    return;
                }
            }

            doc.contact.push(ndoc._id);
            ndoc.contact.push(doc._id);


            doc.save(function (err) {
                if (err) {
                    log.error("Error: %s!", err);
                    var pack = new Packet(null, config.packet.PACKET_CONTACT, config.packet.PACKET_CONTACT_REJECT);
                    return client.send(pack);
                }


                ndoc.save(function (err) {
                    if (err) {
                        log.error("Error: %s!", err);
                        var pack = new Packet(null, config.packet.PACKET_CONTACT, config.packet.PACKET_CONTACT_REJECT);
                        return client.send(pack);
                    }


                    // SUCCESSFULL ADDED
                    var pack = new Packet(null, config.packet.PACKET_CONTACT, config.packet.PACKET_CONTACT_ACCEPT);

                    // SEND RESPONSE
                    client.send(pack);
                });
            });
        });

    });
});

contact.handle(config.packet.PACKET_CONTACT_PUBKEY, function (client, packet) {
    user.findOne({ address: db.bintohex(packet.getData()) }).exec(function (err, doc) {
        if (err) {
            log.error("Error: %s!", err);
            return;
        }

        if (doc === null) {
            log.info("User not exist!");
            return;
        }

        if (doc.pubkey === undefined) {
            log.info("Client dont have pubkey");
            return;
        }

        var pub = rsa.createPublicKey(doc.pubkey);

        var modulus = pub.getModulus().toString('hex').toUpperCase();


        var outData = new Buffer(packet.getData().length + modulus.length);
        packet.getData().copy(outData);
        outData.write(modulus, packet.getData().length);


        var out = new Packet(outData, config.packet.PACKET_CONTACT, config.packet.PACKET_CONTACT_PUBKEY);
        client.send(out);
    });
});

module.exports = contact;