define(['./module'], function (app) {
    'use strict';

    app.controller('AppController', ['$scope', 'websocket', 'cc-crypt', '$location', function ($scope, ws, crypt, $location) {


        $scope.activeHead = function ($event) {
            $(".cc-navbar li").removeClass("active");
            $($event.target.parentElement).addClass("active");
        };


        var Service = {};

        Service.hidePanel = function () {
            $('body, html').css('overflow', 'visible');
            $('#content').addClass('cc-onepage');
        };

        Service.showPanel = function () {
            $('body, html').css('overflow', 'hidden');
            $('#content').removeClass('cc-onepage');
        };

        Service.hideHeader = function () {
            $('header').css('display', 'none');
        };

        Service.showHeader = function () {
            $('header').css('display', 'block');
        };


        Service.login = function () {
            var p = new Packet(null, PACKET_AUTH, PACKET_AUTH_START);
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

        ws.handlePacket({type: PACKET_AUTH, subtype: PACKET_AUTH_REGISTER_ACCEPT}, function (packet) {
            Service.login();
            $location.path('/');
            Service.showHeader();
            Service.showPanel();
        });

        ws.handlePacket({type: PACKET_AUTH, subtype: PACKET_AUTH_REGISTER_REJECT}, function (packet) {
            alert("ERROR:" + packet.getData());
        });


    }]);
});