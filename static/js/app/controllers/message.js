define(['./module'], function (app) {
    'use strict';

    app.controller('MessageListController', ['$scope', 'websocket', '$location', 'cc-crypt', function ($scope, ws, $location, crypt) {

        $scope.loadReceived = function () {
            var packet = new Packet(null, PACKET_MESSAGE, PACKET_MESSAGE_QUERY);
            packet.setData({
                source: null
            });

            ws.send(packet.toJson());
            $location.path('/message');
            console.log("INCOMING")

            $(".message-list a").removeClass("active");
            $(".message-received").addClass("active");
        };

        $scope.loadSent = function () {
            var packet = new Packet(null, PACKET_MESSAGE, PACKET_MESSAGE_QUERY);
            packet.setData({
                source: crypt.getAddress()
            });

            ws.send(packet.toJson());
            $location.path('/message');

            $(".message-list a").removeClass("active");
            $(".message-sent").addClass("active");
        };
    }]);

    app.controller('MessageNewController', ['$scope', 'websocket', '$routeParams', 'cc-contact', 'cc-gateway', '$location', function ($scope, ws, $routeParams, cccontact, gw, $location) {

        var address = $routeParams.userAddress;

        $scope.contact = {
            address: address,
            name: null
        };

        $scope.sendMessage = function () {
            gw.sendMessage($('#messageData').val(), cccontact.get(address));
            $location.path('/');
        }


        cccontact.getAsync(address, function () {
            $scope.contact.name = cccontact.get(address).getName();
        });
    }]);

    app.controller('MessageController', ['$scope', 'cc-msg', function ($scope, ccmsg) {
        $scope.messages = [];

        $scope.showMessage = function (msgid) {
            alert(msgid);
        };

        $scope.render = function () {
            $scope.messages = ccmsg.render();

            if (!$scope.$$phase) {
                $scope.$apply();
            }
        };

        $scope.cbid = ccmsg.register($scope.render);

        $scope.$on('$destroy', function iVeBeenDismissed() {
            ccmsg.unregister($scope.cbid);
        });
    }]);

    app.controller('MessageShowController', ['$scope', '$routeParams', 'cc-msg', 'cc-contact', 'cc-gateway', 'cc-crypt', '$location', function ($scope, $routeParams, ccmsg, contacts, gw, crypt, $location) {
        $scope.msg = null;

        var id = $routeParams.msgId;

        var msg = ccmsg.getMessage(id);

        if (msg === null)
            $location.path('/');

        else {
            var date = new Date(ObjectIDtoTime(id) * 1000);

            // FORMAT DATE
            var stringDate =
                fixZero(date.getDay()) + "." +
                    fixZero(date.getMonth()) + "." +
                    (1900 + date.getYear()) + " " +
                    fixZero(date.getHours()) + ":" +
                    fixZero(date.getMinutes());

            var addr = (msg.getSource() == crypt.getAddress() ? msg.getDestination() : msg.getSource());

            $scope.msg = {
                id: id,
                address: addr,
                contact_name: contacts.get(addr).getName(),
                message: msg.getData(),
                date: stringDate
            };
        }

        $scope.sendMessage = function () {
            gw.sendMessage($('#messageData').val(), contacts.get(this.msg.address), id);
            $location.path("/");
        }

    }]);
});