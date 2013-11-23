var mongoose = require('mongoose');

var obj = mongoose.Schema;

var schemaMessage = new obj({
    tree: [
        { type: mongoose.Schema.ObjectId, ref: 'message' }
    ]
}, { collection: 'conversation'});

module.exports = mongoose.model('conversation', schemaMessage);