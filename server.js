const http = require('http');
const fs = require('fs');
const path = require('path');
const mime = require('mime');
const  chatServer = require('./lib/chat_server');
var cache = {};

function send404 (res) {
	res.writeHead(404,{'ContentType':'text/plain'});
	res.write('Error 404. Not found');
	res.end();
}

function sendFile (res,filePath, fileContents) {
	res.writeHead(200,{'ContentType': mime.lookup(path.basename(filePath))});
	res.end(fileContents);
}

function serveStatic (res,cache,absPath) {
	if(cache[absPath]) {
		sendFile(res,absPath,cache[absPath]);
	} else {
		fs.exists(absPath, function (exists) {
			if (exists) {
				fs.readFile(absPath,function (err, data) {
					if(err) {
						send404(res);
					} else {
						cache[absPath] = data;
						sendFile(res,absPath,data);
					}
				})
			} else {
				send404(res);
			}
		});
	}
}

const server = http.createServer(function (req,res) {
	let filePath = false;

	if(req.url === '/') {
		filePath = 'public/index.html';
	} else {
		filePath = 'public' + req.url;
	}

	const absPath ='./' + filePath;

	serveStatic(res,cache,absPath);

});

chatServer.listen(server);


server.listen(3000, function () {
	console.log('Server listening in the ' + 3000 + ' port')
})