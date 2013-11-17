Packet = function (data, type, subtype) {
    this.type = 'binary';

    this.values = {
        type: null,
        subtype: null,
        data: ""
    };

    this.extra = new Object();

    if (data !== undefined && data !== null && type === undefined && subtype === undefined) {

        if (typeof data === 'string') {
            var json = $.parseJSON(data);

            if (typeof(json.type) !== 'number')
                return alert("Type must be number!");

            if (typeof(json.subtype) !== 'number')
                return alert("SubType must be number!");

            this.values.type = json.type;
            this.values.subtype = json.subtype;

            console.log(json);

            if (json.data !== undefined && json.data !== null)
                this.values.data = json.data;
        } else {
            this.values.type = data[0];
            this.values.subtype = data[1];

            if (data.length > 2) {
                this.values.data = new Buffer(data.length - 2);
                for (var i = 0; i < data.length; i++)
                    this.values.data[i] = data[i + 2];
            }
        }
    } else if (data !== undefined && data !== null)
        this.setData(data);


    if (type !== undefined)
        this.setType(type);

    if (subtype !== undefined)
        this.setSubType(subtype);
};

Packet.prototype.switchToJson = function () {
    this.type = 'string';
};

Packet.prototype.switchToBinary = function () {
    this.type = 'binary';
};

Packet.prototype.fromJson = function (json) {
    this.type = 'string';

    var obj = JSON.parse(json);

    for (var k in this.values) {
        if (obj[k] !== undefined)
            this.values[k] = obj[k];
    }

    for (var k in obj) {
        if (this.values[k] === undefined)
            this.extra[k] = obj[k];
    }
}

Packet.prototype.isBinary = function () {
    return this.type === 'binary';
}

Packet.prototype.setData = function (data) {
    if (this.packet === null) {
        console.log("PACKET IS NULL!");
        return null;
    }

    if(typeof data === 'string')
        this.switchToJson();

    this.values.data = data;
    return this;
};

Packet.prototype.getData = function () {
    return this.values.data;
};

Packet.prototype.getType = function () {
    return this.values.type;
};

Packet.prototype.setType = function (type) {
    if (typeof(type) !== 'number')
        return alert("Type must be number!");

    this.values.type = type;

    return this;
};

Packet.prototype.getSubType = function () {
    return this.values.subtype;
};

Packet.prototype.setSubType = function (type) {
    if (typeof(type) !== 'number')
        return alert("Type must be number!");

    this.values.subtype = type;
    return this;
};

Packet.prototype.toJson = function () {
    return JSON.stringify(this.values);
}

Packet.prototype.toBinary = function () {
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


Packet.prototype.debug = function () {
    //for(var i=0; i < this.packet.length; i++)
    //    console.log("DEBUG[%d]: %d", i, this.packet[i]);
};


module.exports = Packet;