var RoonApi          = require("node-roon-api");
var RoonApiTransport = require("node-roon-api-transport");
var RoonApiStatus    = require("node-roon-api-status");
var RoonApiImage     = require("node-roon-api-image");

var path = require('path');
var transport;

var express = require('express');
var http = require('http');

var app = express();
var server = http.createServer(app);
var io = require('socket.io').listen(server);

const PORT = 3002; 

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

var svc_status = new RoonApiStatus(roon);

roon.init_services({
   required_services: [ RoonApiTransport, RoonApiImage ],
   provided_services: [ svc_status ],
});

svc_status.set_status("Extension enabled", false);
roon.start_discovery();


function get_image(image_key, scale, width, height, format) {
   core.services.RoonApiImage.get_image(image_key, {scale, width, height, format}, function(cb, contentType, body) {
      io.emit('image', { image: true, buffer: body.toString('base64') });
   });
};

server.listen(PORT, function() {
   console.log('Listening on port' + PORT);
});

// ---------------------------- WEB SOCKET --------------

app.get('/', function(req, res){
  res.sendFile(__dirname + '/player.html');
});

io.on('connection', function(socket){
//  console.log('a user connected');
  io.emit("zones", zones);

  socket.on('disconnect', function(){
//    console.log('user disconnected');
  });

  socket.on('changeVolume', function(msg) {
    var obj = JSON.parse(msg);

    transport.change_volume(obj.outputId, "absolute", obj.volume);
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
