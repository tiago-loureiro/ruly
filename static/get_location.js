window.onload = function() {
	//Display both the progress and the description form
	
  	function get_the_coords(position) {

        var latitude = position.coords.latitude;
        var longitude = position.coords.longitude;

    	$.get("/getLocation", { lat:latitude, lng:longitude}, function(data) {
    		$("#mp3_location").text(data);alert(data);
		});
    }
    
    function get_location() {
        if (Modernizr.geolocation) {
            navigator.geolocation.getCurrentPosition(get_the_coords);
        } else {
            alert ("HTML5 Geolocation does not work here");
        }

        setTimeout(get_location, 10000);
    }
    
    get_location();
}
