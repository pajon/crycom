var chatApp = angular.module('chatApp', ['service']);

chatApp.config(['$routeProvider', function ($routeProvider) {
    $routeProvider
        .when('/register', {
            templateUrl: 'template/register.html',
            controller: 'RegisterController'
        })
        .when('/message', {
            templateUrl: 'template/messageList.html',
            controller: 'MessageController'
        })
        .when('/message/:msgId', {
            templateUrl: 'template/message.html',
            controller: 'MessageShowController'
        })
        .when('/message/new/:userAddress', {
            templateUrl: 'template/message/new.html',
            controller: 'MessageNewController'
        })
        .when('/setting', {
            templateUrl: 'template/setting.html',
            controller: 'SettingController'
        })
        .otherwise({
            redirectTo: '/message'
        });
}]);

chatApp.filter('cut', function () {
    return function (val, length) {
        if (val.length > length)
            return val.substr(0, length) + "...";
        return val;
    };
});

chatApp.directive('clickLink', ['$location', function ($location) {
    return {
        link: function (scope, element, attrs) {
            attrs.$observe('clickLink', function (value) {
                element.on('click', function () {
                    scope.$apply(function () {
                        $location.path(attrs.clickLink);
                    });
                });
            });
        }
    }
}]);

chatApp.controller('AppController', ['$scope', 'websocket', 'cc-crypt', '$location', function ($scope, ws, crypt, $location) {


    var Service = {};

    Service.hidePanel = function () {
        $('#content').addClass('cc-onepage');
    };

    Service.showPanel = function () {
        $('#content').removeClass('cc-onepage');
    };

    Service.hideHeader = function () {
        $('header').css('display', 'none');
    };

    Service.showHeader = function () {
        $('header').css('display', 'block');
    };


    Service.login = function() {
        p = new Packet(null, PACKET_AUTH, PACKET_AUTH_START);
        p.setData({
            public_key: crypt.exportPublicPem()
        });

        ws.send(p.toJson());
    };

    ws.register('onopen', function () {

        // NEW USER
        if (!crypt.validCert()) {
            console.log("NEW USER");
            Service.hidePanel();
            Service.hideHeader();

            $location.path('/register');
            $scope.$apply();
        } else {
            Service.login();
        }
    });

    ws.handlePacket({type: PACKET_AUTH, subtype: PACKET_AUTH_REGISTER_ACCEPT}, function(packet) {
        Service.login();
        $location.path('/');
        Service.showHeader();
        Service.showPanel();
    });

    ws.handlePacket({type: PACKET_AUTH, subtype: PACKET_AUTH_REGISTER_REJECT}, function(packet) {
        alert("ERROR:" + packet.getData());
    });

}]);

chatApp.controller('RegisterController', ['$scope', 'websocket', 'cc-crypt', '$location', function ($scope, ws, crypt, $location) {

    if(crypt.validCert())
        $location.path('/');

    $scope.user = {
        name: "",
        surname: "",
        email: "",
        password: ""
    }

    $scope.register = function(user) {
        crypt.generate(2048, true);

        p = new Packet(null, PACKET_AUTH, PACKET_AUTH_REGISTER);
        p.setData({
            pem: crypt.exportPublicPem(),
            name: user.name + " " + user.surname,
            email: user.email
        });
        ws.send(p.toJson());
    };
}]);

chatApp.controller('SettingController', ['$scope', 'websocket', 'cc-crypt', function ($scope, ws, crypt) {
    $scope.exportCertificate = function () {
        document.location = "data:octet/stream;charset=utf-8," + escape(crypt.export());
    };

    $scope.importCertificate = function () {
        var files = document.getElementById('certFile').files;

        if (files.length > 1)
            return alert("YOU MUST SELECT ONLY ONE FILE WITH CERTIFICATE!!!");

        var reader = new FileReader();

        reader.onload = function (e) {
            if (crypt.testCertificate(reader.result)) {
                crypt.import(reader.result);
            } else {
                alert("WRONG CERTIFICATE!");
            }
        };

        reader.readAsText(files[0], "UTF-8");
    }

    $scope.deleteCertificate = function () {
        if (confirm("Are you sure delete certificate ??"))
            crypt.clean();
    }

    // DEBUG KEY
    $("#key").text(crypt.getAddress());
}]);


chatApp.controller('MessageListController', ['$scope', 'websocket','$location', 'cc-crypt', function ($scope, ws, $location, crypt) {

    $scope.loadReceived = function () {
        var packet = new Packet(null, PACKET_MESSAGE, PACKET_MESSAGE_QUERY);
        packet.setData({
            source: null
        });

        ws.send(packet.toJson());
        $location.path('/message');
    };

    $scope.loadSent = function () {
        var packet = new Packet(null, PACKET_MESSAGE, PACKET_MESSAGE_QUERY);
        packet.setData({
            source: crypt.getAddress()
        });

        ws.send(packet.toJson());
        $location.path('/message');
    };
}]);

chatApp.controller('MessageNewController', ['$scope', 'websocket', '$routeParams', 'cc-contact','cc-gateway', '$location', function ($scope, ws, $routeParams, cccontact, gw, $location) {

    var address = $routeParams.userAddress;

    $scope.contact = {
        address: address,
        name: null
    };

    $scope.sendMessage = function () {
        gw.sendMessage($('#messageData').val(), cccontact.get(address));
        $location.path('/');
    }


    if(cccontact.exists(address)) {
        $scope.contact.name = cccontact.get(address).getName();
    } else {
        cccontact.getAsync(address).then(function() {
            $scope.contact.name = cccontact.get(address).getName();
        });
    }
}]);

chatApp.controller('MessageController', ['$scope', 'cc-msg', function ($scope, ccmsg) {
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

chatApp.controller('MessageShowController', ['$scope', '$routeParams', 'cc-msg', 'cc-contact', 'cc-gateway', 'cc-crypt', '$location', function ($scope, $routeParams, ccmsg, contacts, gw, crypt, $location) {
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

chatApp.controller('ContactController', ['$scope', 'cc-contact', function ($scope, cccontact) {
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


chatApp.run(['websocket','cc-crypt', 'cc-msg', 'cc-contact', '$location', function (ws, crypt, ccmsg, cccontact, $location) {
    ws.handlePacket({type: PACKET_AUTH, subtype: PACKET_AUTH_HASH}, function (packet) {
        var res = crypt.decrypt(bintohex(packet.getData()), "byte");

        if (res === null)
            alert("ERROR DECODE");

        var tmp = new Packet(res, PACKET_AUTH, PACKET_AUTH_DATA);
        ws.send(tmp.toBinary());
    });

    ws.handlePacket({type: PACKET_AUTH, subtype: PACKET_AUTH_REJECT}, function (packet) {
        var data = packet.getData();

        // USER WITH THIS CERTIFICATE DONT EXISTS
        if(data.error_code === 100) {
            // TODO: REWORK (example: IMPORT DIALOG)
            crypt.clean();
        }
    });

    ws.handlePacket({type: PACKET_AUTH, subtype: PACKET_AUTH_ACCEPT}, function (packet) {
        // LOAD CONTACTS
        cccontact.reload();

        // LOAD MESSAGES
        ccmsg.reload();
    });

    ws.handlePacket({type: PACKET_SYSTEM, subtype: PACKET_SYSTEM_LIVE}, function (packet) {
        // IGNORE THIS
    });

    if($location.host() === 'localhost')
        ws.connect("ws://localhost:5000/");
    else
        ws.connect("ws://server.crycom.net/");
}]);