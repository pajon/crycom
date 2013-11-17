
var serviceModule = angular.module('service', []);

serviceModule.factory('websocket', function() {
    var Service = {};

    var websocket = null;

    var callbacks = {};

    Service.connect = function(address) {
        websocket = new WebSocket(address);
        websocket.binaryType = 'arraybuffer';

        websocket.onopen = function(e) {
            // LOGIN
            chat.login();
            console.log("CONNECT");
        };
        websocket.onclose = function() {
            console.log("CLOSE");
        };
        websocket.onmessage = function(e) {
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

        websocket.onerror = function(e) {
            $('#debug').html($('#debug').html() + "ERROR" + "<br>");
        };

        chat.websocket = websocket;
    };

    Service.handlePacket = function(filter, fn) {
        if (filter.hasOwnProperty('type') === false) {
            console.log("Websocket handlePacket filter must contain type property!");
            return false;
        }

        console.log(filter);
        console.log(callbacks);

        var key = filter.type + "-";
        if (filter.hasOwnProperty('subtype'))
            key += filter.subtype;

        if (callbacks.hasOwnProperty(key)) {
            console.log("Websocket callback on key (" + key + ") is definned!");
        } else {
            callbacks[key] = fn;
        }

        console.log(callbacks);
    };

    Service.send = function(data) {
        websocket.send(data);
    };

    return Service;
});

serviceModule.factory('cccontact', ['websocket', function(ws) {
        var Service = {};

        var ready = false;
        var callback = null;
        Service.contacts = {};

        Service.register = function(cb) {
            callback = cb;

            if (this.isReady())
                Service.fire();
        };

        Service.fire = function() {
            if (callback !== null)
                callback();

            ready = true;
        };

        Service.render = function() {
            var tmp = [];

            for (var k in Service.contacts) {
                var contact = Service.contacts[k];
                tmp.push({
                    name: contact.getName(),
                    key: contact.getAddress()
                });
            }

            return tmp;
        };

        Service.isReady = function() {
            return ready;
        };

        ws.handlePacket({type: PACKET_CONTACT, subtype: PACKET_CONTACT_LIST}, function(packet) {
            Service.contacts = {};

            if (packet.hasError() === true) {
                console.log("ERROR !!!!");
                return;
            }

            var data = $.parseJSON(packet.getData());

            for (var i = 0; i < data.length; i++) {
                var contact = data[i];

                Service.contacts[contact.key] = new Friend();
                Service.contacts[contact.key].setName(contact.name);
                Service.contacts[contact.key].setAddress(hextobin(contact.key));

                // TEMPORALY
                chat.friends[contact.key] = Service.contacts[contact.key];

                var pack = new Packet(hextobin(contact.key), PACKET_CONTACT, PACKET_CONTACT_PUBKEY);
                ws.send(pack.toBinary());
            }
            Service.fire();
        });

        ws.handlePacket({type: PACKET_CONTACT, subtype: PACKET_CONTACT_REJECT}, function(packet) {
            alert(bintostring(packet.getData()));
        });

        ws.handlePacket({type: PACKET_CONTACT, subtype: PACKET_CONTACT_ACCEPT}, function(packet) {
            chat.loadContacts();
        });

        ws.handlePacket({type: PACKET_CONTACT, subtype: PACKET_CONTACT_PUBKEY}, function(packet) {
            var key = new Buffer(32);
            var data = packet.getData();

            for (var i = 0; i < 32; i++)
                key[i] = data[i];

            var pubkey = new Buffer(data.length - key.length);
            for (var i = key.length; i < data.length; i++)
                pubkey[i - 32] = data[i];


            chat.friends[bintohex(key)].setKey(pubkey);
        });

        return Service;
    }]);

serviceModule.factory('ccmsg', ['websocket', function(ws) {
        var Service = {};

        var ready = false;
        var callback = null;

        Service.messages = {};
        Service.renderMessage = null;

        Service.register = function(cb) {
            callback = cb;

            if (this.isReady())
                Service.fire();
        };

        Service.fire = function() {
            if (callback !== null)
                callback();

            ready = true;
        };

        Service.check = function() {
            for (var i = 0; i < this.renderMessage.length; i++) {
                var k = this.renderMessage[i];

                if (this.messages.hasOwnProperty(k) === false)
                    return;
            }

            this.fire();
        };

        Service.isReady = function() {
            return ready;
        };

        Service.addMessage = function(id, message) {
            if (this.messages.hasOwnProperty(id)) {
                alert("Already in store");
                return false;
            }
            this.messages[id] = message;
        };

        Service.getMessage = function(id) {
            if (this.messages.hasOwnProperty(id))
                return this.messages[id];
            else
                return null;
        };

        Service.render = function() {
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

                tmp.push({
                    id: k,
                    addr: Service.messages[k].getAddress(),
                    contact_name: chat.friends[Service.messages[k].getAddress()].getName(),
                    message: Service.messages[k].getData(),
                    date: stringDate
                });
            }

            return tmp;
        };

        ws.handlePacket({type: PACKET_MESSAGE, subtype: PACKET_MESSAGE_LIST}, function(packet) {
            var data = packet.getData();
            var plength = data.length;

            Service.renderMessage = new Array();
            for (var i = 0; i < plength; i++)
                Service.renderMessage[Service.renderMessage.length] = data[i];

            for (var i = 0; i < Service.renderMessage.length; i++) {
                // CHECK MESSAGE CACHE
                pn = new Packet(Service.renderMessage[i], PACKET_MESSAGE, PACKET_MESSAGE_GET);
                chat.websocket.send(pn.toBinary());
            }
        });

        ws.handlePacket({type: PACKET_MESSAGE, subtype: PACKET_MESSAGE_GET}, function(packet) {
            var data = $.parseJSON(packet.getData());

            var msg = new Message();
            msg.setId(data.id);
            msg.setAddress(data.source);
            msg.setKey(hextobin(b64tohex(data.key)));
            msg.setData(hextobin(b64tohex(data.data)));

            msg.setData(msg.decrypt());

            Service.addMessage(msg.getId(), msg);
            Service.check();
        });

        ws.handlePacket({type: PACKET_MESSAGE, subtype: PACKET_MESSAGE_NEW}, function(packet) {
            renderMessage.unshift(packet.getData());

            pn = new Packet(packet.getData(), PACKET_MESSAGE, PACKET_MESSAGE_GET);
            chat.websocket.send(pn.toBinary());
        });

        return Service;
    }]);

