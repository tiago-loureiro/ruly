var http = require('http');
var url = require('url');
var path = require('path');
var fs = require('fs');
var utils = require('util');
var querystring = require('querystring');

var serverAddress = "10.1.155.146";
var serverPort = 8080;


/*
 * Handler for server static files
 *
 */
function handleStaticFile(req, res) {
	var filePath = '.' + req.url;
  	if (filePath == './') {
    	filePath = './static/index.html';
  	}
	path.exists(filePath, function(fileExists) {
    	if (fileExists) {
    		fs.readFile(filePath, function(error, content) {
    			if (error) {
        			res.writeHead(500);
          			res.end();
        		} else {
          			var contentType = 'text/html';
          			if (filePath.substr(-3) == '.js')
            			contentType = 'application/javascript';
          			var encoding = 'utf-8';
          			res.writeHead(200, {'Content-Type': contentType});
          			console.log('sending reply');
          			res.end(content, encoding);
       			}
      		});
    	} else {
    		console.log("Requested page not found: " + filePath	);
			res.writeHead(404);
			res.end()
    	}
	})
}
//==========================================================================
//Expects an array of JSON objects
function getUrlForTrackGivenGPS(data, response, user_lat, user_lng) {
	var found = false;
	var allTracks = '';
	var allTracks = '';
	var tracksSoFar = 0;
	var nrTracks = data.length;
	var shortestDistance = 1000000;
	var trackToSend = '';
	for (var i=0; i<data.length; i++) {
		console.log(data[i].id);
		console.log(data[i].uri);
		var track_path = '/tracks/' + data[i].id + '.json?client_id=YOUR_CLIENT_ID';
		console.log(track_path);
		var options2 = {
		    host: 'api.soundcloud.com',
		    port: 80,
		    path: track_path
    	};

	    //Let's fetch all the tracks from the user
		http.get(options2, function(resp2) {
			var b2 = new Buffer(0);
			resp2.on('data', function(d2) {
				b2 += d2;
			});
			resp2.on('end', function() {
				var str2 = b2.toString();
				var data2 = JSON.parse(str2);
				console.log(data2.stream_url);
				console.log(data2.tag_list);
				tracksSoFar++;
				console.log("so far single : " + tracksSoFar + " total single: " + nrTracks);
				var vals = data2.tag_list.split(' ');
				console.log(vals);
				var lat = 0.0;
				var lng = 0.0;
				if(vals[0].split('=')[0] == 'lat') {
					lat = vals[0].split('=')[1];
					lng = vals[1].split('=')[1];
				} else {
					lng = vals[0].split('=')[1];
					lat = vals[1].split('=')[1];
				}
				console.log(user_lat);
				console.log(user_lng);
				console.log(lat);
				console.log(lng);
				lat1 = parseFloat(user_lat);
				lon1 = parseFloat(user_lng);
				lat2 = parseFloat(lat);
				lon2 = parseFloat(lng);

								/** Converts numeric degrees to radians */
				if (typeof(Number.prototype.toRad) === "undefined") {
				  Number.prototype.toRad = function() {
				    return this * Math.PI / 180;
				  }
				}

				var R = 6371; // km
				var dLat = (lat2-lat1).toRad();
				var dLon = (lon2-lon1).toRad();
				var lat1 = lat1.toRad();
				var lat2 = lat2.toRad();

				var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
				        Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2); 
				var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
				var d = R * c;
				if (d < shortestDistance) {
					shortestDistance = d;
					trackToSend = data2.stream_url;
					trackPermalink = data2.permalink;
				}
				console.log("Distance is: " + d + " km");
				if(tracksSoFar == nrTracks) {
					shortestDistance *= 1000.0;
					var objToJson = { distance: shortestDistance, track: trackToSend + '?client_id=YOUR_CLIENT_ID', permalink: trackPermalink };
					response.end(JSON.stringify(objToJson));
				}
				
				
			})
		}).on('error', function(e) {
			console.log("Got error: " + e.message);
		});
		console.log("i am here now");
	}
	console.log("out");
}

