var messageManager = {
    messages: new Object(),
    dashboard: new Array(),
    addMessage: function(id, message) {
        if (this.messages[id] !== undefined) {
            alert("Already in store");
            return false;
        }

        this.messages[id] = message;
    }, render: function(limit) {
        console.log("RENDER");
        if (limit === undefined)
            limit = 10;
        var template = Handlebars.compile($("#template-list-messages").html());

        for(var i=0; i < this.dashboard.length; i++) {
            var k = this.dashboard[i];
            
            if(this.messages.hasOwnProperty(k) === false)
                continue;

            var date = new Date(ObjectIDtoTime(k) * 1000);
            
            var stringDate = 
                    fixZero(date.getDay()) + "." +
                    fixZero(date.getMonth()) + "." +
                    (1900 + date.getYear()) + " " +
                    fixZero(date.getHours()) + ":" +
                    fixZero(date.getMinutes());
            
            var context = {
                msgid: k,
                address: this.messages[k].getAddress(),
                friend: chat.friends[this.messages[k].getAddress()].getName(),
                message: this.messages[k].getData(),
                date: stringDate
            };

            var html = template(context);

            $(".cc-table").append(html);
        }
    }
};