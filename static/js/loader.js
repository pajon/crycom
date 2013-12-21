define([
    'require',
    'angular',
    'app/app',
    'extern'
], function (require, ng) {
    'use strict';

    require(['domReady!'], function (document) {
       ng.bootstrap(document, ['chatApp']);
    });
});
