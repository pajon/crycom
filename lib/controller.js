var auth = require('./controller/auth');
var contact = require('./controller/contact');
var message = require('./controller/message');
var log = require('./log')

var controller = {
    clients: new Object(),
    route: function (client, packet) {
        console.log("PACKET: %d %d %d", packet.getType(), packet.getSubType(), packet.toBinary().length);

        // IGNORE NON AUTH PACKET WHEN USER IS NOT LOGGED
        if (client.isLogged() === false && packet.getType() != packet.PACKET_AUTH) {
            log.info("User must be logged for this packet");
            return;
        }

        switch (packet.getType()) {
            case packet.PACKET_AUTH:
                auth.route(client, packet);
                break;
            case packet.PACKET_CONTACT:
                contact.route(client, packet);
                break;
            case packet.PACKET_MESSAGE:
                message.route(client, packet);
                break;
        }
    }
};

module.exports = controller;