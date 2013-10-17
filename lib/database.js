module.exports = {
    db: require('mongoose'),
    connection: null,

    connect: function () {
        this.db.set('debug', true);
        this.connection = this.db.connect('mongodb://localhost/crycom');
    }, hextobin: function (data) {
        var len = data.length / 2;
        var bfr = new Buffer(len);

        for (var i = 0; i < len; i++) {
            var b = data[(i * 2)] + "" + data[(i * 2) + 1];
            bfr.writeUInt8(parseInt(b, 16), i);
        }
        return bfr;
    }, bintohex: function (data, startPos, length) {
        var hex = "";

        if (startPos === undefined)
            startPos = 0;

        if(length === undefined)
            length = data.length;

        for (var i = startPos; i < length; i++) {
            var c = Number(data[i]).toString(16);

            if (c.length === 1)
                c = "0" + c;

            hex += c;
        }

        return hex;
    }
}

/*
 var Database = {
 isConnect: false,
 client: null,
 conn: require('node-cassandra-cql'),

 connect: function () {
 var Client = this.conn.Client;
 this.client = new Client({hosts: ['localhost'], keyspace: 'crycom'});

 this.client.on('log', function (level, message) {
 console.log('log event: %s -- %j', level, message);
 });
 }, database: function () {
 return this.client;
 }, hextobin: function (data) {
 var len = data.length / 2;
 var bfr = new Buffer(len);

 for (var i = 0; i < len; i++) {
 var b = data[(i * 2)] + "" + data[(i * 2) + 1];
 bfr.writeUInt8(parseInt(b, 16), i);
 }
 return bfr;
 }
 };
 */