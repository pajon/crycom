var rsa = require('ursa');
var crypto = require('crypto');

var db = require('../database');
var config = require('../config');
var log = require('../log');
var user = require('../model/user');

var controller = require('../controller');

var auth = {
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

auth.handle(config.packet.PACKET_AUTH_REGISTER, function (client, packet) {
    var data = packet.getData();
    user.insert(client, data);
});

auth.handle(config.packet.PACKET_AUTH_START, function (client, packet) {
    var pdata = packet.getData();
    if(pdata.hasOwnProperty("public_key") === false)
        return console.log("")
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

            var pack = new Packet({
                error_code: config.error.USER_DONT_EXISTS,
                error: "Client with this certificate don't exists"
            }, config.packet.PACKET_AUTH, config.packet.PACKET_AUTH_REJECT);
            pack.switchToJson();

            client.send(pack);
            return;
        }

        if (doc.pubkey === undefined) {
            doc.pubkey = packet.getData();

            doc.save(function () {

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
    })
});

auth.handle(config.packet.PACKET_AUTH_DATA, function (client, packet) {
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
});


module.exports = auth;