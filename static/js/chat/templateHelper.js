String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

$(function() {
    Handlebars.registerHelper('render', function(context, options) {
        if(typeof context === 'object') {
            var call = context.hash['method'].capitalize() + "','";
            call += "{";
            
            for(var k in context.hash)
                call += "\""+k+"\":\""+context.hash[k]+"\",";
            
            call = call.substr(0, call.length-1);
            call += "}";
        } else {
            var call = context.charAt(0).toUpperCase() + context.slice(1);
        }

        return 'application.render(\''+call+'\')';
    });
    
    Handlebars.registerHelper('cut', function(context, options) {
        if(typeof context === 'object') {
            var text = context.hash['s'];
            var limit = context.hash['l'];
            
            if(text.length > limit)
                return text.substr(0, limit)+"...";
            
            return text;
            
        } else {
            alert("Cut text must be object!!!");
        }
        return null;
    });
});