var chatApp = angular.module('chatApp', ['service']);

chatApp.config(['$routeProvider',
    function($routeProvider) {
        $routeProvider.when('/message', {
            templateUrl: 'template/messageList.html',
            controller: 'MessageController'
        }).when('/message/:msgId', {
            templateUrl: 'template/message.html',
            controller: 'MessageShowController'
        }).otherwise({
            redirectTo: '/message'
        });
    }]);

chatApp.filter('cut', function() {
    return function(val, length) {
        if (val.length > length)
            return val.substr(0, length) + "...";
        return val;
    };
});

chatApp.directive('clickLink', ['$location', function($location) {
        return {
            link: function(scope, element, attrs) {
                attrs.$observe('clickLink', function(value) {
                    element.on('click', function() {
                        scope.$apply(function() {
                            $location.path(attrs.clickLink);
                        });
                    });
                });
            }
        }
    }]);

chatApp.controller('AppController', ['$scope', 'websocket', function($scope, ws) {
    }]);

chatApp.controller('MessageController', ['$scope', 'ccmsg', function($scope, ccmsg) {
        $scope.messages = [{
                id: "AA",
                addr: "AA",
                contact_name: "AA",
                message: "AA",
                date: "AA"
            }];

        $scope.showMessage = function(msgid) {
            alert(msgid);
        };

        $scope.render = function() {
            $scope.messages = ccmsg.render();

            if (!$scope.$$phase) {
                $scope.$apply();
            }
        };

        ccmsg.register($scope.render);
    }]);

chatApp.controller('MessageShowController', ['$scope', '$routeParams', 'ccmsg', function($scope, $routeParams, ccmsg) {
        $scope.msg = {
            id: "",
            addr: "",
            contact_name: "",
            message: "",
            date: ""
        };

        var id = $routeParams.msgId;

        $scope.renderMessage = function() {
            var msg = ccmsg.getMessage(id);
            
            if (msg !== null) {


                var date = new Date(ObjectIDtoTime(id) * 1000);

                // FORMAT DATE
                var stringDate =
                        fixZero(date.getDay()) + "." +
                        fixZero(date.getMonth()) + "." +
                        (1900 + date.getYear()) + " " +
                        fixZero(date.getHours()) + ":" +
                        fixZero(date.getMinutes());

                $scope.msg = {
                    id: id,
                    addr: msg.getAddress(),
                    contact_name: chat.friends[msg.getAddress()].getName(),
                    message: msg.getData(),
                    date: stringDate
                };
            }
        };
    }]);

