
Message = function() {
    this.address = null;
    this.data = null;
    this.id = null;
};

Message.prototype.setId = function(address) {
    this.id = address;
};

Message.prototype.getId = function() {
    return this.id;
};
Message.prototype.setAddress = function(address) {
    this.address = address;
};

Message.prototype.getAddress = function() {
    return this.address;
};

Message.prototype.setData = function(data) {
    this.data = data;
};

Message.prototype.getData = function() {
    return this.data;
};

Message.prototype.parse = function(praw, startOffset) {
    if (startOffset === undefined)
        startOffset = 0;

    var index = startOffset;

    // LOAD AES LENGTH
    var aesLength = new Uint8Array(4);
    for (var i = 0; i < 4; i++)
        aesLength[i] = praw[index + i];

    index += 4;

    // LOAD DATA LENGTH
    var dataLength = new Uint8Array(4);
    for (var i = 0; i < 4; i++)
        dataLength[i] = praw[index + i];

    index += 4;

    var aesLen = binLength(aesLength);
    var dataLen = binLength(dataLength);

    var aes = new Uint8Array(aesLen);
    var data = new Uint8Array(dataLen);

    // LOAD AES KEY
    if (aesLen !== 0)
        for (var i = 0; i < aesLen; i++)
            aes[i] = praw[index + i];

    index += aesLen;


    // LOAD DATA
    var message = "";
    for (var i = 0; i < dataLen; i++) {
        data[i] = praw[index + i];
        message += String.fromCharCode(data[i]);
    }

    index += dataLen;

    // LOAD DATA
    var address = new Uint8Array(32);
    for (var i = 0; i < 32; i++)
        address[i] = praw[index + i];

    index += 32;


    // LOAD MESSAGE ID
    var msgid = "";
    var id = new Uint8Array(24);
    for (var i = 0; i < 24; i++) {
        id[i] = praw[index + i];
        msgid += String.fromCharCode(id[i]);
    }
    index += 24;

    this.setId(msgid);
    this.setData(message);
    this.setAddress(hexData(address));

    return index;
}

module.exports = Message;