var mongoose = require('mongoose');

var obj = mongoose.Schema;

var schemaNode = new obj({
    address: String,
    online: Boolean
}, { collection: 'node'});

module.exports = mongoose.model('node', schemaNode);