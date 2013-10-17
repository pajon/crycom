var mongoose = require('mongoose');

var obj = mongoose.Schema;

var schemaMessage = new obj({
    key: Buffer,
    data: Buffer,
    source: String,
    destination: String,
    date: String,
    isRead: Boolean
}, { collection: 'message'});

module.exports = mongoose.model('message', schemaMessage);