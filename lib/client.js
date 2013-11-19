var db = require('./database');
var user = require('./model/user');
var controller = require('./controller');
var log = require('./log');
var config = require('./config');
var packet = require('./packet');
var server = require('./server');

Client = function (ws) {
    this.logged = false;
    this.address = null;

    this.genhash = null;

    this.ws = ws;

    this.interval = null;
};

Client.prototype.isLogged = function () {
    return this.logged;
}

Client.prototype.setAddress = function (address) {
    this.address = address;
}

Client.prototype.getAddress = function () {
    return this.address;
}

Client.prototype.send = function (data, callback) {
    if(config.debug)
        console.log("Send message to client: %s - %d", this.getAddress(), data.toBinary().length);


    // OTESTOVAT CI JE MOZNE ZAPISOVAT - hadze vynimku ked sa klient odpoji a pokusa sa zapisovat
    if (data instanceof Packet) {
        if (data.isBinary())
            this.ws.send(data.toBinary(), {binary: true, mask: false}, callback);
        else
            this.ws.send(data.toJson(), callback);
    } else
        console.log("NOT PACKET SEND!");

};

Client.prototype.genHash = function () {
    this.genhash = new Buffer(10);
    for (var i = 0; i < 10; i++)
        this.genhash.writeUInt8(Math.floor(Math.random() * 1000) % 256, i);

    return this.genhash;
}

Client.prototype.checkHash = function (hash) {
    for (var i = 0; i < this.genhash.length; i++)
        if (this.genhash[i] != hash[i])
            return false;

    this.genhash = null;
    return true;
}

Client.prototype.onLogin = function() {
    var addr = this.getAddress();

    if (config.sandbox) {
        server.getClients().map(function (item) {
            if(item.getAddress() === addr || item.isLogged() === false)
                return;

            var pack = new Packet(null, config.packet.PACKET_CONTACT, config.packet.PACKET_CONTACT_RELOAD);
            item.send(pack);
        });
    }
}

Client.prototype.disconnect = function () {
    user.findOneAndUpdate({ address: this.getAddress() }, { status: 0 }, function () {

    });

    if (controller.clients[this.getAddress()] !== undefined)
        controller.clients[this.getAddress()] = null;
}

module.exports = Client;