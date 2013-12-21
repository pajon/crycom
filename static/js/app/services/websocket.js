define(['./module'], function (serviceModule) {
    'use strict';

    serviceModule.factory('websocket', [ '$location', function ($location) {
        var Service = {};

        // WEBSOCKET
        var websocket = null;

        var callbacks = {};

        var event_cbid = 0;
        var event_callbacks = new Array();

        function callEvent(event) {
            event_callbacks.map(function (val) {
                if (val.type === event)
                    val.callback();
            });
        }

        Service.register = function (event, fn) {
            if (["onopen", "onclose", "onerror"].indexOf(event) !== -1) {
                event_callbacks[event_cbid] = {
                    callback: fn,
                    type: event
                }
                return event_cbid++;
            } else {
                return alert("Wrong type event!");
            }
        }

        Service.unregister = function (cbid) {
            if (event_callbacks[cbid] !== undefined)
                delete event_callbacks[cbid];
        }


        Service.connect = function (address) {
            websocket = new WebSocket(address);
            websocket.binaryType = 'arraybuffer';

            websocket.onopen = function (e) {
                callEvent('onopen')
                console.log("CONNECT");
            };
            websocket.onclose = function () {
                callEvent('onclose')
                console.log("CLOSE");
            };
            websocket.onmessage = function (e) {
                // text (typeof e.data === 'string')
                // binnary (typeof e.data === 'object')
                console.log("NEW PACKET");

                if (typeof e.data === 'string') {
                    var packet = new Packet(e.data);
                } else {
                    var packet = new Packet(new Uint8Array(e.data));
                }
                console.log("PACKET: %d %d %d", packet.getType(), packet.getSubType(), packet.getData().length);

                var key = packet.getType() + "-" + packet.getSubType();

                if (callbacks.hasOwnProperty(key)) {
                    callbacks[key](packet);
                } else {
                    var key = packet.getType() + "-";
                    if (callbacks.hasOwnProperty(key))
                        callbacks[key](packet);
                    else
                        alert('missed controller: ' + packet.getType() + "-" + packet.getSubType());
                }
            };

            websocket.onerror = function (e) {
                callEvent('onerror')
                $('#debug').html($('#debug').html() + "ERROR" + "<br>");
            };
        };

        Service.handlePacket = function (filter, fn) {
            if (filter.hasOwnProperty('type') === false) {
                console.log("Websocket handlePacket filter must contain type property!");
                return false;
            }

            var key = filter.type + "-";
            if (filter.hasOwnProperty('subtype'))
                key += filter.subtype;

            if (callbacks.hasOwnProperty(key)) {
                console.log("Websocket callback on key (" + key + ") is definned!");
            } else {
                callbacks[key] = fn;
            }
        };

        Service.send = function (data) {
            websocket.send(data);
        };

        return Service;
    }]);
});