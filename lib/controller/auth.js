var rsa = require('ursa');
var crypto = require('crypto');

var db = require('../database');
var log = require('../log');
var user = require('../model/user');

var controller = require('../controller');

module.exports = {
    route: function (client, packet) {

        switch (packet.getSubType()) {
            case packet.PACKET_AUTH_START:
                var pub = rsa.createPublicKey(packet.getData());

                var hash = crypto.createHash('sha256');
                hash.update(pub.getModulus().toString('hex').toUpperCase());

                console.log(pub.getModulus().toString('hex').toUpperCase());

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

                    console.log(doc.pubkey);

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
                    var pack = new Packet(out, packet.PACKET_AUTH, packet.PACKET_AUTH_HASH);
                    //pack.setType(packet.PACKET_AUTH)
                    //    .setSubType(packet.PACKET_AUTH_HASH)
                    //    .setData(out);

                    doc.update({$set: { status: 1 }}, function () {
                        client.send(pack);
                    });
                });
                break;
            case packet.PACKET_AUTH_DATA:
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
                    var pack = new Packet(null, packet.PACKET_AUTH, packet.PACKET_AUTH_ACCEPT);

                    doc.update({$set: { status: 2 }}, function () {
                        client.logged = true;
                        client.send(pack);

                        require('../controller').clients[client.getAddress()] = client;
                    });
                });
                break;
        }
    }
};