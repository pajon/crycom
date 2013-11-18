var serviceModule = angular.module('service', ['ngRoute']);

serviceModule.factory('websocket', [ '$location', function ($location) {
    var Service = {};

    var websocket = null;

    var callbacks = {};

    var event_cbid = 0;
    var event_callbacks = new Array();

    function callEvent(event) {
        event_callbacks.map(function (val) {
            if (val.type === event)
                val.callback();
        });
    }

    Service.register = function (event, fn) {
        if (["onopen", "onclose", "onerror"].indexOf(event) !== -1) {
            event_callbacks[event_cbid] = {
                callback: fn,
                type: event
            }
            return event_cbid++;
        } else {
            return alert("Wrong type event!");
        }
    }

    Service.unregister = function (cbid) {
        if (event_callbacks[cbid] !== undefined)
            delete event_callbacks[cbid];
    }


    Service.connect = function (address) {
        websocket = new WebSocket(address);
        websocket.binaryType = 'arraybuffer';

        websocket.onopen = function (e) {
            // LOGIN
            //chat.login();

            callEvent('onopen')
            console.log("CONNECT");
        };
        websocket.onclose = function () {
            callEvent('onclose')
            console.log("CLOSE");
        };
        websocket.onmessage = function (e) {
            // text (typeof e.data === 'string')
            // binnary (typeof e.data === 'object')
            console.log("NEW PACKET");

            if (typeof e.data === 'string') {
                var packet = new Packet(e.data);
            } else {
                var packet = new Packet(new Uint8Array(e.data));
            }
            console.log("PACKET: %d %d %d", packet.getType(), packet.getSubType(), packet.getData().length);

            var key = packet.getType() + "-" + packet.getSubType();

            if (callbacks.hasOwnProperty(key)) {
                callbacks[key](packet);
            } else {
                var key = packet.getType() + "-";
                if (callbacks.hasOwnProperty(key))
                    callbacks[key](packet);
                else
                    alert('missed controller: ' + packet.getType() + "-" + packet.getSubType());
            }
        };

        websocket.onerror = function (e) {
            callEvent('onerror')
            $('#debug').html($('#debug').html() + "ERROR" + "<br>");
        };
    };

    Service.handlePacket = function (filter, fn) {
        if (filter.hasOwnProperty('type') === false) {
            console.log("Websocket handlePacket filter must contain type property!");
            return false;
        }

        var key = filter.type + "-";
        if (filter.hasOwnProperty('subtype'))
            key += filter.subtype;

        if (callbacks.hasOwnProperty(key)) {
            console.log("Websocket callback on key (" + key + ") is definned!");
        } else {
            callbacks[key] = fn;
        }
    };

    Service.send = function (data) {
        websocket.send(data);
    };

    return Service;
}]);

serviceModule.factory('cc-crypt', ['websocket', function (ws) {

    var certLoad = false;
    var rsa = new RSAKey();

    var Service = {};

    // CHECK IF CERTIFICATE EXISTS
    if ($.jStorage.get("cert") !== null) {
        // LOAD PEM FROM STORAGE
        rsa.parsePEM($.jStorage.get("cert"));
        certLoad = true;
    }

    Service.generate = function (bit_length, save) {
        if (bit_length === undefined || [2048, 4096].indexOf(bit_length) === -1)
            bit_length = 2048;


        rsa.generate(bit_length, "65537");
        if(save === true)
            $.jStorage.set("cert", rsa.privatePEM());

        certLoad = true;
    };

    Service.validCert = function () {
        return certLoad;
    };

    Service.encrypt = function (data) {
        if (!this.validCert()) {
            console.log("ERROR: cc-cipher is not ready!");
            return null;
        }
        return rsa.encrypt(data);
    };

    Service.decrypt = function (data, type) {
        if (!this.validCert()) {
            console.log("ERROR: cc-cipher is not ready!");
            return null;
        }
        return rsa.decrypt(data, type);
    };

    Service.getAddress = function () {
        return CryptoJS.SHA256(rsa.n.toString(16).toUpperCase()).toString(CryptoJS.enc.Hex);
    };

    Service.export = function () {
        return rsa.privatePEM();
    };

    Service.exportPublicPem = function () {
        return rsa.publicPEM();
    };

    Service.import = function (pem) {
        if (!this.testCertificate(pem))
            return false;

        // SET CERTIFICATE AND RELOAD APP
        $.jStorage.set("cert", pem);
        location.reload();
    };

    Service.clean = function () {
        $.jStorage.deleteKey("cert");
        location.reload();

    };

    Service.testCertificate = function (pem) {
        var test = new RSAKey();

        if (!test.parsePEM(pem))
            return false;

        var randomString = CryptoJS.lib.WordArray.random(32).toString();

        if (randomString !== test.decrypt(test.encrypt(randomString)))
            return false;

        return true;
    };

    return Service;
}]);

serviceModule.factory('cc-gateway', ['websocket', 'cc-crypt', function (ws, crypt) {

    var Service = {};

    Service.sendMessage = function (data, contact) {
        var message = data;

        // GENERATE KEY
        var key = CryptoJS.lib.WordArray.random(32);
        var iv = CryptoJS.lib.WordArray.random(32);
        var encrypted = CryptoJS.AES.encrypt(message, key, {iv: iv});

        message = encrypted.toString();

        var p = new Packet(null, PACKET_MESSAGE, PACKET_MESSAGE);

        p.setData({
            destination: bintohex(contact.getAddress()),
            data: message,
            destination_key: contact.encrypt(key.toString() + iv.toString()),
            source_key: crypt.encrypt(key.toString() + iv.toString())
        });
        ws.send(p.toJson());
    }

    return Service;
}]);

serviceModule.factory('cc-contact', ['websocket', function (ws) {
    var id = 0;
    var Service = {};

    var ready = false;
    var callback = new Array();
    Service.contacts = {};

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

    Service.getContactByKey = function (key) {
        return Service.contacts[key];
    }

    Service.reload = function() {
        pn = new Packet(null, PACKET_CONTACT, PACKET_CONTACT_LIST);
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

            // TEMPORALY
            //chat.friends[contact.key] = Service.contacts[contact.key];

            var pack = new Packet(hextobin(contact.key), PACKET_CONTACT, PACKET_CONTACT_PUBKEY);
            ws.send(pack.toBinary());
        }
        Service.fire();
    });

    ws.handlePacket({type: PACKET_CONTACT, subtype: PACKET_CONTACT_REJECT}, function (packet) {
        alert(packet.getData());
    });

    ws.handlePacket({type: PACKET_CONTACT, subtype: PACKET_CONTACT_ACCEPT}, function (packet) {
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
    });

    return Service;
}]);

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
                contact_name: contact.getContactByKey(addr).getName(),
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

            pn = new Packet(Service.renderMessage[i], PACKET_MESSAGE, PACKET_MESSAGE_GET);
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

        Service.addMessage(msg.getId(), msg);
        Service.check();
    });

    ws.handlePacket({type: PACKET_MESSAGE, subtype: PACKET_MESSAGE_NEW}, function (packet) {
        if (Service.messages.hasOwnProperty(packet.getData()))
            return;

        Service.renderMessage.unshift(packet.getData());

        pn = new Packet(packet.getData(), PACKET_MESSAGE, PACKET_MESSAGE_GET);
        ws.send(pn.toBinary());
    });

    return Service;
}]);