var mongoose = require('mongoose');
var conversation = require('./conversation');
var Packet = require('../packet');

var obj = mongoose.Schema;

var schemaMessage = new obj({
    parent: { type: mongoose.Schema.ObjectId, ref: 'message' },
    destination_key: Buffer,
    source_key: Buffer,
    data: Buffer,
    source: String,
    destination: String,
    date: String,
    isRead: Boolean
}, { collection: 'message'});

schemaMessage.statics.insert = function (obj) {
    this.create(obj, function (err, doc) {
        if (err) {
            log.error(err);
            return;
        }

        doc.executeConversation();

        var controller = require('../controller');

        var addr = obj.destination;

        if (controller.clients[addr] !== undefined && controller.clients[addr] !== null) {
            // DESTINATION CLIENT IS ONLINE HERE
            var pack = new Packet(doc._id.toString(), config.packet.PACKET_MESSAGE, config.packet.PACKET_MESSAGE_NEW);
            controller.clients[addr].send(pack);
        }
    });
};

schemaMessage.statics.createMsg = function (obj) {
    var msgobj = this;
    if (obj.parent !== undefined && obj.parent !== null) {
        this.findOne({ _id: obj.parent }).exec(function (err, doc) {
            if (err) {
                log.error(err);
                return;
            }

            if (doc === null) {
                log.info('No message');
                return;
            }

            if ((doc.destination !== obj.destination && doc.source !== doc.source) && (doc.destination !== obj.source && doc.source !== doc.destination)) {
                log.info('Wrong parent message!');
                return;
            }

            msgobj.insert(obj);
        });

    } else {
        msgobj.insert(obj);
    }

};


schemaMessage.methods.executeConversation = function (cb) {
    if (this.parent !== null) {

        conversation.findOneAndUpdate({ tree: this.parent }, { $push: { tree: this._id }}, function (err) {
            if (err) {
                log.error(err);
                return;
            }

            if(typeof cb === 'function')
                cb();
        });
    } else {
        conversation.create({tree: [ this._id ]}, function (err, docc) {
            if (err) {
                log.error(err);
                return;
            }

            if(typeof cb === 'function')
                    cb();
        });
    }
}

module.exports = mongoose.model('message', schemaMessage);