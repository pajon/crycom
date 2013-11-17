var mongoose = require('mongoose');

var obj = mongoose.Schema;

var schemaUser = new obj({
    address: String,
    pubkey: Buffer,
    contact: [
        { type: mongoose.Schema.ObjectId, ref: 'user' }
    ],
    name: String,
    email: String,
    status: Number
}, { collection: 'user'});

module.exports = mongoose.model('user', schemaUser);