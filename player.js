var topUrl = window.location.protocol + "//" + window.location.hostname + ":" + window.location.port;

var socket = io();
var zones;
var curZone = "";
var lastPicture = "";
var lastState = "";
var inRangeSlider = false;
var urlZone = "";

socket.on('initialzones', function(msg){
  if ( window.location.search ) {
    urlZone = window.location.search.split('=')[1];
    curZone = urlZone;
  }

  zones = msg;
  updateZoneList();
  updateZone();
});

socket.on('zones', function(msg){
   if ( inRangeSlider == false ) {
     zones = msg;
     updateZone();
   }
});

socket.on('zonesList', function(msg){
  zones = msg;

  if ( zones != null ) {
    updateSelected();
  }

  updateZone();
});

socket.on('alarmWentOff', function(msg){
  zoneId = msg;

  if ( zoneId == curZone ) {
    location.href = "snooze.html?zone_id=" + zoneId;
  }
});


socket.on('defaultZone', function(msg){
  if ( urlZone == "") {
      for (var i in zones) {
        if ( msg == zones[i].display_name ) {
          curZone = zones[i].zone_id;
          break;
        }
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
      if ( isFirst == true && !curZone ) {
        html += "<option value=" + zones[i].zone_id + " selected>" + zones[i].display_name + "</option>\n";
        curZone = zones[i].zone_id;
        isFirst = false;
      } else {
        if ( zones[curZone] && zones[curZone].display_name == zones[i].display_name ) {
          html += "<option value=" + zones[i].zone_id + " selected>" + zones[i].display_name + "</option>\n";
        } else {
          html += "<option value=" + zones[i].zone_id + ">" + zones[i].display_name + "</option>\n";
        }
      }
    }

    html += "</ul>";
    document.getElementById("zoneList").innerHTML = html;
    document.getElementById("search").innerHTML = "<a href=\"browser.html?zone_id=" + curZone + "\">" +
                                                  "<img src=\"img/search.png\" width=\"15\" height=\"15\"></a>\n" +
                                                  "&nbsp;&nbsp;<a href=\"timers.html?zone_id=" + curZone + "\">" +
                                                  "<img src=\"img/alarm.png\" width=\"15\" height=\"15\"></a>\n";
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
  document.getElementById("search").innerHTML = "";
}


function updateSelected() {
  curZone = document.getElementById("zoneList").options[document.getElementById("zoneList").selectedIndex].value;

  blank_page();
  document.getElementById("search").innerHTML = "<a href=\"browser.html?zone_id=" + curZone + "\">" +
                                                "<img src=\"img/search.png\" width=\"15\" height=\"15\"></a>\n" +
                                                "&nbsp;&nbsp;<a href=\"timers.html?zone_id=" + curZone + "\">" +
                                                "<img src=\"img/alarm.png\" width=\"15\" height=\"15\"></a>\n";

  updateZoneList();
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

// --------------------------  BROWSER PAGE -----------------------------------

function toggle(div_id) {
	var el = document.getElementById(div_id);
	if ( el.style.display == 'none' ) {	el.style.display = 'block';}
	else {el.style.display = 'none';}
}

function blanket_size(popUpDivVar) {
	if (typeof window.innerWidth != 'undefined') {
		viewportheight = window.innerHeight;
	} else {
		viewportheight = document.documentElement.clientHeight;
	}
	if ((viewportheight > document.body.parentNode.scrollHeight) && (viewportheight > document.body.parentNode.clientHeight)) {
		blanket_height = viewportheight;
	} else {
		if (document.body.parentNode.clientHeight > document.body.parentNode.scrollHeight) {
			blanket_height = document.body.parentNode.clientHeight;
		} else {
			blanket_height = document.body.parentNode.scrollHeight;
		}
	}
	var blanket = document.getElementById('blanket');
	blanket.style.height = blanket_height + 'px';
	var popUpDiv = document.getElementById(popUpDivVar);
	popUpDiv_height=blanket_height/2-150;//150 is half popup's height
	popUpDiv.style.top = popUpDiv_height + 'px';
}

function window_pos(popUpDivVar) {
	if (typeof window.innerWidth != 'undefined') {
		viewportwidth = window.innerHeight;
	} else {
		viewportwidth = document.documentElement.clientHeight;
	}
	if ((viewportwidth > document.body.parentNode.scrollWidth) && (viewportwidth > document.body.parentNode.clientWidth)) {
		window_width = viewportwidth;
	} else {
		if (document.body.parentNode.clientWidth > document.body.parentNode.scrollWidth) {
			window_width = document.body.parentNode.clientWidth;
		} else {
			window_width = document.body.parentNode.scrollWidth;
		}
	}
	var popUpDiv = document.getElementById(popUpDivVar);
	window_width=window_width/2-150;//150 is half popup's width
	popUpDiv.style.left = window_width + 'px';
}

function popup(windowname) {
	blanket_size(windowname);
	window_pos(windowname);
	toggle('blanket');
	toggle(windowname);
}

function getZoneSimple(orgZones) {
  var jsonStr;
  var isFirst = 1;

  jsonStr ="{";

  for (var i in orgZones) {
    if ( isFirst == 0 ) {
      jsonStr += ",";
    } else {
      isFirst = 0;
    }

    jsonStr += "\"" + orgZones[i].zone_id + "\": {";
    jsonStr += "\"zone_id\":\"" + orgZones[i].zone_id + "\", ";
    jsonStr += "\"display_name\":\"" + orgZones[i].display_name + "\"}";
  }

  jsonStr += "}";

  return JSON.parse(jsonStr);
}
