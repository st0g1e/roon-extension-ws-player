var topUrl = window.location.protocol + "//" + window.location.hostname + ":" + window.location.port;

var socket = io();
var zones; 
var curZone;
var lastSong = "";
var lastPicture = "";
var lastVolume = 0;
var inRangeSlider = false;

socket.on('zones', function(msg){
   if ( inRangeSlider == false ) {
     updateZoneList(msg);
     updateZone(msg);
   }
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

function updateZoneList(msg) {
  var isFirst = true;

  if ( zones == null || zones.length != msg.length ) {
    zones = msg;

    var html = "<h2>Zone List</h2>";
    html += "<ul>";

    for (var i in msg) {
      if ( isFirst == true ) {
        html += "<option value=" + msg[i].zone_id + " selected>" + msg[i].display_name + "</option>\n";
        curZone = msg[i].zone_id;
        isFirst = false;
      } else {
        html += "<option value=" + msg[i].zone_id + ">" + msg[i].display_name + "</option>\n";
      }
    }

    html += "</ul>";
    document.getElementById("zoneList").innerHTML = html;
  }
}

function updateZone(msg) {
//console.log("----" + JSON.stringify(msg[curZone]) );
  var zone = msg[curZone];

  if ( zone.state == "playing" || zone.state == "paused" ) {
    if ( zone.now_playing != null &&
         zone.now_playing.one_line.line1 == lastSong ) {
      if ( zone.outputs[0].volume != null && zone.outputs[0].volume.value != lastVolume ) {
        lastVolume = zone.outputs[0].volume.value;
        show_zone(msg[curZone]);
      }
    } else {
      lastSong = zone.now_playing.one_line.line1;

      if ( zone.outputs[0].volume != null && zone.outputs[0].volume.value != lastVolume ) {
        lastVolume = zone.outputs[0].volume.value;
      } 

      show_zone(msg[curZone]);
    }

    if ( zone.now_playing.image_key != lastPicture ) {
      lastPicture = zone.now_playing.image_key;
      socket.emit('getImage', lastPicture);
    }
  } else {
    blank_page();   
  }
}

function blank_page() {
  document.getElementById("artist").innerHTML = "";
  document.getElementById("album").innerHTML = "";
  document.getElementById("track").innerHTML = "";
  document.getElementById("prev").innerHTML = "";
  document.getElementById("playPause").innerHTML = "";
  document.getElementById("next").innerHTML = "";
  document.getElementById("rangeSlider").innerHTML = "";
  document.getElementById("icon").innerHTML = "";

}


function updateSelected() {
  curZone = document.getElementById("zoneList").options[document.getElementById("zoneList").selectedIndex].value;
  
  updateZone( zones );
}

function show_zone(zone) {
  document.getElementById("artist").innerHTML = zone.now_playing.three_line.line2;
  document.getElementById("album").innerHTML = zone.now_playing.three_line.line3;
  document.getElementById("track").innerHTML = zone.now_playing.three_line.line1;

  // Volumes

  sliderHtml = "";
  for ( var i in zone.outputs ) {
    if ( zone.outputs[i].zone_id == zone.zone_id && zone.outputs[i].volume != null ) {
      sliderHtml += "<input type=\"range\"";
      sliderHtml += " min=" + zone.outputs[i].volume.min;
      sliderHtml += " max=" + zone.outputs[i].volume.max;
      sliderHtml += " value=" + zone.outputs[i].volume.value;
      sliderHtml += " step=\"1\"";
      sliderHtml += " onmousedown=\"rangeMouseDown()\"\n";
      sliderHtml += " onmouseUp=\"rangeMouseUp()\"\n";
      sliderHtml += " onchange=\"changeVolume(this.value, \'" + zone.outputs[i].output_id + "\')\" \/>\n";
    }
  }

  document.getElementById("rangeSlider").innerHTML = sliderHtml;

  // Navigation Buttons

  document.getElementById("prev").innerHTML = "<input type=\"button\" value=\"prev\" onclick=\"goPrev(\'" + 
                                                     zone.zone_id + "\')\"/>\n";

  document.getElementById("playPause").innerHTML = "<input type=\"button\" value=\"play/pause\" onclick=\"goPlayPause(\'" + 
                                              zone.zone_id + "\')\"/>\n";

  document.getElementById("next").innerHTML = "<input type=\"button\" value=\"next\" onclick=\"goNext(\'" + 
                                              zone.zone_id + "\')\"/>\n";
}

function changeVolume(volume, outputId) {
  var vol = new Object();
  vol.volume = volume;
  vol.outputId = outputId;

  socket.emit('changeVolume', JSON.stringify(vol));
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

