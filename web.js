var fs = require('fs');

module.exports = {
    init: function (app, express) {
        app.use(function (req, res, next) {
            var hostarr = req.headers.host.split(":");
            var host = null;
            if (typeof hostarr === 'object') {
                host = hostarr[0];
            } else
                host = hostarr;


            if (host.match(/^app.crycom.(loc|net)$/) === null) {
                if (host.match(/crycom.(loc|net)$/) === null)
                    res.redirect('http://app.crycom.net' + req.url);
                else {
                    var dname = host.split(".");
                    res.redirect('http://app.crycom.' + dname[dname.length - 1] + req.url);
                }
            } else {
                next();
            }
        });

        app.get('/scripts.js', function(req, res) {
            var dir = __dirname + '/static/js/extern';

            var output = "";
            output += fs.readFileSync(dir + '/jsbn.js');
            output += fs.readFileSync(dir + '/jsbn2.js');
            output += fs.readFileSync(dir + '/base64.js');
            output += fs.readFileSync(dir + '/rsa.js');
            output += fs.readFileSync(dir + '/rsa2.js');
            output += fs.readFileSync(dir + '/rsa-sign.js');
            output += fs.readFileSync(dir + '/pem.js');

            res.send(output);
        });

        app.use(express.static(__dirname + '/static'));
    }
}