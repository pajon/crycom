define(['./module'], function (app) {
    'use strict';


    app.controller('SettingController', ['$scope', 'websocket', 'cc-crypt', function ($scope, ws, crypt) {
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

        $scope.address = hex2b64(crypt.getAddress());
    }]);
});