function handleLocation(req, res, user_lat, user_lng) {
	//Let's send out plain text
	console.log(user_lat);
	console.log(user_lng);
	res.writeHead(200, {'Content-Type': 'text/plain', 'Cache-Control': 'no-cache' });
	var options = {
	    host: 'api.soundcloud.com',
	    port: 80,
	    path: '/users/22316098/tracks.json?client_id=YOUR_CLIENT_ID'
    };

    console.log("Making request to: " + options)

    //Let's fetch all the tracks from the user
	http.get(options, function(resp) {
		console.log("Got response: " + resp.statusCode);
		var b = new Buffer(0);
		resp.on('data', function(d) {
			b += d;
		});
		resp.on('end', function() {
			var str = b.toString();
			var data = JSON.parse(str);
			console.log(user_lat);
			console.log(user_lng);
			getUrlForTrackGivenGPS(data, res, user_lat, user_lng);
			console.log("Ending!");
		})
	}).on('error', function(e) {
		console.log("Got error: " + e.message);
		res.write(JSON.stringify({ error: e.message }));
		res.end();
	});
}
//==========================================================================
//==========================================================================
//Expects an array of JSON objects
function getAllUrlForTrackGivenGPS(data, response) {
	var found = false;
	var allTracks = '';
	var tracksSoFar = 0;
	var nrTracks = data.length;
	for (var i=0; i<data.length; i++) {
		console.log(data[i].id);
		console.log(data[i].uri);
		var track_path = '/tracks/' + data[i].id + '.json?client_id=YOUR_CLIENT_ID';
		console.log(track_path);
		var options2 = {
		    host: 'api.soundcloud.com',
		    port: 80,
		    path: track_path
    	};

	    //Let's fetch all the tracks from the user
		http.get(options2, function(resp2) {
			var b2 = new Buffer(0);
			resp2.on('data', function(d2) {
				b2 += d2;
			});
			resp2.on('end', function() {
				var str2 = b2.toString();
				var data2 = JSON.parse(str2);
				//console.log(data2.stream_url);
				console.log(data2.tag_list);

				var vals = data2.tag_list.split(' ');
				var lat = 0.0;
				var lng = 0.0;
				if(vals[0].split('=')[0] == 'lat') {
					lat = vals[0].split('=')[1];
					lng = vals[1].split('=')[1];
				} else {
					lng = vals[0].split('=')[1];
					lat = vals[1].split('=')[1];
				}
				console.log(data2.tag_list + " | lat=" + lat + " lng=" + lng);

				tracksSoFar++;
				var cur = data2.id + ',' + lat + ',' + lng + ',';
				allTracks += cur;
				console.log("so far: " + tracksSoFar + " total: " + nrTracks);
				if(tracksSoFar == nrTracks) {
					console.log("Sending back: " + allTracks);
					response.end(allTracks);
				}
			})
		}).on('error', function(e) {
			console.log("Got error: " + e.message);
		});
		console.log("i am here now");
	}
	console.log("out");
}

function handleAllLocations(req, res) {
	//Let's send out plain text
	res.writeHead(200, {'Content-Type': 'text/plain', 'Cache-Control': 'no-cache' });
	var options = {
	    host: 'api.soundcloud.com',
	    port: 80,
	    path: '/users/22316098/tracks.json?client_id=YOUR_CLIENT_ID'
    };

    console.log("Making request to: " + options)

    //Let's fetch all the tracks from the user
	http.get(options, function(resp) {
		console.log("Got response: " + resp.statusCode);
		var b = new Buffer(0);
		resp.on('data', function(d) {
			b += d;
		});
		resp.on('end', function() {
			var str = b.toString();
			var data = JSON.parse(str);
			getAllUrlForTrackGivenGPS(data, res);
			console.log("Ending!");
		})
	}).on('error', function(e) {
		console.log("Got error: " + e.message);
		res.write(JSON.stringify({ error: e.message }));
		res.end();
	});
}
//==========================================================================


var serverHTTP = http.createServer(function (req, res) {

	req.parsedUrl = url.parse(req.url);
  	req.parsedUrl.parsedQuery = querystring.parse(req.parsedUrl.query || '');

  	console.log("Request for pathname: " + req.parsedUrl.pathname);

  	switch (req.parsedUrl.pathname) {
  		case '/getAllLocations':
  			handleAllLocations(req, res);
	  		break;
		case '/getLocation':
			var query = req.parsedUrl;
			console.log(query);
			handleLocation(req, res, query.parsedQuery.lat, query.parsedQuery.lng);
	  		break;
		default:
      		handleStaticFile(req, res);
  }
}).listen(serverPort, serverAddress);


console.log('Server running..' + serverPort);