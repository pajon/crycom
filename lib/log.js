var log = require('winston');

log.cerr = function (err, client) {
    this.error(err.error);

    if (client !== undefined) {
        var pack = new Packet(JSON.stringify({ error: err.error }), err.type, err.subtype);
        client.send(pack);
    }
}

module.exports = log;