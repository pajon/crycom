require.config({
    baseUrl: '/js/',

    paths: {
        'angular': 'extern/angular/angular',
        'angular-route': 'extern/angular/angular-route',
        'jquery': 'extern/jquery',
        'domReady': 'extern/requirejs/domReady'
    },

    shim: {
        'angular': {
            exports: 'angular'
        },
        'angular-route': {
            deps: ['angular']
        }
    },

    // kick start application
    deps: ['jquery', 'angular', 'angular-route', 'loader']
});