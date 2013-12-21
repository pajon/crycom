define(['./module'], function (serviceModule) {
    'use strict';


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
            if (save === true)
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

        Service.sign = function (data) {
            console.log("NEW SIGN: ");
            console.log(rsa.verifyString(data, rsa.signString(data)));
            return rsa.signString(data);
        };

        Service.verify = function (data, sign) {
            return rsa.verifyHexSignatureForMessage(sign, data);
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
});