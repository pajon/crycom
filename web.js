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

        app.use(express.static(__dirname + '/static'));
    }
}