var log = require('winston');

log.cerr = function(msg, client) {
    this.error(msg);

    if(client !== undefined) {
        var pack = new Packet(out, config.packet.PACKET_AUTH, config.packet.PACKET_AUTH_HASH);
        client.send(pack);
    }
}

module.exports = log;