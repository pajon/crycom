var rsa = require('ursa');
var crypto = require('crypto');

var db = require('../database');
var config = require('../config');
var log = require('../log');
var user = require('../model/user');

var controller = require('../controller');

module.exports = {
    route: function (client, packet) {

        switch (packet.getSubType()) {
            case config.packet.PACKET_AUTH_REGISTER:

                var data = packet.getData();

                if(data.hasOwnProperty('pem') && data.hasOwnProperty('name') && data.hasOwnProperty('email')) {
                    var pub = rsa.createPublicKey(data.pem);

                    var hash = crypto.createHash('sha256');
                    hash.update(pub.getModulus().toString('hex').toUpperCase());
                    var key = hash.digest('hex');
                }

                user.findOne({ address: key }, null, function (err, doc) {
                    if (err) {
                        log.error("Error: %s!", err);
                        return;
                    }

                    if (doc === null) {
                        var obj = {
                            address: key,
                            pubkey: data.pem,
                            name: data.name,
                            email: data.email,
                            status: 0
                        };

                        user.create(obj, function (err, doc) {
                            if (err) {
                                log.error(err);
                                return;
                            }

                            var pack = new Packet(null, config.packet.PACKET_AUTH, config.packet.PACKET_AUTH_REGISTER_ACCEPT);
                            pack.switchToJson();
                            client.send(pack);

                        });

                    } else {
                        log.info("User exist! Failed register !!");
                        return;
                    }
                });
                break;
            case config.packet.PACKET_AUTH_START:
                var pdata = packet.getData();
                var pub = rsa.createPublicKey(pdata.public_key);

                var hash = crypto.createHash('sha256');
                hash.update(pub.getModulus().toString('hex').toUpperCase());

                var key = hash.digest('hex');
                client.setAddress(key);


                user.findOne({ address: key }, null, function (err, doc) {
                    if (err) {
                        log.error("Error: %s!", err);
                        return;
                    }

                    if (doc === null) {
                        log.info("User not exist!");
                        return;
                    }

                    if(doc.pubkey === undefined) {
                        doc.pubkey = packet.getData();

                        doc.save(function() {

                        })
                    }

                    //if (doc.status > 0) {
                    //    log.info('ALREADY LOGGED ??');
                    //    return;
                    //}


                    // GENERATE HASH
                    var tmp = client.genHash();
                    // ENCRYPT
                    var out = pub.encrypt(tmp, 'binary', undefined, rsa.RSA_PKCS1_PADDING);

                    // BUILD PACKET
                    var pack = new Packet(out, config.packet.PACKET_AUTH, config.packet.PACKET_AUTH_HASH);

                    doc.update({$set: { status: 1 }}, function () {
                        client.send(pack);
                    });
                });
                break;
            case config.packet.PACKET_AUTH_DATA:
                user.findOne({ address: client.getAddress() }, null, function (err, doc) {
                    if (err) {
                        log.error("Error: %s!", err);
                        return;
                    }

                    if (doc === null) {
                        log.info("User not exist!");
                        return;
                    }

                    //if(doc.status != 1) {
                    //    console.log('WRONG CLIENT STATUS');
                    //    return;
                    //}

                    if (client.checkHash(packet.getData()) === false) {
                        log.info('AUTH: WRONG DATA');
                        return;
                    }

                    // BUILD PACKET
                    var pack = new Packet(null, config.packet.PACKET_AUTH, config.packet.PACKET_AUTH_ACCEPT);

                    doc.update({$set: { status: 2 }}, function () {
                        client.logged = true;
                        client.onLogin();
                        client.send(pack);

                        require('../controller').clients[client.getAddress()] = client;
                    });
                });
                break;
        }
    }
};