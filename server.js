var http = require('http');
var url = require('url');
var path = require('path');
var fs = require('fs');
var utils = require('util');
var querystring = require('querystring');

//var serverAddress = "10.1.155.146";
//var serverPort = 8080;
var serverPort = process.env.PORT || 5000;

var usersIds = [ '22316098' ];
var usersTracks = {};

//====================================================================================
//
// Just a helper function to convert to radians
//
//====================================================================================
if (typeof(Number.prototype.toRad) === "undefined") {
  Number.prototype.toRad = function() {
    return this * Math.PI / 180;
  }
}
//====================================================================================
//
// Converts the tracks from this user into something that the browser will understand
// Basically comma separated format: `track1,lat1,lng1...trackn,latn,lngn`
//
//====================================================================================
function convertTracksToSend(user_id) {
	var tracksStrings = '';
	var tracks = usersTracks[user_id];
	for (var i=0; i<tracks.length; i++) {
		var track = tracks[i];
		console.log(track.tag_list);
		var str = track.id + ',' + track.lat + ',' + track.lng + ',';
		tracksStrings += str;
	}
	return tracksStrings;
}
//====================================================================================
//
// Converts the tracks from this user into something that the browser will understand
// Basically comma separated format: `track1,lat1,lng1...trackn,latn,lngn`
//
//====================================================================================
function getClosestTrackToMarker(user_id, lat, lng) {
	var tracks = usersTracks[user_id];
	if(tracks === undefined) {
		return {};
	}
	var shortestDistance = 1000000;
	var outputHash = {};
	for (var i=0; i<tracks.length; i++) {
		var track = tracks[i];
		var lat2 = parseFloat(lat);
		var lat1 = parseFloat(track.lat);
		var lon2 = parseFloat(lng);
		var lon1 = parseFloat(track.lng);
		
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
			outputHash['distance'] = d;
			outputHash['trackToSend'] = track.stream_url;
			outputHash['trackPermalink'] = track.permalink;
		}
	}

	outputHash.distance *= 1000.0;
	outputHash.trackToSend = outputHash.trackToSend + '?client_id=YOUR_CLIENT_ID';
	console.log(outputHash);
	return outputHash;
}
//====================================================================================
//
// Gets individual info from all the tracks from a user and stores them in the global hash
//
//====================================================================================
function getTracksInfo(user_id, data) {
	var userTracks = [];
	var tracksSoFar = 0;
	var nrTracks = data.length;
	for (var i=0; i<data.length; i++) {
		var track_path = '/tracks/' + data[i].id + '.json?client_id=YOUR_CLIENT_ID';
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
				tracksSoFar++;
				console.log("So far: " + tracksSoFar + "(" + nrTracks + ")" + " for user: " + user_id);
				//Convert the tags into something that is easy to parse
				geo_pos = data2.tag_list.split(' ');
				if(geo_pos[0].split('=')[0] == 'lat') {
					data2.lat = geo_pos[0].split('=')[1];
					data2.lng = geo_pos[1].split('=')[1];
				} else {
					data2.lng = geo_pos[0].split('=')[1];
					data2.lat = geo_pos[1].split('=')[1];
				}
				
				userTracks.push(data2);
				if(tracksSoFar == nrTracks) {
					console.log("Got all tracks for user: " + user_id);
					usersTracks[user_id] = userTracks;
				}
			})
		}).on('error', function(e) {
			console.log("Got error: " + e.message);
		});
	}
}

//====================================================================================
//
// Gets all the tracks related to a user
//
//====================================================================================
function getAllTracks(user_id) {
	//Let's send out plain text
	var options = {
	    host: 'api.soundcloud.com',
	    port: 80,
	    path: '/users/' + user_id + '/tracks.json?client_id=YOUR_CLIENT_ID'
    };

    //Let's fetch all the tracks from the user
	http.get(options, function(resp) {
		var b = new Buffer(0);
		resp.on('data', function(d) {
			b += d;
		});
		resp.on('end', function() {
			var str = b.toString();
			var data = JSON.parse(str);
			getTracksInfo(user_id, data);
		})
	}).on('error', function(e) {
		console.log("Got error: " + e.message);
		res.write(JSON.stringify({ error: e.message }));
		res.end();
	});
}
//==========================================================================
//Update all the tracks for all the registered users
function updateTracks() {
    for(var i=0; i<usersIds.length; i++) {
    	getAllTracks(usersIds[i]);
    }
    setTimeout(updateTracks, 10000);
}
updateTracks();
//==========================================================================
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
//==========================================================================
//==========================================================================
var serverHTTP = http.createServer(function (req, res) {

	req.parsedUrl = url.parse(req.url);
  	req.parsedUrl.parsedQuery = querystring.parse(req.parsedUrl.query || '');

  	console.log("Request for pathname: " + req.parsedUrl.pathname);

  	switch (req.parsedUrl.pathname) {
  		case '/getAllLocations':
  			res.writeHead(200, {'Content-Type': 'text/plain', 'Cache-Control': 'no-cache' });
  			var out = convertTracksToSend(usersIds[0]);
  			res.end(out);
	  		break;
		case '/getLocation':
			res.writeHead(200, {'Content-Type': 'text/plain', 'Cache-Control': 'no-cache' });
			var out = getClosestTrackToMarker(usersIds[0], req.parsedUrl.parsedQuery.lat, req.parsedUrl.parsedQuery.lng);
	  		console.log(out);
	  		res.end(JSON.stringify(out));
	  		break;
		default:
      		handleStaticFile(req, res);
  }
}).listen(serverPort);
