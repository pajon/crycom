
Message = function() {
    this.address = null;
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

Message.prototype.setKey = function(key) {
    this.key = key;
};

Message.prototype.getKey = function() {
    return this.key;
};

Message.prototype.decrypt = function() {
    var keys = chat.decrypt(bintohex(this.key), "byte");

    var key = CryptoJS.enc.Hex.parse(keys.substr(0, keys.length / 2));
    var iv = CryptoJS.enc.Hex.parse(keys.substr(keys.length / 2));
    var decrypted = CryptoJS.AES.decrypt(bintostr(this.data), key, {iv: iv});
    return decrypted.toString(CryptoJS.enc.Utf8);
};