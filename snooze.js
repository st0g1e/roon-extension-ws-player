var topUrl = window.location.protocol + "//" + window.location.hostname + ":" + window.location.port;
var curZone = window.location.search.split('=')[1];
var referer = "player.html?zone_id=" + curZone;

var socket = io();
var zone;

socket.on('initialzones', function(msg){
  zone = msg[curZone];

  document.getElementById("back").innerHTML = "<a href=\"" + referer + "\">back</a>";
  document.getElementById("zone").innerHTML = zone.display_name;
  show_data();
});

function ajax_get(url, callback) {
    xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
            try {
                var data = JSON.parse(xmlhttp.responseText);
            } catch(err) {
                return;
            }
            callback(data);
        }
    };

    xmlhttp.open("GET", url, true);
    xmlhttp.send();
}

function show_data() {
  var snoozeHtml = "";

  snoozeHtml += "<center>\n";
  snoozeHtml += "<table>\n";
  snoozeHtml += "<tr><td>\n";

  snoozeHtml += "<div class=\"round-button\">\n";
  snoozeHtml += "<div class=\"round-button-circle\">\n";
  snoozeHtml += "<a href=\'javascript:void(0);\' onclick=\"goPause();\">\n";
  snoozeHtml += "&nbsp;&nbsp;pause&nbsp;&nbsp;\n";
  snoozeHtml += "</a></div></div>\n";

  snoozeHtml += "</td><td>\n";

  snoozeHtml += "<div class=\"round-button\">\n";
  snoozeHtml += "<div class=\"round-button-circle\">\n";
  snoozeHtml += "<a href=\'javascript:void(0);\' onclick=\"snooze();\">\n";
  snoozeHtml += "&nbsp;&nbsp;snooze&nbsp;&nbsp;\n";
  snoozeHtml += "</a></div></div>\n";

  snoozeHtml += "</td><td>\n";

  snoozeHtml += "<div class=\"round-button\">\n";
  snoozeHtml += "<div class=\"round-button-circle\">\n";
  snoozeHtml += "<a href=\'javascript:void(0);\' onclick=\"goBack();\">\n";
  snoozeHtml += "&nbsp;&nbsp;close&nbsp;&nbsp;\n";
  snoozeHtml += "</a></div></div>\n";

  snoozeHtml += "</td></tr>\n";
  snoozeHtml += "</table>\n";
  snoozeHtml += "</center>\n";

  document.getElementById("snooze").innerHTML = snoozeHtml;

}

function goPause() {
  ajax_get(topUrl + '/roonAPI/pause?zoneId=' + zone.zone_id, function(data) {

    location.href = referer;
  });
}

function goBack() {
  location.href = referer;
}

function snooze(frequency, hour, minute, isRepeat) {
  var curDate = new Date();
  curDate.setMinutes( curDate.getMinutes() + 9 );
  ajax_get(topUrl + '/roonAPI/addTimer?zoneId=' + zone.zone_id +
                    "&frequency=Once&hour=" + curDate.getHours() +
                    "&minute=" + curDate.getMinutes() +
                    "&isRepeat=No", function(data) {

    goPause();
  });
}
