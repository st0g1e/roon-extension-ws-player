var topUrl = window.location.protocol + "//" + window.location.hostname + ":" + window.location.port;
var curZone = window.location.search.split('=')[1];
var referer = "player.html?zone_id=" + curZone;

var months = ["Jan", "Feb", "Mar", "Apr", "May", "June", "July", "Aug", "Sep", "Oct", "Nov", "Dec"];

var socket = io();
var zone;

socket.on('initialzones', function(msg){
  zone = msg[curZone];

  document.getElementById("back").innerHTML = "<a href=\"" + referer + "\">back</a>";
  document.getElementById("zone").innerHTML = zone.display_name +
                                              " | <a href=\"timerAdd.html?zone_id=" + zone.zone_id + "\">add</a>\n" +
                                              " | <a href=\"snooze.html?zone_id=" + curZone + "\">" +
                                              "<img src=\"img/alarm.png\" width=\"15\" height=\"15\"></a>\n";

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
  var optHtml = "";

  // CREATE TIMER LIST
  ajax_get(topUrl + '/roonAPI/getTimers', function(data) {
     var html = "";
     var curDate = new Date();
     var timerDate;
     var minute;

     html += "<div style=\"overflow-x:auto;\">\n";
     html += "<center>\n";
     html += "<table><tr>\n";
     html += "<th>Next Run</th>\n";
     html += "<th>Is Repeat</th>\n";
     html += "<th>Repeat Frequency</th>\n";
     html += "<th>Time</th>\n";
     html += "<th>Status</th>\n";
     html += "</tr>\n";

     if (data != null ) {
       for ( var i in data.timers ) {
         if ( data.timers[i].zone_id == zone.zone_id ) {
           minute = data.timers[i].minute;

           if ( minute < 10 ) {
             minute = "0" + minute;
           }

           html += "<tr>\n";
           html += "<td>" + dateTimeFromDate(data.timers[i].nextRun) + "</td>\n";
           html += "<td>" + data.timers[i].isRepeat + "</td>\n";

           html += "<td>" + data.timers[i].frequency + "</td>\n";
           html += "<td>";

           if ( data.timers[i].hour == 0 ) {
             html += "12:" + minute + " AM";
           } else if ( data.timers[i].hour > 12 ) {
             html += data.timers[i].hour - 12 + ":" + minute + " PM";
           } else {
             html += data.timers[i].hour + ":" + minute + " AM";
           }

           html += "</td>\n";

           html += "<td><a href=\'javascript:void(0);\' onclick=\"removeTimer(\'" +  data.timers[i].id + "\');\">remove</a></td>\n";
           html += "</tr>\n";
         }
       }
     }

     html += "</table>\n";
     html += "</center>\n";
     html += "</div>\n";

     document.getElementById("TimerArea").innerHTML = html;
  });
}


function dateTimeFromDate(timerDate) {
  var date = new Date(parseInt(timerDate));

  var dateTime = "";

  var mth = months[date.getMonth()];
  var day = date.getDate();
  var year = date.getFullYear();
  var hour = date.getHours();
  var min = date.getMinutes();
  var sec = date.getSeconds();
  var timeOfDay = "AM";

  if ( hour == 0 ) {
    hour = 12;
  } else if ( hour > 13 ) {
    hour = hour - 12;
    timeOfDay = "PM";
  }

  if ( min < 10 ) {
    min = "0" + min;
  }

  dateTime = day + " " + mth + " " + year + ", at " + hour + ":" + min + " " + timeOfDay;
  return dateTime;
}

function removeTimer(id) {

    ajax_get(topUrl + '/roonAPI/removeTimer?id=' + id, function(data) {
      show_data();
    });
}

function addTimer(form) {
  var zone_id = form.zoneListByTimer.value;
  var second = form.second.value
  var minute  = form.minute.value;
  var hour = form.hour.value;
  var command = form.command.value;
  var milliseconds = 0;
  var dateNow = new Date();

  if ( second == null ) {
    second = 0;
  }

  if ( minute == null ) {
    minute = 0;
  }

  if ( hour == null ) {
    hour = 0;
  }

  milliseconds = ( hour * 60 * 60 * 1000 ) + (minute * 60 * 1000) + (second * 1000);

  var timerDate = dateNow.getTime() + milliseconds;

  addTimer(zone_id, timerDate, command, 0);
}

function addTimer(zone_id, time, command, isRepeat) {
  ajax_get(topUrl + '/roonAPI/addTimer?zoneId=' + zone_id + "&time=" + time + "&command=" + command + "&isRepeat=" + isRepeat, function(data) {
    show_data();
  });
}
