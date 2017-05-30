var topUrl = window.location.protocol + "//" + window.location.hostname + ":" + window.location.port;
var curZone = window.location.search.split('=')[1];
var referer = "player.html?zone_id=" + curZone;

var socket = io();
var zone;

socket.on('initialzones', function(msg){
  zone = msg[curZone];

  document.getElementById("back").innerHTML = "<a href=\"" + referer + "\">back</a>";
  document.getElementById("zone").innerHTML = zone.display_name;
  goHome();
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

function goHome() {
  clear_page();
  show_data();
}

function goUp(levelToGo) {
  ajax_get(topUrl + '/roonAPI/goUp?zoneId=' + curZone, function(data) {
    show_gallery(data, curZone, levelToGo);
  });
}

function show_data() {
  var searchText = "<input type=\"text\" class=\"search\" name=\"toSearch\" size=\"40\" autocomplete=\"off\">";
  document.getElementById("searchText").innerHTML = searchText;
}

function showList(item_key, zone_id, levelToGo) {
  ajax_get(topUrl + '/roonAPI/listByItemKey?zoneId=' + zone_id + "&item_key=" + item_key + "&page=1&list_size=100", function(data) {
    show_gallery(data, zone_id, levelToGo);
  });
}

function search() {
  var toSearch = document.toSearch.toSearch.value;

  //go home first
  ajax_get(topUrl + '/roonAPI/goHome?zoneId=' + curZone + '&list_size=20', function(data) {
    var library_item_key = data.list[0].item_key;

    ajax_get(topUrl + '/roonAPI/listByItemKey?zoneId=' + curZone + "&item_key=" + library_item_key + "&page=1&list_size=20", function(data) {
      var search_item_key = data.list[0].item_key;

      ajax_get(topUrl + '/roonAPI/listSearch?zoneId=' + curZone + "&item_key=" + search_item_key + "&toSearch=" + toSearch + "&page=1&list_size=20", function(data) {
         show_gallery(data, curZone, 1);
      });
    });
  });
}

function playAlbum(item_key, zone_id) {
  ajax_get(topUrl + '/roonAPI/listByItemKey?zoneId=' + zone_id + "&item_key=" + item_key + "&page=1&list_size=100", function(data) {
    ajax_get(topUrl + '/roonAPI/listByItemKey?zoneId=' + zone_id + "&item_key=" + data.list[0].item_key + "&page=1&list_size=100", function(data2) {
      ajax_get(topUrl + '/roonAPI/listByItemKey?zoneId=' + zone_id + "&item_key=" + data2.list[0].item_key + "&page=1&list_size=100", function(data3) {
        window.location.href = referer;
      });
    });
  });
}
// Level Information
// 1: search
// 2: Artist
// 3: Album

function show_gallery( data, zone_id, level) {
  var html = "";

  document.getElementById("up").innerHTML = "";

  if ( (level == 2 || level == 4 ) && data.list.length > 0 ) {
    upHtml = "<a href=\'javascript:void(0);\' onclick=\"goUp(1);\">Search Result</a>";

    document.getElementById("up").innerHTML = upHtml;
  }

  if ( level == 3 && data.list.length > 0 ) {
    upHtml = "<a href=\'javascript:void(0);\' onclick=\"goUp(2);\">";
    upHtml += data.list[1].subtitle + "</a>";

    document.getElementById("up").innerHTML = upHtml;
  }

  if ( level == 4 ) {
    level = 3;
  }

  for ( var i in data['list'] ) {
    if ( level == 1 && data.list[i].title == "Artists") {
      html += each_gallery( data.list[i], zone_id, 2, null );
    } else if ( level == 1 && data.list[i].title == "Albums" ) {
      html += each_gallery( data.list[i], zone_id, 4, null );
    } else if ( level == 2 ) {
      html += each_gallery( data.list[i], zone_id, 3, null );
    } else if ( level == 3 && i > 0 ) {
      html += each_album( data.list[i], zone_id, 4, null );
    }
  }

  document.getElementById("gallery").innerHTML = html;
}

function each_gallery(data, zone_id, levelToGo) {
  html = "";

  html += "<div class=\"gallery\">\n";
  html += "<a href=\'javascript:void(0);\' onclick=\"showList(\'" + data.item_key +
          "\', \'" + zone_id + "\', " + levelToGo + ");\">";

  if ( data.image_key == null ) {
     html += "<img src=\'img/black.png\'/>\n";
  } else {
     html += "<img src=\'" + topUrl + "/roonAPI/getIcon?image_key=" + data.image_key + "\'/>\n";
  }

  html += "</a>\n";
  html += "<div class=\"desc\">" + data.title  + "</div>\n";
  html += "</div>\n";

  return html;
}

function each_album(data, zone_id) {
  html = "";

  html += "<div class=\"gallery\">\n";
  html += "<a href=\'javascript:void(0);\' onclick=\"playAlbum(\'" + data.item_key +
          "\', \'" + zone_id + "\');\">";

  html += "<div class=\"gallery_image\">";

  if ( data.image_key == null ) {
     html += "<img class=\"original\" src=\'img/black.png\'/>\n";
  } else {
     html += "<img class=\"original\" src=\'" + topUrl + "/roonAPI/getIcon?image_key=" + data.image_key + "\'/>\n";
  }

  html += "<img class=\"hover\" src=\"img/play.png\"/>\n";
  html += "</div>\n";

  html += "</a>\n";
  html += "<div class=\"desc\">" + data.title  + "</div>\n";
  html += "</div>\n";

  return html;
}

function clear_page() {
  document.getElementById("up").innerHTML = "";
  document.getElementById("gallery").innerHTML = "";
}
