
Friend = function() {
    this.address = new Uint8Array(32);
    this.name = null;

    // SYMETRIC KEY
    this.rsa = new RSAKey();

    // PUBLIC KEY
    this.pubkey = null;
};

Friend.prototype.setAddress = function(address) {
    for (i = 0; i < 32; i++)
        this.address[i] = address[i];
};

Friend.prototype.getAddress = function() {
    return this.address;
};

Friend.prototype.setName = function(name) {
    this.name = name;
};

Friend.prototype.getName = function() {
    return this.name;
};

Friend.prototype.setKey = function(key) {
    this.rsa.setPublic(buftostr(key).toLowerCase(), "65537");
};

Friend.prototype.encrypt = function(data) {
    return this.rsa.encrypt(data);
};