window.onload = function() {
	//Display both the progress and the description form
	
  	function checkLocation() {
		var ts = new Date().getTime();
    	$.get("/getLocation", { NoCache: ts}, function(data) {
    		$("#mp3_location").text(data);
		});
		setTimeout(checkLocation, 10000);
  	}
	checkLocation();
}