function Buffer(length) {
    return new Uint8Array(length);
}

function fixZero(c) {
    if (typeof c === 'number') {
        if (c < 10)
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
            parseInt(b2, 16) * 256 * 256 +
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

$(function () {
    /*
     $.ajax({
     url: "/templates.html",
     cache: false
     }).done(function (html) {
     $("body").before(html);

     chat.loader();
     });
     */
    chat.loader();
});

var chat = {
    init: false,
    /* KEYS */
    pubkey: null,
    privkey: null,
    name: null,
    rsa: null,
    /* SOURCE ADDRESS */
    srcAddr: new Uint8Array(32),
    /* CHAT DATA */
    friends: {},
    messages: null,
    /* WEBSOCKET */
    websocket: null,
    loader: function () {
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

        /*
        this.rsa = new RSAKey();

        if ($.jStorage.get("cert") === null
        //$.jStorage.get("pubkey") === null || $.jStorage.get("privkey") === null
        ) {
            this.generateKeys();

            this.name = prompt("Please enter your name", "");

        } else {
            this.rsa.parsePEM($.jStorage.get("cert"));
            //this.pubkey = $.jStorage.get("pubkey");
            //this.privkey = $.jStorage.get("privkey");

            //this.rsa.setPublic(this.pubkey, "65537");
            //this.rsa.setPrivate(this.pubkey, "65537", this.privkey);
        }
        */
        /*

        var hash = CryptoJS.SHA256(this.pubkey.toUpperCase()).toString(CryptoJS.enc.Hex);

        $("#key").text(hash);

        for (i = 0; i < 32; i++) {
            b = hash[(i * 2)] + "" + hash[(i * 2) + 1];
            this.srcAddr[i] = parseInt(b, 16);
        }

        */

        //this.messages = messageManager;
    },
    onLogin: function () {
        this.loadContacts();
        this.loadMessages();
    }, encrypt: function (data) {
        if (this.pubkey === null) {
            alert("NOT PUBKEY");
            return;
        }
        return this.rsa.encrypt(data);
    },
    decrypt: function (data) {
        if (this.pubkey === null) {
            alert("NOT PUBKEY");
            return;
        } else if (this.privkey === null) {
            alert("NOT PRIVKEY");
            return;
        }
        return this.rsa.decrypt(data);
    },
    generateKeys: function () {
        this.rsa.generate(2048, "65537");
        this.pubkey = this.rsa.n.toString(16);
        this.privkey = this.rsa.d.toString(16);

        alert(this.rsa.publicPEMRAW().length);

        this.rsa.setPublic(this.pubkey, "65537");
        this.rsa.setPrivate(this.pubkey, "65537", this.privkey);

        var hash = CryptoJS.SHA256(this.pubkey.toUpperCase()).toString(CryptoJS.enc.Hex);

        $("#key").text(hash);

        //$.jStorage.set("pubkey", this.pubkey);
        //$.jStorage.set("privkey", this.privkey);

        $.jStorage.set("cert", this.rsa.privatePEM());
    },
    exportKeys: function () {
        alert("PUBKEY:\n" + this.pubkey + "\n\nPRIVKEY:\n" + this.privkey);

        alert(this.pubkey.length);

        alert(this.rsa.publicPEM());

        //console.log(this.rsa.publicPEM());
        //this.rsa.parsePEM(this.rsa.publicPEM());
    },
    login: function () {
        if (this.websocket === null)
            return alert("NAJSKOR SA PRIPOJ OMG !!!!");



        pem = this.rsa.publicPEM();

        // REGISTER FIRST TIME
        if (this.name !== null) {
            p = new Packet(null, PACKET_AUTH, PACKET_AUTH_REGISTER);
            p.setData({
                pem: pem,
                name: this.name
            });

            this.websocket.send(p.toJson());
        }

        var auth = function () {
            p = new Packet(null, PACKET_AUTH, PACKET_AUTH_START);
            p.setData(pem);

            chat.websocket.send(p.toBinary());
        }

        // SO TOO BAD
        if (this.name !== null)
            setTimeout(auth, 1000);
        else
            auth();
        }
        ,
        loadContacts: function () {
            pn = new Packet(null, PACKET_CONTACT, PACKET_CONTACT_LIST);
            this.websocket.send(pn.toBinary());
        }
        ,
        renderFriends: function () {
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
        }
        ,
        loadMessages: function () {
            pn = new Packet(null, PACKET_MESSAGE, PACKET_MESSAGE_LIST);

            this.websocket.send(pn.toJson());
        }
        ,
        sendMessage: function (idInput, dest) {
            var message = $('#' + idInput).val();

            var contact = chat.friends[dest];

            if (typeof dest === 'string' && dest.length === 64)
                dest = hextobin(dest);

            // GENERATE KEY
            var key = CryptoJS.lib.WordArray.random(32);
            var iv = CryptoJS.lib.WordArray.random(32);
            var encrypted = CryptoJS.AES.encrypt(message, key, {iv: iv});

            // KEY + IV -> HEX -> BINARY -> ENCRYPT
            var fullkey = hextobin(contact.encrypt(key.toString() + iv.toString()));

            message = encrypted.toString();
            /*
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
            */
            var out = {
                destination: bintohex(dest),
                data: message,
                destination_key: contact.encrypt(key.toString() + iv.toString()),
                source_key: chat.encrypt(key.toString() + iv.toString())

            }

            var p = new Packet(out, PACKET_MESSAGE, PACKET_MESSAGE);
            this.websocket.send(p.toJson());

            //var p = new Packet(f, PACKET_MESSAGE, PACKET_MESSAGE);
            //this.websocket.send(p.toBinary());
        }
    };