define(['./module'], function (serviceModule) {
    'use strict';

    serviceModule.factory('cc-msg', ['websocket', 'cc-crypt', 'cc-contact', function (ws, crypt, contact) {
        var id = 0;
        var Service = {};

        var ready = false;
        var callback = new Array();

        Service.messages = {};
        Service.renderMessage = new Array();

        Service.register = function (cb) {
            callback[id] = cb;

            if (this.isReady())
                Service.fire();

            return id++;
        };

        Service.unregister = function (id) {
            if (callback[id] !== undefined)
                delete callback[id];
        }

        Service.fire = function () {
            callback.map(function (item) {
                item();
            });

            ready = true;
        };

        Service.check = function () {
            for (var i = 0; i < this.renderMessage.length; i++) {
                var k = this.renderMessage[i];

                if (this.messages.hasOwnProperty(k) === false)
                    return;
            }

            this.fire();
        };

        Service.isReady = function () {
            return ready;
        };

        /*
         Service.reload = function() {
         pn = new Packet(null, PACKET_MESSAGE, PACKET_MESSAGE_LIST);
         ws.send(pn.toJson());
         }
         */

        Service.addMessage = function (id, message) {
            if (this.messages.hasOwnProperty(id)) {
                console.log("[Warning] Message is already in store");
                return false;
            }
            this.messages[id] = message;
        };

        Service.getMessage = function (id) {
            if (this.messages.hasOwnProperty(id))
                return this.messages[id];
            else {
                return null;
            }
        };

        Service.render = function () {
            var tmp = [];

            for (var i = 0; i < this.renderMessage.length; i++) {
                var k = this.renderMessage[i];

                var date = new Date(ObjectIDtoTime(k) * 1000);

                // FORMAT DATE
                var stringDate =
                    fixZero(date.getDay()) + "." +
                        fixZero(date.getMonth()) + "." +
                        (1900 + date.getYear()) + " " +
                        fixZero(date.getHours()) + ":" +
                        fixZero(date.getMinutes());

                var addr = (Service.messages[k].getSource() == crypt.getAddress() ? Service.messages[k].getDestination() : Service.messages[k].getSource());

                tmp.push({
                    id: k,
                    addr: addr,
                    contact_name: contact.get(addr).getName(),
                    message: Service.messages[k].getData(),
                    date: stringDate
                });
            }

            return tmp;
        };

        ws.handlePacket({type: PACKET_MESSAGE, subtype: PACKET_MESSAGE_LIST}, function (packet) {
            var data = packet.getData();
            var plength = data.length;

            Service.renderMessage = new Array();
            for (var i = 0; i < plength; i++)
                Service.renderMessage[Service.renderMessage.length] = data[i];

            for (var i = 0; i < Service.renderMessage.length; i++) {
                // CHECK MESSAGE CACHE
                if (Service.messages.hasOwnProperty(Service.renderMessage[i]))
                    continue;

                var pn = new Packet(Service.renderMessage[i], PACKET_MESSAGE, PACKET_MESSAGE_GET);
                ws.send(pn.toBinary());
            }
            Service.check();
        });

        ws.handlePacket({type: PACKET_MESSAGE, subtype: PACKET_MESSAGE_GET}, function (packet) {
            var data = $.parseJSON(packet.getData());

            var msg = new Message();
            msg.setId(data.id);
            msg.setSource(data.source);
            msg.setDestination(data.destination);
            msg.setKey(hextobin(b64tohex(data.key)));
            msg.setData(hextobin(b64tohex(data.data)));

            msg.setData(msg.decrypt(crypt));

            var succ = function (msg) {
                Service.addMessage(msg.getId(), msg);
                Service.check();
            }

            // CHECK MESSAGE SIGN
            if (data.sign === undefined)
                return console.log("Undefined message signature !!!");
            if (data.source == crypt.getAddress()) {
                if (crypt.verify(msg.getData(), data.sign) === false)
                    return console.log("Wrong sign hash !!!");

                succ(msg);
            } else {
                contact.getAsync(data.source, function () {
                    if (contact.get(data.source).rsa.verifyHexSignatureForMessage(data.sign, msg.getData()) === false)
                        return $.notify("Wrong message signature. Probably fake message !!!", "error");
                    else
                        succ(msg);
                }, 'pubkey');
            }
        });

        ws.handlePacket({type: PACKET_MESSAGE, subtype: PACKET_MESSAGE_NEW}, function (packet) {
            if (Service.messages.hasOwnProperty(packet.getData()))
                return;

            Service.renderMessage.unshift(packet.getData());

            var pn = new Packet(packet.getData(), PACKET_MESSAGE, PACKET_MESSAGE_GET);
            ws.send(pn.toBinary());
        });

        return Service;
    }]);
});