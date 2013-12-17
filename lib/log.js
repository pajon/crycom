var log = require('winston');

log.cerr = function(msg, client) {
    this.error(msg);

    if(client !== undefined) {
        var pack = new Packet({
            data: {
                error: msg
            },
            type:  config.packet.PACKET_AUTH,
            subtype: config.packet.PACKET_AUTH_HASH

        });
        client.send(pack);
    }
}

module.exports = log;