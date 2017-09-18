var topUrl = window.location.protocol + "//" + window.location.hostname + ":" + window.location.port;
var curZone = window.location.search.split('=')[1];
var referer = "timers.html?zone_id=" + curZone;

var socket = io();
var zone;

socket.on('initialzones', function(msg){
  zone = msg[curZone];

//  document.getElementById("back").innerHTML = "<a href=\"" + referer + "\">back</a>";
//  document.getElementById("zone").innerHTML = zone.display_name;
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
  var html = "";
  var freqHtml = "";
  var hourHtml = "";
  var minuteHtml = "";
  var isRepeatHtml = "";

  html += "<center>\n";
  html += "<table>\n";
  html += "<tr><td>\n";
  html += "Alarm for\n";
  html += "</td><td>:</td><td>\n";

  freqHtml += "<select name=\"frequency\">\n";
  freqHtml += "<option value=\"Once\">Once</option>\n";
  freqHtml += "<option value=\"Daily\">Daily</option>\n";
  freqHtml += "<option value=\"Weekdays\" selected>Weekdays</option>\n";
  freqHtml += "<option value=\"Sunday\">Sunday</option>\n";
  freqHtml += "<option value=\"Monday\">Monday</option>\n";
  freqHtml += "<option value=\"Tuesday\">Tuesday</option>\n";
  freqHtml += "<option value=\"Wednesday\">Wednesday</option>\n";
  freqHtml += "<option value=\"Thursday\">Thursday</option>\n";
  freqHtml += "<option value=\"Friday\">Friday</option>\n";
  freqHtml += "<option value=\"Saturday\">Saturday</option>\n";
  freqHtml += "<\select>\n";

  html += freqHtml;

  html += "</td></tr>\n";
  html += "<tr><td>\n";
  html += "Time:\n";
  html += "</td><td>:</td><td>\n";

  hourHtml += "<select name=\"hour\">\n";
  hourHtml += "<option value=0>12 AM</option>\n";
  hourHtml += "<option value=1>1 AM</option>\n";
  hourHtml += "<option value=2>2 AM</option>\n";
  hourHtml += "<option value=3>3 AM</option>\n";
  hourHtml += "<option value=4>4 AM</option>\n";
  hourHtml += "<option value=5>5 AM</option>\n";
  hourHtml += "<option value=6>6 AM</option>\n";
  hourHtml += "<option value=7>7 AM</option>\n";
  hourHtml += "<option value=8>8 AM</option>\n";
  hourHtml += "<option value=9>9 AM</option>\n";
  hourHtml += "<option value=10>10 AM</option>\n";
  hourHtml += "<option value=11>11 AM</option>\n";
  hourHtml += "<option value=12>12 PM</option>\n";
  hourHtml += "<option value=13>1 PM</option>\n";
  hourHtml += "<option value=14>2 PM</option>\n";
  hourHtml += "<option value=15>3 PM</option>\n";
  hourHtml += "<option value=16>4 PM</option>\n";
  hourHtml += "<option value=17>5 PM</option>\n";
  hourHtml += "<option value=18>6 PM</option>\n";
  hourHtml += "<option value=19>7 PM</option>\n";
  hourHtml += "<option value=20>8 PM</option>\n";
  hourHtml += "<option value=21>9 PM</option>\n";
  hourHtml += "<option value=22>10 PM</option>\n";
  hourHtml += "<option value=23>11 PM</option>\n";
  hourHtml += "</select>\n";

  minuteHtml += "<select name=\"minute\">\n";
  minuteHtml += "<option value=\"00\" selected>00</option>\n";
  minuteHtml += "<option value=\"05\">05</option>\n";
  minuteHtml += "<option value=\"10\">10</option>\n";
  minuteHtml += "<option value=\"15\">15</option>\n";
  minuteHtml += "<option value=\"20\">20</option>\n";
  minuteHtml += "<option value=\"25\">25</option>\n";
  minuteHtml += "<option value=\"30\">30</option>\n";
  minuteHtml += "<option value=\"35\">35</option>\n";
  minuteHtml += "<option value=\"40\">40</option>\n";
  minuteHtml += "<option value=\"45\">45</option>\n";
  minuteHtml += "<option value=\"50\">50</option>\n";
  minuteHtml += "<option value=\"55\">55</option>\n";
  minuteHtml += "</select>\n";

  html += hourHtml + ":" + minuteHtml + "\n";



  html += "</td></tr>\n";
  html += "<tr><td>\n";
  html += "Is Repeatable:\n";
  html += "</td><td>:</td><td>\n";

  isRepeatHtml += "<select name=\"isRepeat\">\n";
  isRepeatHtml += "<option value=\"Yes\">Yes</option>\n";
  isRepeatHtml += "<option value=\"No\" selected>No</option>\n";
  isRepeatHtml += "</select>\n";

  html += isRepeatHtml;

  html += "</td></tr>\n";
  html += "<tr>\n";
  html += "<td><input type=\"button\" value=\"cancel\" onclick=\"cancel(this.form)\"\></td>\n";
  html += "<td>&nbsp;</td>\n";
  html += "<td><input type=\"button\" value=\"add\" onclick=\"addTimer(this.form)\"\></td>\n";

  html += "</tr>\n";
  html += "</table>\n";
  html += "</center>\n";

  document.getElementById("addTimerArea").innerHTML = html;
}

function addTimer(form) {
  var frequency = form.frequency.value;
  var hour = form.hour.value;
  var minute  = form.minute.value;
  var isRepeat = form.isRepeat.value;

  addNewTimer(frequency, hour, minute, isRepeat);
}

function cancel(form) {
  location.href = referer;
}

function addNewTimer(frequency, hour, minute, isRepeat) {
  ajax_get(topUrl + '/roonAPI/addTimer?zoneId=' + zone.zone_id + "&frequency=" + frequency +
                    "&hour=" + hour + "&minute=" + minute +
                    "&isRepeat=" + isRepeat, function(data) {

    location.href = referer;
  });
}
