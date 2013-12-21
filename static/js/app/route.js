define(['./controllers/module'], function (app) {
    'use strict';
    return app.config(['$routeProvider', function ($routeProvider) {
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
            .when('/contact/add', {
                templateUrl: 'template/contact/add.html',
                controller: 'ContactAddController'
            })
            .otherwise({
                redirectTo: '/message'
            });
    }]);
});