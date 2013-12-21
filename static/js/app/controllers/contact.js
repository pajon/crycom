define(['./module'], function (app) {
    'use strict';


    app.controller('ContactController', ['$scope', 'cc-contact', function ($scope, cccontact) {
        $scope.contacts = [];

        $scope.render = function () {
            $scope.contacts = cccontact.render();
            $scope.$apply();
        };

        $scope.cbid = cccontact.register($scope.render);

        $scope.$on('$destroy', function iVeBeenDismissed() {
            cccontact.unregister($scope.cbid);
        });
    }]);

    app.controller('ContactAddController', ['$scope', 'websocket', function ($scope, ws) {
        $scope.contacts = [];

        $scope.register = function (address) {
            // 44 - Base64, 64 - Hex
            if (address.length != 44 && address.length != 64)
                return;

            // Convert Base64 to Hex
            if (address.length == 44) {
                address = b64tohex(address);
            }

            var pn = new Packet(null, PACKET_CONTACT, PACKET_CONTACT_ADD);
            pn.setData({
                address: address
            });

            ws.send(pn.toJson());
        };
    }]);
});