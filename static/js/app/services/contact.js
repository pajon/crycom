define(['./module'], function (serviceModule) {
    'use strict';

    serviceModule.factory('cc-contact', ['websocket', '$q', function (ws, $q) {
        var callback_id = 0;
        var callback = new Array();
        var callback_contact_id = 0;
        var callback_contact = new Array();
        var Service = {};

        var ready = false;
        Service.contacts = {};

        Service.register = function (cb) {
            callback[callback_id] = cb;

            if (this.isReady())
                Service.fire();

            return callback_id++;
        };

        Service.unregister = function (id) {
            if (callback[id] !== undefined)
                delete callback[id];
        }

        Service.fire = function () {
            callback.map(function (item) {
                item();
            });

            var run = function (item, callback_contact, index) {
                item.deffered.resolve(Service.contacts[item.address]);
                delete callback_contact[index];
            }

            callback_contact.map(function (item, index) {
                if (Service.exists(item.address)) {
                    if (item.type === undefined) {
                        run(item, callback_contact, index);
                    } else if (item.type === 'pubkey' && Service.contacts[item.address].hasPubkey()) {
                        run(item, callback_contact, index);
                    }
                }
            });

            ready = true;
        };

        Service.render = function () {
            var tmp = [];

            for (var k in Service.contacts) {
                var contact = Service.contacts[k];
                tmp.push({
                    name: contact.getName(),
                    key: bintohex(contact.getAddress())
                });
            }

            return tmp;
        };

        Service.isReady = function () {
            return ready;
        };

        Service.exists = function (key) {
            return (Service.contacts[key] !== undefined && typeof Service.contacts[key] === 'object');
        }

        Service.get = function (key) {
            if (Service.contacts[key] !== undefined && typeof Service.contacts[key] === 'object')
                return Service.contacts[key];
            else
                return null;
        }

        Service.getAsync = function (key, callback, type) {
            var deferred = $q.defer();
            callback_contact[callback_contact_id] = {
                address: key,
                deffered: deferred,
                type: type
            };

            var out = deferred.promise.then(callback);

            this.fire();

            return out;
        }

        Service.reload = function () {
            var pn = new Packet(null, PACKET_CONTACT, PACKET_CONTACT_LIST);
            ws.send(pn.toBinary());
        };

        ws.handlePacket({type: PACKET_CONTACT, subtype: PACKET_CONTACT_LIST}, function (packet) {
            Service.contacts = {};

            if (packet.hasError() === true) {
                console.log("ERROR !!!!");
                return;
            }

            var data = $.parseJSON(packet.getData());

            for (var i = 0; i < data.length; i++) {
                var contact = data[i];

                Service.contacts[contact.key] = new Friend();
                Service.contacts[contact.key].setName(contact.name);
                Service.contacts[contact.key].setAddress(hextobin(contact.key));

                var pack = new Packet(hextobin(contact.key), PACKET_CONTACT, PACKET_CONTACT_PUBKEY);
                ws.send(pack.toBinary());
            }
            Service.fire();
        });

        ws.handlePacket({type: PACKET_CONTACT, subtype: PACKET_CONTACT_REJECT}, function (packet) {
            alert(packet.getData());
        });

        ws.handlePacket({type: PACKET_CONTACT, subtype: PACKET_CONTACT_ACCEPT}, function (packet) {
            $.notify("Contact was successfully added !!", "success");
            Service.reload();
        });

        ws.handlePacket({type: PACKET_CONTACT, subtype: PACKET_CONTACT_RELOAD}, function (packet) {
            Service.reload();
        });

        ws.handlePacket({type: PACKET_CONTACT, subtype: PACKET_CONTACT_PUBKEY}, function (packet) {
            var key = new Buffer(32);
            var data = packet.getData();

            for (var i = 0; i < 32; i++)
                key[i] = data[i];

            var pubkey = new Buffer(data.length - key.length);
            for (var i = key.length; i < data.length; i++)
                pubkey[i - 32] = data[i];


            Service.contacts[bintohex(key)].setKey(pubkey);

            Service.fire();
        });

        return Service;
    }]);
});