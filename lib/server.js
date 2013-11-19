module.exports = {
    clients: new Array(),

    addClient: function(client) {
        this.clients.push(client);
    },
    getClients: function() {
        return this.clients;
    }

};