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
	var lastOpenWindow;
	
	function add_marker (track_no, lat, lng){

        console.log("Adding marker, lat=" + lat + " lng=" + lng);
        if(track_no === undefined || lat === undefined || lng === undefined) {
            return;
        }
        // add marker
        var marker1 = new google.maps.Marker({
            position: new google.maps.LatLng (lat, lng),
            map: map
            });

		// Create information window
		function createInfo (title, content){
			return '<div class="infowindow"> <strong>' + title + '<strong>' + content + '</div>';
		}

		// Add information window
		var infowindow1 = new google.maps.InfoWindow({
			content: createInfo('R U Lost Yet?', 
			'<iframe width="100%" height="166" scrolling="no" frameborder="no" src="http://w.soundcloud.com/player/?url=http%3A%2F%2Fapi.soundcloud.com%2Ftracks%2F'+track_no+'&show_artwork=true"></iframe>')
		});

		// Add a listener for a click on the pin
		google.maps.event.addListener(marker1, 'click', function(){
			
			// close any open child window, before opening new one
			if (lastOpenWindow) {
				lastOpenWindow.close();
			}
			
			infowindow1.open(map, marker1);
			lastOpenWindow = infowindow1;
		});		
		
	}
	
	function render_map(lat, lng) {

        var image = new google.maps.MarkerImage('images/marker.png',
                new google.maps.Size(129, 42),
                new google.maps.Point(0,0),
                new google.maps.Point(18, 42)
                );

		add_marker( 2222, lat, lng);
		map.setCenter(new google.maps.LatLng(lat, lng));
	}
	
	function render_init_map(position) {
		// get a location
	    var latitude = position.coords.latitude;
	    var longitude = position.coords.longitude;
		
		//render map now
		render_map(latitude, longitude); 
	}
	
  	function get_the_curr_coords(position) {
        
		// get a location
        var latitude = position.coords.latitude;
        var longitude = position.coords.longitude;

		// pass location on to the server, to fetch the mp3
    	$.get("/getLocation", { lat:latitude, lng:longitude}, function(data) {
            $("#mp3_location").text(data);
            $("#audio_speech").attr("src",data);
		});
		
		// show the location on a map. 
		render_map(latitude, longitude);
    }



    function get_location() {
		 if (navigator.geolocation) {
	            navigator.geolocation.getCurrentPosition(get_the_curr_coords);
	        } else {
	            alert("HTML5 Geolocation does not work here");
	        }       

        setTimeout(get_location, 60000);
    }

	function place_all_markers(data){
		var array = data.split(',');
		// track1, lat1, lng1, track2, lat2, lng2...
        var markers = 0;
        for (var i=0; i < array.length;){
            console.log("Placing marker nr: " + (++markers));
			add_marker(array[i++], array[i++], array[i++]);
		}
	}

	function get_all_locations(){
		$.get("/getAllLocations", {}, function(data) {
            console.log(data);
			//create the map and center around curr location
			if (navigator.geolocation) {
		            navigator.geolocation.getCurrentPosition(render_init_map);
					place_all_markers(data);
		        } else {
		            alert("HTML5 Geolocation does not work here");
		        }	
			
		})
		
	}

	get_all_locations();
    get_location();
}
