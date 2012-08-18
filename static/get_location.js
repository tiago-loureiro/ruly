window.onload = function() {
	//Display both the progress and the description form
	// GLOBALS
    var mapOptions = {
      center: new google.maps.LatLng(52.52, 13.41),
      zoom: 16,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    var map = new google.maps.Map(document.getElementById("map_canvas"),
        mapOptions);
    var windowOfMovingMarker;
	var lastOpenWindow;
	var currMarker;
    var distanceForcurrMarker = 0;
    var textForcurrMarker = '';
	var prevLat=0, prevLng=0;
	
	function add_marker (track_no, lat, lng, movingMarker, distanceToClosestMarker, someTextToDisplay){

        console.log("Adding marker, lat=" + lat + " lng=" + lng + " trackno=" + track_no);
        if(track_no === undefined || lat === undefined || lng === undefined) {
            return;
        }

        // Create an info window
        var infowindow1 = new google.maps.InfoWindow({
            content: createInfo('R U Lost Yet?', 
            '<iframe width="100%" height="166" scrolling="no" frameborder="no" src="http://w.soundcloud.com/player/?url=http%3A%2F%2Fapi.soundcloud.com%2Ftracks%2F'+track_no+'&show_artwork=true"></iframe>')
        });
        

        // add marker
		if (movingMarker != true) {
            var marker1 = new google.maps.Marker({
                position: new google.maps.LatLng (lat, lng),
                map: map
                });
		} else {
            // if current position marker, then you have to move the one you placed originally		
			if (!currMarker) {
				var pinColor = "005509";
			    var pinImage = new google.maps.MarkerImage("http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|" + pinColor,
			        new google.maps.Size(21, 34),
			        new google.maps.Point(0,0),
			        new google.maps.Point(10, 34));
			
	        	var marker1 = new google.maps.Marker({
	            	position: new google.maps.LatLng (lat, lng),
	            	map: map,
					draggable:true,
                    icon: pinImage
	            	});

                windowOfMovingMarker = infowindow1;
				currMarker = marker1;
			} else {
				currMarker.setPosition(new google.maps.LatLng(lat, lng));
			}
		}

		// Create information window
		function createInfo (title, content){
			return '<div class="infowindow"> <strong>' + title + '<strong>' + content + '</div>';
		}

        if(!marker1) {
            return;
        }

		// Add a listener for a click on the pin
		google.maps.event.addListener(marker1, 'click', function(){
			
			// close any open child window, before opening new one
			if (lastOpenWindow) {
				lastOpenWindow.close();
			}
			// stop the autoplay, if it is running
			var els = document.querySelectorAll('audio');
			if (els) {
				//els[0].removeAttribute('autoplay');
			}
            if (movingMarker) {
                windowOfMovingMarker.setContent('<html>' + new Date() + ': Hello there, you are currently ' + distanceForcurrMarker + ' meteres away from the nearest marker: ' + textForcurrMarker + '</html>');
            }
            
			infowindow1.open(map, marker1);
			lastOpenWindow = infowindow1;
		});
	}
	
	function render_map(lat, lng, distanceToClosestMarker, textToDisplay) {

        var image = new google.maps.MarkerImage('images/marker.png',
                new google.maps.Size(129, 42),
                new google.maps.Point(0,0),
                new google.maps.Point(18, 42)
                );

		add_marker( 36434534, lat, lng, true, distanceToClosestMarker, textToDisplay);
		
		if (prevLat != lat || prevLng != lng) {
			lat = lat.toFixed(3);
			lng = lng.toFixed(3);
		
			map.setCenter(new google.maps.LatLng(lat, lng));
			prevLat = lat; 
			prevLng = lng;

		}
		
	}
	
	function render_init_map(position) {
		// get a location
	    var latitude = position.coords.latitude;
	    var longitude = position.coords.longitude;
		
		//render map now
		render_map(latitude, longitude, 0, ''); 
	}
	
  	function get_the_curr_coords(position) {
		// get a location
        var latitude = position.coords.latitude;
        var longitude = position.coords.longitude;
        var distance;
        
		// pass location on to the server, to fetch the mp3
    	$.get("/getLocation", { lat:latitude, lng:longitude}, function(data) {
            console.log(data);
            var json_obj = JSON.parse(data);
            distance = Math.round(json_obj.distance);
            distanceForcurrMarker = distance;
            textForcurrMarker = new String(json_obj.trackPermalink);
            $("#audio_speech").attr("src",json_obj.trackToSend);
            $("#feedback").text("Distance to closest marker: " + Math.round(json_obj.distance) + "meters with id: " + json_obj.trackPermalink);
            // show the location on a map.
            windowOfMovingMarker.setContent('<html>' + new Date() + ': Hello there, you are currently ' + distanceForcurrMarker + ' meteres away from the nearest marker: ' + textForcurrMarker + '</html>');
		});
        render_map(latitude, longitude, distance, textForcurrMarker);
    }



    function get_location() {
        if (navigator.geolocation) {
               navigator.geolocation.getCurrentPosition(get_the_curr_coords, errorCoor, {maximumAge:60000, timeout:5000, enableHighAccuracy:true});
           } else {
               alert("HTML5 Geolocation does not work here");
           }          

       setTimeout(get_location, 10000);
    }

	function place_all_markers(data){
		var array = data.split(',');
		// track1, lat1, lng1, track2, lat2, lng2...
        var markers = 0;
        for (var i=0; i < array.length;){
            console.log("Placing marker nr: " + (++markers));
			add_marker(array[i++], array[i++], array[i++], false, 0, '');
		}
	}

    function errorCoor() {
        console.log('Could not get your location :(');
    }

	function get_all_locations(){
        $.get("/getAllLocations", {}, function(data) {
			//create the map and center around curr location
			if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(render_init_map, errorCoor, {maximumAge:60000, timeout:5000, enableHighAccuracy:true});
		            place_all_markers(data);
		        } else {
		            alert("HTML5 Geolocation does not work here");
		        }	
			
		})
		
	}

	get_all_locations();
    get_location();
}
