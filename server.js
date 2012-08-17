var http = require('http');
var url = require('url');
var path = require('path');
var fs = require('fs');
var utils = require('util');
var querystring = require('querystring');

var serverAddress = "localhost";
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

function handleLocation(req, res) {
	res.writeHead(200, {'Content-Type': 'text/plain'});
 	//res.write("yeah are getting there");
 	var options = {
	    host: 'www.google.com',
	    port: 80,
	    path: '/'
    };

    http.get(options, function(resp) {
      console.log("Got response: " + resp.statusCode);
      res.end(""+resp.statusCode);
    }).on('error', function(e) {
      console.log("Got error: " + e.message);
    });
}


var serverHTTP = http.createServer(function (req, res) {

	req.parsedUrl = url.parse(req.url);
  	req.parsedUrl.parsedQuery = querystring.parse(req.parsedUrl.query || '');

  	console.log("Request for url: " + req.url);

  	switch (req.parsedUrl.pathname) {
		case '/getLocation':
	  		handleLocation(req, res);
	  		break;
		default:
      		handleStaticFile(req, res);
  }
}).listen(serverPort, serverAddress);


console.log('Server running..' + serverPort);