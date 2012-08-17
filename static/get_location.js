window.onload = function() {
	//Display both the progress and the description form
	
	function show_loc_on_map(lat, lng) {
        var mapOptions = {
          center: new google.maps.LatLng(lat, lng),
          zoom: 16,
          mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        var map = new google.maps.Map(document.getElementById("map_canvas"),
            mapOptions);

        var image = new google.maps.MarkerImage('images/marker.png',
                new google.maps.Size(129, 42),
                new google.maps.Point(0,0),
                new google.maps.Point(18, 42)
                );

        // add marker

        var marker1 = new google.maps.Marker({
            position: new google.maps.LatLng (lat, lng),
            map: map
            });

	   // var marker2 = new google.maps.Marker({
	   //     position: new google.maps.LatLng (52.00, 14.00),
	   //     map: map
	   //     });

		// Create information window
		function createInfo (title, content){
			return '<div class="infowindow"> <strong>' + title + '<strong>' + content + '</div>';
		}

		// Add information window
		var infowindow1 = new google.maps.InfoWindow({
			content: createInfo('R U Lost Yet?', 'abc')
		});
		
		// Add a listener for a click on the pin
		google.maps.event.addListener(marker1, 'click', function(){
			infowindow1.open(map, marker1);
		});
		
	}
	
	
  	function get_the_coords(position) {
        
		// get a location
        var latitude = position.coords.latitude;
        var longitude = position.coords.longitude;

		// pass location on to the server, to fetch the mp3
    	$.get("/getLocation", { lat:latitude, lng:longitude}, function(data) {
            $("#mp3_location").text(data);
            $("#audio_speech").attr("src",data);
		});
		
		// show the location on a map. 
		show_loc_on_map(latitude, longitude);
    }
    
    function get_location() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(get_the_coords);
        } else {
            alert("HTML5 Geolocation does not work here");
        }
        setTimeout(get_location, 10000);
    }

    get_location();
}
