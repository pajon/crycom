var application = {
    active: 'index',
    loader: function() {
        this.renderIndex();
    }, render: function(method, args) {
        var call = "render" + method.capitalize();

        if (this[call] === undefined) {
            alert("Undefined method " + call);
            return false;
        }

        this.clear();
        this.active = method;
        if (args !== undefined)
            this[call](args);
        else
            this[call]();
    },
    /* RENDER */
    renderIndex: function() {
        /*
        var template = Handlebars.compile($("#template-index").html());
        $("div.cc-content").html(template);

        chat.messages.render();
        */
    }, renderMessage: function(args) {
        if (typeof args !== 'object')
            args = $.parseJSON(args);

        var message = chat.messages.messages[args.id];

        var template = Handlebars.compile($("#template-message").html());
        $("div.cc-content").prepend(template({
            message: message.getData(),
            address: message.getAddress()
        }));
    }, renderContact: function() {
        var template = Handlebars.compile($("#template-contact").html());

        for (var k in chat.friends) {
            var contact = chat.friends[k];
            $("div.cc-content").prepend(template({
                key: contact.getAddress(),
                name: contact.getName()
            }));
        }
    }, renderAddContact: function() {
        var template = Handlebars.compile($("#template-add-contact").html());
        $("div.cc-content").html(template());
    }, renderNewMessage: function(args) {
        var template = Handlebars.compile($("#template-new-message").html());
        $("div.cc-content").html(template(args));
    }, renderSetting: function() {
        var template = Handlebars.compile($("#template-setting").html());
        $("div.cc-content").html(template());
    },
    /* APPLICATION */
    addFriend: function(address) {
        console.log(address);

        pn = new Packet(null, PACKET_CONTACT, PACKET_CONTACT_ADD);
        pn.setData(hextobin(address));

        //chat.websocket.send(pn.toBinary());
    }, sendMessage: function(address, message) {
        //chat.sendMessage(message, address);
    },
    /* TOOLS */
    clear: function() {
        $("div.cc-content").html("");
    }
};