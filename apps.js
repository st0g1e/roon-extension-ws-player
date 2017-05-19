var RoonApi          = require("node-roon-api");
var RoonApiTransport = require("node-roon-api-transport");
var RoonApiStatus    = require("node-roon-api-status");
var RoonApiImage     = require("node-roon-api-image");
var RoonApiSettings  = require('node-roon-api-settings');

var path = require('path');
var transport;

var express = require('express');
var http = require('http');

var app = express();
var server = http.createServer(app);
var io = require('socket.io').listen(server);

app.use(express.static(path.join(__dirname, '')));

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});


var core;
var zones = [];

var roon = new RoonApi({
   extension_id:        'st0g1e.roon-ws-browser',
   display_name:        "roon-ws-browser",
   display_version:     "0.0.1",
   publisher:           'bastian ramelan',
   email:		'st0g1e@yahoo.com',

   core_paired: function(core_) {
	core = core_;

	transport = core_.services.RoonApiTransport;

	transport.subscribe_zones((response, msg) => {
            if (response == "Subscribed") {
                let curZones = msg.zones.reduce((p,e) => (p[e.zone_id] = e) && p, {});
                zones = curZones;
            } else if (response == "Changed") {
                var z;
                if (msg.zones_removed) msg.zones_removed.forEach(e => delete(zones[e.zone_id]));
                if (msg.zones_added)   msg.zones_added  .forEach(e => zones[e.zone_id] = e);
                if (msg.zones_changed) msg.zones_changed.forEach(e => zones[e.zone_id] = e);
            }

            io.emit("zones", zones);
        });

   },

   core_unpaired: function(core_) {

   }
});

var mysettings = roon.load_config("settings") || {
    webport: "3002",
};

function makelayout(settings) {
    var l = {
      values:    settings,
	    layout:    [],
	    has_error: false
    };

    l.layout.push({
        type:      "string",
        title:     "HTTP Port",
        maxlength: 256,
        setting:   "webport",
    });

    l.layout.push({
        type:      "string",
        title:     "Default Zone",
        maxlength: 256,
        setting:   "defaultZone",
    });

    return l;
}

var svc_settings = new RoonApiSettings(roon, {
    get_settings: function(cb) {
        cb(makelayout(mysettings));
    },
    save_settings: function(req, isdryrun, settings) {
	let l = makelayout(settings.values);
        req.send_complete(l.has_error ? "NotValid" : "Success", { settings: l });

        if (!isdryrun && !l.has_error) {
            var oldport = mysettings.webport;
            mysettings = l.values;
            svc_settings.update_settings(l);
            if (oldport != mysettings.webport) change_web_port(mysettings.webport);
            roon.save_config("settings", mysettings);
        }
    }
});

var svc_status = new RoonApiStatus(roon);

roon.init_services({
   required_services: [ RoonApiTransport, RoonApiImage ],
   provided_services: [ svc_status, svc_settings ],
});

svc_status.set_status("Extension enabled", false);
roon.start_discovery();


function get_image(image_key, scale, width, height, format) {
   core.services.RoonApiImage.get_image(image_key, {scale, width, height, format}, function(cb, contentType, body) {
      io.emit('image', { image: true, buffer: body.toString('base64') });
   });
};

function change_web_port() {
   server.close();
   server.listen(mysettings.webport, function() {
   console.log('Listening on port: ' + mysettings.webport);
   });
}

server.listen(mysettings.webport, function() {
   console.log('Listening on port: ' + mysettings.webport);
});

// ---------------------------- WEB SOCKET --------------

io.on('connection', function(socket){
//  console.log('a user connected');
  io.emit("zones", zones);
  io.emit("defaultZone", mysettings.defaultZone);

  socket.on('disconnect', function(){
//    console.log('user disconnected');
  });

  socket.on('changeVolume', function(msg) {
    var obj = JSON.parse(msg);

    transport.change_volume(obj.outputId, "absolute", obj.volume);
  });

  socket.on('seek', function(msg) {
      var obj = JSON.parse(msg);

      transport.seek(obj.outputId, "absolute", obj.seek);
  });

  socket.on('goPrev', function(msg){
    transport.control(msg, 'previous');
  });

  socket.on('goNext', function(msg){
    transport.control(msg, 'next');
  });

  socket.on('goPlayPause', function(msg){
    transport.control(msg, 'playpause');
  });

  socket.on('goPlay', function(msg){
    transport.control(msg, 'play');
  });

  socket.on('goPause', function(msg){
    transport.control(msg, 'pause');
  });

  socket.on('getImage', function(msg){
     core.services.RoonApiImage.get_image(msg, {"scale": "fit", "width": 300, "height": 200, "format": "image/jpeg"}, function(cb, contentType, body) {
        socket.emit('image', { image: true, buffer: body.toString('base64') });
     });
  });

});

// --------------------- http gets -------------------------

app.get('/', function(req, res){
  res.sendFile(__dirname + '/player.html');
});

app.get('/roonAPI/listZones', function(req, res) {
  res.send({
    "zones": zones
  })
});

app.get('/roonAPI/play_pause', function(req, res) {
    core.services.RoonApiTransport.control(zones[req.query['zoneId']], 'playpause');

   res.send({
    "status": "success"
  })
});

app.get('/roonAPI/previous', function(req, res) {
    core.services.RoonApiTransport.control(zones[req.query['zoneId']], 'previous');

    res.send({
       "zone": req.headers.referer
    })
});

app.get('/roonAPI/next', function(req, res) {
  core.services.RoonApiTransport.control(zones[req.query['zoneId']], 'next');

  res.send({
    "zone": core.services.RoonApiTransport.zone_by_zone_id(req.query['zoneId'])
  })
});