chatApp.controller('ContactController', ['$scope', 'cccontact', function($scope, cccontact) {
        $scope.contacts = [{name: 'lacko', key: 'aabbccdd'}];

        $scope.render = function() {
            $scope.contacts = cccontact.render();

            console.log($scope.contacts);
            $scope.$apply();
        };

        cccontact.register($scope.render);
    }]);


chatApp.run(['websocket', 'ccmsg', 'cccontact', function(ws) {
        ws.handlePacket({type: PACKET_AUTH, subtype: PACKET_AUTH_HASH}, function(packet) {
            var res = chat.rsa.decrypt(bintohex(packet.getData()), "byte");
            if (res === null)
                alert("ERROR DECODE");

            var tmp = new Packet(res, PACKET_AUTH, PACKET_AUTH_DATA);
            chat.websocket.send(tmp.toBinary());
        });

        ws.handlePacket({type: PACKET_AUTH, subtype: PACKET_AUTH_ACCEPT}, function(packet) {
            chat.onLogin();
        });

        ws.connect("ws://localhost:8000");
    }]);

function Buffer(length) {
    return new Uint8Array(length);
}

function fixZero(c) {
    if (typeof c === 'number') {
        if (c < 10)
            return "0" + c;
    } else {
        if (c.length === 1)
            c = "0" + c;
    }
    return c;
}

function hextobin(val) {
    var length = val.length / 2;
    var f = new Uint8Array(length);

    for (i = 0; i < length; i++) {
        b = val[(i * 2)] + "" + val[(i * 2) + 1];
        f[i] = parseInt(b, 16);
    }
    return f;
}

function bintohex(data, offset, length) {
    var hex = "";

    if (offset === undefined)
        offset = 0;

    if (length === undefined)
        length = offset + data.length;

    for (var i = offset; i < length; i++) {
        var c = Number(data[i]).toString(16);

        if (c.length === 1)
            c = "0" + c;

        hex += c;
    }

    return hex;
}

function bintostr(data) {
    var msg = "";
    for (var i = 0; i < data.length; i++)
        msg += String.fromCharCode(data[i]);

    return msg;
}

function strtobin(data) {
    var bin = new Buffer(data.length);
    for (var i = 0; i < data.length; i++)
        bin[i] = data.charAt(i);
    return bin;
}

function buftostr(data) {
    var msg = "";
    for (var i = 0; i < data.length; i++)
        msg += String.fromCharCode(data[i]);
    return msg;
}

function ObjectIDtoTime(obj) {
    var b1 = obj.substring(0, 2);
    var b2 = obj.substring(2, 4);
    var b3 = obj.substring(4, 6);
    var b4 = obj.substring(6, 8);

    var date =
            parseInt(b4, 16) +
            parseInt(b3, 16) * 256 +
            parseInt(b2, 16) * 256 * 256 +
            parseInt(b1, 16) * 256 * 256 * 256;

    return date;
}

function binLength(data) {
    var length = 0;
    for (var i = 0; i < 4; i++) {
        length += data[i] * Math.pow(256, i);
    }

    return length;
}

$(function() {
    $.ajax({
        url: "/templates.html",
        cache: false
    }).done(function(html) {
        $("body").before(html);

        chat.loader();
    });
});

