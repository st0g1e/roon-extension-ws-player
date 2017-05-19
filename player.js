var topUrl = window.location.protocol + "//" + window.location.hostname + ":" + window.location.port;

var socket = io();
var zones;
var curZone = "";
var lastPicture = "";
var lastState = "";
var inRangeSlider = false;

socket.on('zones', function(msg){
   if ( inRangeSlider == false ) {
      zones = msg;

     if ( zones == null || zones.length != msg.length ) {
       updateZoneList();
     }

     updateZone();
   }
});

socket.on('defaultZone', function(msg){
  curZone = "";

  for (var i in zones) {
    if ( msg == zones[i].display_name ) {
      curZone = zones[i].zone_id;
      break;
    }
  }

  blank_page();
  updateZoneList();
  updateZone();
});

socket.on("image", function(info) {
  if (info.image) {
    var img = new Image();
    img.src = 'data:image/jpeg;base64,' + info.buffer;

    var list = document.getElementById("icon");

    if ( list.childNodes.length > 0 ) {
      list.removeChild(list.childNodes[0]);
    }

    list.appendChild(img);
  }
});

function updateZoneList() {
  if ( document.getElementById("zoneList") != null ) {
    var isFirst = true;

    var html = "<h2>Zone List</h2>";
    html += "<ul>";

    for (var i in zones) {
      if ( isFirst == true && curZone == "" ) {
        html += "<option value=" + zones[i].zone_id + " selected>" + zones[i].display_name + "</option>\n";
        curZone = zones[i].zone_id;
        isFirst = false;
      } else {
        if ( zones[curZone].display_name == zones[i].display_name ) {
          html += "<option value=" + zones[i].zone_id + " selected>" + zones[i].display_name + "</option>\n";
        } else {
          html += "<option value=" + zones[i].zone_id + ">" + zones[i].display_name + "</option>\n";
        }
      }
    }

    html += "</ul>";
    document.getElementById("zoneList").innerHTML = html;
  }
}

function updateZone() {
  var zone = zones[curZone];

  if ( zone != null ) {
    if ( zone.now_playing != null ) {
      show_zone( zone );

      if ( lastPicture != zone.now_playing.image_key ) {
        lastPicture = zone.now_playing.image_key;

        if ( zone.now_playing.image_key == null ) {
          var img = new Image();
          img.src = 'img/black.png';

          var list = document.getElementById("icon");

          if ( list.childNodes.length > 0 ) {
            list.removeChild(list.childNodes[0]);
          }

          list.appendChild(img);
        } else {
          socket.emit('getImage', zone.now_playing.image_key);
        }
      }
    } else {
      blank_page();
    }
  }
}

function blank_page() {
  lastPicture = "";
  lastState = "";
  inRangeSlider = false;

  document.getElementById("artist").innerHTML = "";
  document.getElementById("album").innerHTML = "";
  document.getElementById("track").innerHTML = "";
  document.getElementById("prev").innerHTML = "";
  document.getElementById("playPause").innerHTML = "";
  document.getElementById("next").innerHTML = "";
  document.getElementById("trackSeek").innerHTML = "";
  document.getElementById("icon").innerHTML = "";
}


function updateSelected() {
  curZone = document.getElementById("zoneList").options[document.getElementById("zoneList").selectedIndex].value;

  blank_page();
  updateZone();
}

function show_zone(zone) {
  document.getElementById("artist").innerHTML = zone.now_playing.three_line.line2;
  document.getElementById("album").innerHTML = zone.now_playing.three_line.line3;
  document.getElementById("track").innerHTML = zone.now_playing.three_line.line1;

  // Volumes

  vlmHtml = "";
  for ( var i in zone.outputs ) {
    if ( zone.outputs[i].zone_id == zone.zone_id && zone.outputs[i].volume != null ) {
      vlmHtml += "<input type=\"range\" class=\"volume\"";
      vlmHtml += " min=" + zone.outputs[i].volume.min;
      vlmHtml += " max=" + zone.outputs[i].volume.max;
      vlmHtml += " value=" + zone.outputs[i].volume.value;
      vlmHtml += " step=\"1\"";
      vlmHtml += " onmousedown=\"rangeMouseDown()\"\n";
      vlmHtml += " onmouseUp=\"rangeMouseUp()\"\n";
      vlmHtml += " onchange=\"changeVolume(this.value, \'" + zone.outputs[i].output_id + "\')\" \/>\n";
    }
  }

  document.getElementById("volume").innerHTML = vlmHtml;

// Track seek

trackSeekHtml = "";
  if ( zone.now_playing != null && zone.now_playing.seek_position != null ) {
    trackSeekHtml += "<input type=\"range\" class=\"seek\"";
    trackSeekHtml += " min=" + 0;
    trackSeekHtml += " max=" + zone.now_playing.length;
    trackSeekHtml += " value=" + zone.now_playing.seek_position;
    trackSeekHtml += " step=\"1\"";
    trackSeekHtml += " onmousedown=\"rangeMouseDown()\"\n";
    trackSeekHtml += " onmouseUp=\"rangeMouseUp()\"\n";
    trackSeekHtml += " onchange=\"seekTo(this.value, \'" + zone.outputs[i].output_id + "\')\" \/>\n";
}

document.getElementById("trackSeek").innerHTML = trackSeekHtml;

  // Navigation Buttons

  document.getElementById("prev").innerHTML = "<input type=\"button\" value=\"prev\" onclick=\"goPrev(\'" +
                                                     zone.zone_id + "\')\"/>\n";

  if ( lastState != zone.state ) {
    if ( zone.state == "playing") {
      document.getElementById("playPause").innerHTML = "<a href=\'javascript:void(0);\' onclick=\"goPlayPause(\'" +
                                                       zone.zone_id + "\')\"/><img src=\'img/pause.png\'></src></a>\n";
    } else {
      document.getElementById("playPause").innerHTML = "<a href=\'javascript:void(0);\' onclick=\"goPlayPause(\'" +
                                                       zone.zone_id + "\')\"/><img src=\'img/play.png\'></src></a>\n";
    }
  }

  lastState = zone.state;

  document.getElementById("next").innerHTML = "<input type=\"button\" value=\"next\" onclick=\"goNext(\'" +
                                              zone.zone_id + "\')\"/>\n";
}

function changeVolume(volume, outputId) {
  var vol = new Object();
  vol.volume = volume;
  vol.outputId = outputId;

  socket.emit('changeVolume', JSON.stringify(vol));
}

function seekTo(seek, outputId) {
  var seekNow = new Object();
  seekNow.seek = seek;
  seekNow.outputId = outputId;

  socket.emit('seek', JSON.stringify(seekNow));
}

function rangeMouseDown() {
  inRangeSlider = true;
}

function rangeMouseUp() {
  inRangeSlider = false;
}

function goPrev(zone_id) {
  socket.emit('goPrev', zone_id);
}

function goNext(zone_id) {
  socket.emit('goNext', zone_id);
}

function goPlayPause(zone_id) {
  socket.emit('goPlayPause', zone_id);
}
