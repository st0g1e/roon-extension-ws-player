var RoonApi          = require("node-roon-api");
var RoonApiTransport = require("node-roon-api-transport");
var RoonApiStatus    = require("node-roon-api-status");
var RoonApiImage     = require("node-roon-api-image");
var RoonApiSettings  = require('node-roon-api-settings');
var RoonApiBrowse    = require("node-roon-api-browse");

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

var timeout;

var roon = new RoonApi({
   extension_id:        'st0g1e.roon-ws-browser',
   display_name:        "roon-ws-browser",
   display_version:     "2.0.0",
   publisher:           'bastian ramelan',
   email:		            'st0g1e@yahoo.com',
   log_level:           'none',

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
   required_services: [ RoonApiTransport, RoonApiImage, RoonApiBrowse ],
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
  io.emit("initialzones", zones);
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

app.get('/roonAPI/pause', function(req, res) {
    core.services.RoonApiTransport.control(zones[req.query['zoneId']], 'pause');

   res.send({
    "status": "success"
  })
});

app.get('/roonAPI/play', function(req, res) {
    core.services.RoonApiTransport.control(zones[req.query['zoneId']], 'play');

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

app.get('/roonAPI/listSearch', function(req, res) {
   refresh_browse( req.query['zoneId'], { item_key: req.query['item_key'], input: req.query['toSearch'] }, 0, 100, function(myList) {
    res.send({
      "list": myList
    })
  });
});

app.get('/roonAPI/listByItemKey', function(req, res) {
   refresh_browse( req.query['zoneId'], { item_key: req.query['item_key'] }, 0, 100, function(myList) {

   res.send({
     "list": myList
   })
  });
});

app.get('/roonAPI/goUp', function(req, res) {
   refresh_browse( req.query['zoneId'], { pop_levels: 1 }, 1, 100,  function(myList) {

    res.send({
      "list": myList
    })
  });

});

app.get('/roonAPI/goHome', function(req, res) {
   refresh_browse( req.query['zoneId'], { pop_all: true }, 1, 100, function(myList) {

   res.send({
     "list": myList
    })
  });
});

app.get('/roonAPI/listRefresh', function(req, res) {
   refresh_browse( req.query['zoneId'], { refresh_list: true }, 0, 0, function(myList) {

   res.send({
     "list": myList
    })
  });
});

app.get('/roonAPI/getIcon', function( req, res ) {
  get_image( req.query['image_key'], "fit", 100, 100, "image/jpeg", res);
});

// --------------- Helper Functions -----------------------

function refresh_browse(zone_id, opts, page, listPerPage, cb) {
    var items = [];
    opts = Object.assign({
        hierarchy:          "browse",
        zone_or_output_id:  zone_id,
    }, opts);


    core.services.RoonApiBrowse.browse(opts, (err, r) => {
        if (err) { console.log(err, r); return; }

        if (r.action == 'list') {
            page = ( page - 1 ) * listPerPage;

            core.services.RoonApiBrowse.load({
                hierarchy:          "browse",
                offset:             page,
                set_display_offset: listPerPage,
            }, (err, r) => {
                items = r.items;

                cb(r.items);
            });
        }
    });
}

function get_image(image_key, scale, width, height, format, res) {
   core.services.RoonApiImage.get_image(image_key, {scale, width, height, format}, function(cb, contentType, body) {

      res.contentType = contentType;

      res.writeHead(200, {'Content-Type': 'image/gif' });
      res.end(body, 'binary');
   });
};

// Timers

app.get('/roonAPI/addTimer', function(req, res) {
  save_timer( req.query['zoneId'],
              req.query['frequency'],
              req.query['hour'],
              req.query['minute'],
              req.query['isRepeat']);

  var timers = get_timers();

  res.send({
    "timers": timers
  })
});

app.get('/roonAPI/getTimers', function(req, res) {
  var timers = get_timers();

  res.send({
    "timers": timers
  })
});

app.get('/roonAPI/removeTimer', function(req, res) {
  var timers = get_timers();
  var idToRemove = req.query['id'];

  for ( var i in timers ) {
    if ( timers[i].id == idToRemove ) {
      timers.splice(i, 1);
      break;
    }
  }

  roon.save_config("my_timers", timers);

  run_later();
  var timers = get_timers();

  res.send({
   "timers": timers
  })
});

function get_timers() {
  var run_laters = roon.load_config("my_timers");

  return run_laters;
}

function save_timer(zoneId, frequency, hour, minute, isRepeat ) {
  var toAdd = {};

  var timers = get_timers();

  if ( timers == null ) {
    timers = [];
  }

  toAdd.id = Math.floor(Date.now() / 1000);
  toAdd.frequency = frequency;
  toAdd.hour = hour;
  toAdd.minute = minute;
  toAdd.isRepeat = isRepeat;
  toAdd.zone_id = zoneId;

  toAdd.nextRun = nextRun( frequency, hour, minute, isRepeat);

  if ( timers == null ) {
    timers = [];
  }

  timers.push(toAdd);

  roon.save_config("my_timers", timers);
  refresh_timer();
}

function refresh_timer() {
  var timers = get_timers();


  var dateNow = new Date();

  var newTimers = [];
  var isFirst = true;

  for ( var i in timers ) {
    if (timers[i].nextRun > dateNow.getTime() ) {
      if ( newTimers == null ) {
        newTimers = [];
      }

      newTimers.push( timers[i]);
    } else {
      if ( timers[i].command != "Once" && timers[i].isRepeat == "Yes") {
        timers[i].nextRun = nextRun( timers[i].frequency,
                                              timers[i].hour,
                                              timers[i].minute,
                                              timers[i].isRepeat);

        if ( newTimers == null ) {
          newTimers = [];
        }

        newTimers.push( timers[i]);
      }
    }
  }

  newTimers.sort(compare)
  roon.save_config("my_timers", newTimers);

  run_later();
}

function compare(a, b) {
  //arrayname.sort(compare);
  if ( a.nextRun < b.nextRun ) { return -1; }
  if ( a.nextRun > b.nextRun ) { return 1; }
  return 0;
}


function nextRun( frequency, hour, minute, isRepeat) {
  var days = {};
  days['Sunday']    = 0;
  days['Monday']    = 1;
  days['Tuesday']   = 2;
  days['Wednesday'] = 3;
  days['Thursday']  = 4;
  days['Friday']    = 5;
  days['Saturday']  = 6;

  var returnDate = new Date();
  var isToday = false;

  // check if the timer needs to run today
  if ( (returnDate.getHours() < hour || ( returnDate.getHours() == hour && returnDate.getMinutes() < minute )) &&
        ( frequency == "Once" || frequency == "Daily" ||
          ( frequency in days && days[frequency] == returnDate.getDay() ) ||
          ( frequency == "Weekdays" && returnDate.getDay() < 5 ) ) ) {

            returnDate.setHours( hour );
            returnDate.setMinutes( minute );
            returnDate.setSeconds( 0 );

            isToday = true;
  } else {
    if ( frequency in days) {
      returnDate = nextDate( days[frequency] );
    } else {
      if ( frequency == "Daily") {
        returnDate = nextDate( (returnDate.getDay() + 1) % 7 );
      } else if ( frequency == "Weekdays" ) {
        if ( returnDate.getDay() > 5 ) {
          returnDate = nextDate( 1 );
        } else {
          returnDate = nextDate( returnDate.getDay() + 1);
        }
      }
    }

    returnDate.setHours( hour );
    returnDate.setMinutes( minute );
    returnDate.setSeconds( 0 );
  }

  return returnDate.getTime();
}

//takes dayIndex from sunday(0) to saturday(6)
function nextDate(dayIndex) {
    var today = new Date();
    today.setDate(today.getDate() + (dayIndex - 1 - today.getDay() + 7) % 7 + 1);
    return today;
}

function run_later() {
  clearTimeout(timeout);

  var timers = get_timers();
  var timer;

  if ( timers != null && timers.length > 0 ) {
    timer = timers[0];

    var date = new Date(parseInt(timer.nextRun));
    var curDate = new Date();

    var lapse = date - curDate;

    timeout = setTimeout( function () {
      playAlarm();
      run_later();
    },  lapse);
  }
}

function playAlarm() {
  var timers = get_timers();
  var dateNow = new Date();

  for ( var i in timers ) {
    if (timers[i].nextRun <= dateNow.getTime() ) {
        playZone( timers[i].zone_id);
        io.emit("alarmWentOff", timers[i].zone_id);
    }
  }

  refresh_timer();
}

function playZone(zoneId) {
  core.services.RoonApiTransport.control(zoneId, 'play');
}

function pauseZone(zoneId) {
  refresh_timer();
  core.services.RoonApiTransport.control(zoneId, 'pause');
}