var chat = {
    init: false,
    /* KEYS */
    pubkey: null,
    privkey: null,
    rsa: null,
    /* SOURCE ADDRESS */
    srcAddr: new Uint8Array(32),
    /* CHAT DATA */
    friends: {},
    messages: null,
    /* WEBSOCKET */
    websocket: null,
    loader: function() {
        // ONCE LOAD
        if (this.init)
            return;

        this.init = true;

        // CHECK STORAGE
        if ($.jStorage.storageAvailable() === false)
            alert("UNSUPPORTED STORAGE!!!");

        // CHECK WEBSOCKETS
        if (!window.WebSocket)
            alert("UNSUPPORTED WEBSOCKET!!!");

        this.rsa = new RSAKey();

        if ($.jStorage.get("pubkey") === null || $.jStorage.get("privkey") === null) {
            this.generateKeys();
        } else {
            this.pubkey = $.jStorage.get("pubkey");
            this.privkey = $.jStorage.get("privkey");

            this.rsa.setPublic(this.pubkey, "65537");
            this.rsa.setPrivate(this.pubkey, "65537", this.privkey);
        }

        var hash = CryptoJS.SHA256(this.pubkey.toUpperCase()).toString(CryptoJS.enc.Hex);

        $("#key").text(hash);

        for (i = 0; i < 32; i++) {
            b = hash[(i * 2)] + "" + hash[(i * 2) + 1];
            this.srcAddr[i] = parseInt(b, 16);
        }

        this.messages = messageManager;
    },
    onLogin: function() {
        this.loadContacts();
        this.loadMessages();

        application.loader();
    }, encrypt: function(data) {
        if (this.pubkey === null) {
            alert("NOT PUBKEY");
            return;
        }
        return this.rsa.encrypt(data);
    },
    decrypt: function(data) {
        if (this.pubkey === null) {
            alert("NOT PUBKEY");
            return;
        } else if (this.privkey === null) {
            alert("NOT PRIVKEY");
            return;
        }
        return this.rsa.decrypt(data);
    },
    generateKeys: function() {
        this.rsa.generate(2048, "65537");
        this.pubkey = this.rsa.n.toString(16);
        this.privkey = this.rsa.d.toString(16);

        alert(this.rsa.publicPEMRAW().length);

        this.rsa.setPublic(this.pubkey, "65537");
        this.rsa.setPrivate(this.pubkey, "65537", this.privkey);

        var hash = CryptoJS.SHA256(this.pubkey.toUpperCase()).toString(CryptoJS.enc.Hex);

        $("#key").text(hash);

        $.jStorage.set("pubkey", this.pubkey);
        $.jStorage.set("privkey", this.privkey);
    },
    exportKeys: function() {
        alert("PUBKEY:\n" + this.pubkey + "\n\nPRIVKEY:\n" + this.privkey);

        alert(this.pubkey.length);

        alert(this.rsa.publicPEM());

        //console.log(this.rsa.publicPEM());
        //this.rsa.parsePEM(this.rsa.publicPEM());
    },
    login: function() {
        if (this.websocket === null)
            return alert("NAJSKOR SA PRIPOJ OMG !!!!");

        pem = this.rsa.publicPEM(); //this.rsa.publicPEMRAW();

        p = new Packet(null, PACKET_AUTH, PACKET_AUTH_START);
        p.setData(pem);

        this.websocket.send(p.toBinary());
    }, loadContacts: function() {
        pn = new Packet(null, PACKET_CONTACT, PACKET_CONTACT_LIST);
        this.websocket.send(pn.toBinary());
    }, renderFriends: function() {
        if (this.friends === null)
            return;

        $("ul.cc-friend-list").html("");

        var template = Handlebars.compile($("#template-list-friends").html());

        for (var k in this.friends) {
            var key = k;
            var name = this.friends[k].getName();

            var html = template({
                key: key,
                name: name
            });

            $("ul.cc-friend-list").prepend(html);
        }
    }, loadMessages: function() {
        pn = new Packet(null, PACKET_MESSAGE, PACKET_MESSAGE_LIST);

        this.websocket.send(pn.toJson());
    }, sendMessage: function(idInput, dest) {
        var message = $('#' + idInput).val();

        var contact = chat.friends[dest];

        if (typeof dest === 'string' && dest.length === 64)
            dest = hextobin(dest);

        // GENERATE KEY
        var key = CryptoJS.lib.WordArray.random(32);
        var iv = CryptoJS.lib.WordArray.random(32);
        var encrypted = CryptoJS.AES.encrypt(message, key, {iv: iv});

        var decrypted = CryptoJS.AES.decrypt(encrypted.toString(), key, {iv: iv});

        console.log(key.toString() + iv.toString());

        // KEY + IV -> HEX -> BINARY -> ENCRYPT
        var fullkey = hextobin(contact.encrypt(key.toString() + iv.toString()));

        message = encrypted.toString();//strtobin(encrypted.toString());

        // ENCRYPTED KEY LENGTH
        var length = fullkey.length;

        var f = new Buffer(32 + 2 + length + message.length);
        for (i = 0; i < 32; i++)
            f[i] = dest[i];

        f[32] = length % 256;
        f[33] = length / 256;

        var index = 34;
        for (var i = 0; i < length; i++)
            f[index + i] = fullkey[i];

        index += length;

        for (i = 0; i < message.length; i++)
            f[index + i] = message.charCodeAt(i);

        var p = new Packet(f, PACKET_MESSAGE, PACKET_MESSAGE);
        this.websocket.send(p.toBinary());
    }
};