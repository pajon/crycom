var rsa = require('ursa');
var crypto = require('crypto');
var config = require('../config');

var mongoose = require('mongoose');

var obj = mongoose.Schema;

var schemaUser = new obj({
    address: String,
    pubkey: Buffer,
    contact: [
        {
            type: mongoose.Schema.ObjectId,
            ref: 'user'
        }
    ],
    name: String,
    email: String,
    status: Number
}, { collection: 'user'});


schemaUser.statics.insert = function (client, data) {
    var userobj = this;

    var pub = rsa.createPublicKey(data.pem);

    var hash = crypto.createHash('sha256');
    hash.update(pub.getModulus().toString('hex').toUpperCase());
    var key = hash.digest('hex');


    this.findOne({ address: key }, null, function (err, doc) {
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

            userobj.create(obj, function (err, doc) {
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
};

module.exports = mongoose.model('user', schemaUser);