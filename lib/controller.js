var auth = require('./controller/auth');
var contact = require('./controller/contact');
var message = require('./controller/message');
var log = require('./log');
var config = require('./config');

var controller = {
    clients: new Object(),
    route: function (client, packet) {
        if(config.debug)
            console.log("PACKET: %d %d %d", packet.getType(), packet.getSubType(), packet.toBinary().length);

        // IGNORE NON AUTH PACKET WHEN USER IS NOT LOGGED
        if (client.isLogged() === false && packet.getType() != config.packet.PACKET_AUTH) {
            log.info("User must be logged for this packet");
            return;
        }

        switch (packet.getType()) {
            case config.packet.PACKET_AUTH:
                auth.route(client, packet);
                break;
            case config.packet.PACKET_CONTACT:
                contact.route(client, packet);
                break;
            case config.packet.PACKET_MESSAGE:
                message.route(client, packet);
                break;
        }
    }
};

module.exports = controller;