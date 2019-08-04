var topUrl = window.location.protocol + "//" + window.location.hostname + ":" + window.location.port;
var curZone = window.location.search.split('=')[1];

var referer = "player.html?zone_id=" + curZone;
var multiSessionKey = (+new Date).toString(36).slice(-5);
var zone;

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

function onload() {
  ajax_get(topUrl + '/roonAPI/getZone?zoneId=' + curZone, function(data) {
    zone = data;

    document.getElementById("back").innerHTML = "<a href=\"" + referer + "\">back</a>";
    document.getElementById("zone").innerHTML = zone.zone.display_name;
    goHome(multiSessionKey);
  });
}

function goHome(multiSessionKey) {
  clear_page();
  show_data(multiSessionKey);
}

function goUp(levelToGo, multiSessionKey) {
  ajax_get(topUrl + '/roonAPI/goUp?zoneId=' + curZone + '&multiSessionKey=' + multiSessionKey, function(data) {
    show_gallery(data, curZone, levelToGo, multiSessionKey);
  });
}

function show_data(multiSessionKey) {
  var searchText = "<input type=\"text\" class=\"search\" name=\"toSearch\" size=\"40\" autocomplete=\"off\">\n" +
      "<input type=\"hidden\" id=\"multiSessionKey\" name=\"multiSessionKey\" value=\"" + multiSessionKey + "\">\n";
  document.getElementById("searchText").innerHTML = searchText;
}

function showList(item_key, zone_id, levelToGo, multiSessionKey) {
  ajax_get(topUrl + '/roonAPI/listByItemKey?zoneId=' + zone_id + '&multiSessionKey=' + multiSessionKey + "&item_key=" + item_key + "&page=1&list_size=100", function(data) {
    show_gallery(data, zone_id, levelToGo, multiSessionKey);
  });
}

function search() {
  var toSearch = document.toSearch.toSearch.value;
  var multiSessionKey = document.toSearch.multiSessionKey.value;

  //go home first
  ajax_get(topUrl + '/roonAPI/goHome?zoneId=' + curZone + '&multiSessionKey=' + multiSessionKey + '&list_size=20', function(data) {
    var library_item_key = data.list[0].item_key;

    ajax_get(topUrl + '/roonAPI/listByItemKey?zoneId=' + curZone + '&multiSessionKey=' + multiSessionKey + "&item_key=" + library_item_key + "&page=1&list_size=20", function(data) {
      var search_item_key = data.list[0].item_key;

      ajax_get(topUrl + '/roonAPI/listSearch?zoneId=' + curZone + '&multiSessionKey=' + multiSessionKey + "&item_key=" + search_item_key + "&toSearch=" + toSearch + "&page=1&list_size=20", function(data) {
         show_gallery(data, curZone, 1, multiSessionKey);
      });
    });
  });
}

function playAlbum(item_key, zone_id, multiSessionKey) {
  ajax_get(topUrl + '/roonAPI/listByItemKey?zoneId=' + zone_id + '&multiSessionKey=' + multiSessionKey + "&item_key=" + item_key + "&page=1&list_size=100", function(data) {
    ajax_get(topUrl + '/roonAPI/listByItemKey?zoneId=' + zone_id + '&multiSessionKey=' + multiSessionKey + "&item_key=" + data.list[0].item_key + "&page=1&list_size=100", function(data2) {
      ajax_get(topUrl + '/roonAPI/listByItemKey?zoneId=' + zone_id + '&multiSessionKey=' + multiSessionKey + "&item_key=" + data2.list[0].item_key + "&page=1&list_size=100", function(data3) {
        window.location.href = referer;
      });
    });
  });
}
// Level Information
// 1: search
// 2: Artist
// 3: Album

function show_gallery( data, zone_id, level, multiSessionKey) {
  var html = "";

  document.getElementById("up").innerHTML = "";

  if ( (level == 2 || level == 4 ) && data.list.length > 0 ) {
    upHtml = "<a href=\'javascript:void(0);\' onclick=\"goUp(1, multiSessionKey);\">Search Result</a>";

    document.getElementById("up").innerHTML = upHtml;
  }

  if ( level == 3 && data.list.length > 0 ) {
    upHtml = "<a href=\'javascript:void(0);\' onclick=\"goUp(2, multiSessionKey);\">";
    upHtml += data.list[1].subtitle + "</a>";

    document.getElementById("up").innerHTML = upHtml;
  }

  if ( level == 4 ) {
//    level = 3;
  }

  for ( var i in data['list'] ) {

    if ( level == 1 ) {
      if (data.list[i].title == "Artists") {
        html += each_gallery( data.list[i], zone_id, 2, multiSessionKey );
      } else if ( data.list[i].title == "Albums" ) {
        html += each_gallery( data.list[i], zone_id, 4, multiSessionKey );
      } else if ( data.list[i].title == "Playlists" ) {
        html += each_gallery( data.list[i], zone_id, 2, multiSessionKey );
      }
    } else if ( level == 2 ) {
      html += each_gallery( data.list[i], zone_id, 3, multiSessionKey );
    } else if ( level == 3 && i > 0 ) {
      html += each_album( data.list[i], zone_id, 4, multiSessionKey );
    }
  }

  document.getElementById("gallery").innerHTML = html;
}

function each_gallery(data, zone_id, levelToGo, multiSessionKey) {
  html = "";

  html += "<div class=\"gallery\">\n";
  html += "<a href=\'javascript:void(0);\' onclick=\"showList(\'" + data.item_key +
          "\', \'" + zone_id + "\', \'" + levelToGo + "\', \'" + multiSessionKey + "\');\">";

  if ( data.image_key == null ) {
     html += "<img src=\'img/black.png\'/>\n";
  } else {
     html += "<img src=\'" + topUrl + "/roonAPI/getIcon?image_key=" + data.image_key + "\'/>\n";
  }

  html += "</a>\n";
  html += "<div class=\"desc\">" + data.title  + "<br>" + data.subtitle + "</div>\n";
  html += "</div>\n";

  return html;
}

function each_album(data, zone_id, level, multiSessionKey) {
  html = "";

  html += "<div class=\"gallery\">\n";
  html += "<a href=\'javascript:void(0);\' onclick=\"playAlbum(\'" + data.item_key +
          "\', \'" + zone_id + "\', \'" + multiSessionKey + "\');\">";

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
