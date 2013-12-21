define(['./controllers/module'], function (app) {
    'use strict';

    app.filter('cut', function () {
        return function (val, length) {
            if (val.length > length)
                return val.substr(0, length) + "...";
            return val;
        };
    });

    app.directive('clickLink', ['$location', function ($location) {
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
});