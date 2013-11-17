var PACKET_MESSAGE = 0;
var PACKET_MESSAGE_LIST = 1;
var PACKET_MESSAGE_NEW = 2;
var PACKET_MESSAGE_GET = 3;

var PACKET_AUTH = 1;
var PACKET_AUTH_START = 1;
var PACKET_AUTH_HASH = 2;
var PACKET_AUTH_DATA = 3;
var PACKET_AUTH_ACCEPT = 4;
var PACKET_AUTH_REJECT = 5;

var PACKET_CONTACT = 6;
var PACKET_CONTACT_LIST = 1;
var PACKET_CONTACT_ADD = 2;
var PACKET_CONTACT_ACCEPT = 3;
var PACKET_CONTACT_REJECT = 4;
var PACKET_CONTACT_PUBKEY = 5;

Packet = function(data, type, subtype) {
    this.type = 'binary';

    this.values = {
        type: null,
        subtype: null,
        data: ""
    };

    // DATA ONLY SET
    if (data !== undefined && data !== null && type === undefined && subtype === undefined) {
        if (typeof data === 'string') {
            var json = $.parseJSON(data);

            if (typeof(json.type) !== 'number')
                return alert("Type must be number!");

            if (typeof(json.subtype) !== 'number')
                return alert("SubType must be number!");

            this.values.type = json.type;
            this.values.subtype = json.subtype;

            if (json.data !== undefined && json.data !== null) {
                this.values.data = json.data;
            }
        } else {
            this.values.type = data[0];
            this.values.subtype = data[1];

            if (data.length > 2) {
                this.values.data = new Buffer(data.length - 2);
                for (var i = 0; i < data.length; i++)
                    this.values.data[i] = data[i + 2];
            }
        }
    } else if (data !== undefined && data !== null) {
        //this.values.data = new Buffer(data.length);
        //for (var i = 0; i < data.length; i++)
        //    this.values.data[i] = data[i];
        this.setData(data);
    }

    if (type !== undefined)
        this.setType(type);

    if (subtype !== undefined)
        this.setSubType(subtype);
};

Packet.prototype.isBinary = function() {
    return this.type === 'binary';
};

Packet.prototype.hasError = function() {
    if (this.isBinary() === false) {
        if (this.values.hasOwnProperty('ok'))
            return this.values.ok === 0;
        else
            return false;
    }
    return null;
};

Packet.prototype.setData = function(data) {
    if (this.packet === null) {
        console.log("PACKET IS NULL!");
        return null;
    }

    this.values.data = data;
    return this;
};

Packet.prototype.getData = function() {
    return this.values.data;
};

Packet.prototype.getType = function() {
    return this.values.type;
};

Packet.prototype.setType = function(type) {
    if (typeof(type) !== 'number')
        return alert("Type must be number!");

    this.values.type = type;

    return this;
};

Packet.prototype.getSubType = function() {
    return this.values.subtype;
};

Packet.prototype.setSubType = function(type) {
    if (typeof(type) !== 'number')
        return alert("Type must be number!");

    this.values.subtype = type;
    return this;
};

Packet.prototype.toJson = function() {
    return $.toJSON(this.values);
};

Packet.prototype.toBinary = function() {
    var output = new Buffer(2 + this.values.data.length);
    output[0] = this.values.type;
    output[1] = this.values.subtype;

    if (typeof this.values.data === 'string')
        for (var i = 0; i < this.values.data.length; i++)
            output[2 + i] = this.values.data.charCodeAt(i);
    else
        for (var i = 0; i < this.values.data.length; i++)
            output[2 + i] = this.values.data[i];

    return output;
};