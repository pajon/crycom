
Message = function() {
    this.source = null;
    this.destination = null;
    this.data = null;
    this.key = null;
    this.id = null;
};

Message.prototype.setId = function(address) {
    this.id = address;
};

Message.prototype.getId = function() {
    return this.id;
};
Message.prototype.setSource = function(address) {
    this.source = address;
};

Message.prototype.getSource = function() {
    return this.source;
};

Message.prototype.setDestination = function(address) {
    this.destination = address;
};

Message.prototype.getDestination = function() {
    return this.destination;
};

Message.prototype.setData = function(data) {
    this.data = data;
};

Message.prototype.getData = function() {
    return this.data;
};

Message.prototype.setKey = function(key) {
    this.key = key;
};

Message.prototype.getKey = function() {
    return this.key;
};

Message.prototype.decrypt = function(crypt) {
    var keys = crypt.decrypt(bintohex(this.getKey()), "byte");

    var key = CryptoJS.enc.Hex.parse(keys.substr(0, keys.length / 2));
    var iv = CryptoJS.enc.Hex.parse(keys.substr(keys.length / 2));
    var decrypted = CryptoJS.AES.decrypt(bintostr(this.data), key, {iv: iv});
    return decrypted.toString(CryptoJS.enc.Utf8);
};