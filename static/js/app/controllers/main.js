define(['./module'], function (chatApp) {
    'use strict';

    chatApp.run(['websocket', 'cc-crypt', 'cc-msg', 'cc-contact', '$location', function (ws, crypt, ccmsg, cccontact, $location) {
        ws.handlePacket({type: PACKET_AUTH, subtype: PACKET_AUTH_HASH}, function (packet) {
            var res = crypt.decrypt(bintohex(packet.getData()), "byte");

            if (res === null)
                alert("ERROR DECODE");

            var tmp = new Packet(res, PACKET_AUTH, PACKET_AUTH_DATA);
            ws.send(tmp.toBinary());
        });

        ws.handlePacket({type: PACKET_AUTH, subtype: PACKET_AUTH_REJECT}, function (packet) {
            var data = packet.getData();

            // USER WITH THIS CERTIFICATE DONT EXISTS
            if (data.error_code === 100) {
                // TODO: REWORK (example: IMPORT DIALOG)
                crypt.clean();
            }
        });

        ws.handlePacket({type: PACKET_AUTH, subtype: PACKET_AUTH_ACCEPT}, function (packet) {
            // LOAD CONTACTS
            cccontact.reload();

            // LOAD MESSAGES
            var packet = new Packet(null, PACKET_MESSAGE, PACKET_MESSAGE_QUERY);
            packet.setData({
                source: null
            });

            ws.send(packet.toJson());

            //ccmsg.reload();
        });

        ws.handlePacket({type: PACKET_SYSTEM, subtype: PACKET_SYSTEM_LIVE}, function (packet) {
            // IGNORE THIS
        });

        if ($location.host() === 'app.crycom.loc')
            ws.connect("ws://localhost:5000/");
        else
            ws.connect("ws://server.crycom.net/");
    }]);
});