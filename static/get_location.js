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
	var gLastOpenWindow;
	var gOurMarker;
	var gMarkerDragged = false;
	var gOurLat = 0, gOurLng = 0;
	var gPrevLat=0, gPrevLng=0;
	
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
			if (!gOurMarker) {
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
				gOurMarker = marker1;
					
				//track the draggable marker. each new location can be sent back to the server
				// and once you drag the current location marker, geolocation lookups stop. 
				google.maps.event.addListener(gOurMarker, "dragend", function(event) {
					gMarkerDragged = true;
					gOurLat = event.latLng.lat();
					gOurLng = event.latLng.lng();	
					alert("gMarkerDragged set to true. lat= "+ gOurLat + " lng=" + gOurLng);	
				});
			} else {
				gOurMarker.setPosition(new google.maps.LatLng(lat, lng));
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
			if (gLastOpenWindow) {
				gLastOpenWindow.close();
			}
			// stop the autoplay, if it is running
			var els = document.querySelectorAll('audio');
			if (els) {
				//els[0].removeAttribute('autoplay');
			}
            if (movingMarker) {
                var d = new Date();
                windowOfMovingMarker.setContent('<html>' + d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds() + ': Hello there, you are currently ' + distanceForcurrMarker + ' meteres away <br> from the nearest marker: ' + textForcurrMarker + '</html>');
            }
            
			infowindow1.open(map, marker1);
			gLastOpenWindow = infowindow1;
		});		
	}
	
	function render_map(lat, lng, distanceToClosestMarker, textToDisplay) {

        var image = new google.maps.MarkerImage('images/marker.png',
                new google.maps.Size(129, 42),
                new google.maps.Point(0,0),
                new google.maps.Point(18, 42)
                );

		add_marker( 36434534, lat, lng, true, distanceToClosestMarker, textToDisplay);
		
		if (gPrevLat != lat || gPrevLng != lng) {
			lat = lat.toFixed(3);
			lng = lng.toFixed(3);
		
			map.setCenter(new google.maps.LatLng(lat, lng));
			gPrevLat = lat; 
			gPrevLng = lng;

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
        var distance;
        if(position === undefined) {
			alert("position is undefined");
            return;
        }
		// get the lat and lng
		var latitude = 0, longitude = 0;
		if (position.coords){
			latitude = position.coords.latitude;
        	longitude = position.coords.longitude;
		} else {
			latitude = position.lat();
			longitude = position.lng();
		}
		
		if (latitude == 0 || longitude == 0) {
			alert("postion read failed");
			return;
		}
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
            var d = new Date();
            windowOfMovingMarker.setContent('<html>' + d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds() + ': Hello there, you are currently ' + distanceForcurrMarker + ' meteres away <br> from the nearest marker: ' + textForcurrMarker + '</html>');
		});

        render_map(latitude, longitude, distance, textForcurrMarker);
		// show the location on a map. 
		//render_map(latitude, longitude);
    }



    function get_location() {
		 if(gMarkerDragged == false) {
		 	if (navigator.geolocation) {
	            	navigator.geolocation.getCurrentPosition(get_the_curr_coords, errorCoor, {maximumAge:60000, timeout:5000, enableHighAccuracy:true});
	        	} else {
	            	alert("HTML5 Geolocation does not work here");
	        	}
			} else { // if gOurMarker was moved. 
				var dragend_point = new google.maps.LatLng(gOurLat, gOurLng);
				get_the_curr_coords(dragend_point); 
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

    // var canvas = document.getElementById("map_canvas");
    // if (canvas.getContext) {
    //     var ctx = canvas.getContext("2d");
    //     ctx.strokeStyle = "red";
    //     ctx.fillStyle = "red";
        
    //     ctx.fillRect(150,0,200,50);
    //     alert(width);alert(height);
    //     // Draw a square using the rect() method
    //     ctx.stroke();
    // }
}
