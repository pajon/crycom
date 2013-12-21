define(['./module'], function (serviceModule) {
    'use strict';

    serviceModule.factory('cc-gateway', ['websocket', 'cc-crypt', function (ws, crypt) {

        var Service = {};

        Service.sendMessage = function (data, contact, parent) {
            var message = data;

            if (parent === undefined)
                parent = null;

            // GENERATE KEY
            var key = CryptoJS.lib.WordArray.random(32);
            var iv = CryptoJS.lib.WordArray.random(32);
            var encrypted = CryptoJS.AES.encrypt(message, key, {iv: iv});

            message = encrypted.toString();

            var p = new Packet(null, PACKET_MESSAGE, PACKET_MESSAGE);

            p.setData({
                parent: parent,
                destination: bintohex(contact.getAddress()),
                data: message,
                destination_key: contact.encrypt(key.toString() + iv.toString()),
                source_key: crypt.encrypt(key.toString() + iv.toString()),
                sign: crypt.sign(data)
            });
            ws.send(p.toJson());
        }

        return Service;
    }]);
});