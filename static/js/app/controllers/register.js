define(['./module'], function (app) {
    'use strict';

    app.controller('RegisterController', ['$scope', 'websocket', 'cc-crypt', '$location', function ($scope, ws, crypt, $location) {

        $scope.isBlocked = false;

        if (crypt.validCert())
            $location.path('/');


        $scope.user = {
            username: "",
            email: ""
        }

        $scope.register = function (user) {
            $scope.isBlocked = true;

            $.notify("Generating certificate!", "info");


            // FIX NOTIFY
            setTimeout(function () {
                crypt.generate(2048, true);


                var p = new Packet(null, PACKET_AUTH, PACKET_AUTH_REGISTER);
                p.setData({
                    pem: crypt.exportPublicPem(),
                    name: user.username,
                    email: "" //user.email
                });
                ws.send(p.toJson());
            }, 1000);
        };

        $scope.reset = function () {
            for (var k in this.user)
                $scope.user[k] = "";
        }
    }]);
});