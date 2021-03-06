var http = require("http");
var fs = require('fs');
var path = require('path');
var url = require('url');
var io = require("socket.io");

var mimeTypes = {
    "html": "text/html",
    "jpeg": "image/jpeg",
    "jpg": "image/jpeg",
    "png": "image/png",
    "js": "text/javascript",
    "css": "text/css"
};

var webroot = "./www";

var server = http.createServer(function(req,res) {
	var fileToLoad;

	fileToLoad = webroot + url.parse(req.url).pathname;

	// check if we're a directory...
	stats = fs.lstatSync(fileToLoad);
	if(stats.isDirectory()) {
		fileToLoad = fileToLoad + "index.html";
	}

	var fileBytes;
	var httpStatusCode = 200;

	// check to make sure a file exists...
	fs.exists(fileToLoad,function(doesItExist) {

		// if it doesn't exist lets make sure we load error404.html
		if(!doesItExist) {
			httpStatusCode = 404;
			fileToLoad = webroot + "error404.html";
		}

		fileBytes = fs.readFileSync(fileToLoad);
		var mimeType = mimeTypes[path.extname(fileToLoad).split(".")[1]]; // complicated, eh?

		res.writeHead(httpStatusCode,{'Content-type':mimeType});
		res.end(fileBytes);
	});
})

server.listen(8080,'0.0.0.0');


var socketServer = io.listen(server);
socketServer.sockets.on('connection',function(socket) {


socket.on('change room',function(data) {
		if(data.oldRoom) {
			socket.leave(data.oldRoom);
			socket.broadcast.to(data.oldRoom).emit('user left',data.username);
		}
		console.log("[CHATROOM] :: Room " + data.newRoom + " :: " + data.username + " joined.");
		socket.join(data.newRoom);
		socket.broadcast.to(data.newRoom).emit('user joined',data.username);
	});


/*
	socket.on('user changed name',function(data) {
		console.log("[CHATROOM] :: Room " + data.room + " :: " + data.oldName + " is now " + data.newName);
		socket.broadcast.to(data.room).emit('user changed name',data.oldName,data.newName);
	});
*/

/* 	emitted by girl */
	socket.on('girlChat',function(data) {
		socket.broadcast.to(data.room).emit('girl chatted',data);
	});

/* 	emitted by boy	 */
	socket.on('boyChat',function(data) {
		socket.broadcast.to(data.room).emit('boy chatted',data);
	});
	
/* 	emitted by admin	 */
	socket.on('admin sends translation',function(data) {
		socket.broadcast.to(data.room).emit('admin translation to boy',data);
	});

/* 	emitted by admin	 */	
	socket.on('admin forwards',function(data) {
		socket.broadcast.to(data.room).emit('admin forwards to girl',data);//to the girl approved message
		socket.broadcast.to(data.room).emit('approved message',data);//to the boy his own approved message
		console.log(data.message);
	});

/* 	emitted by admin	 */
	socket.on('admin rejects',function(data) {
		socket.broadcast.to(data.room).emit('admin rejects to boy',data);
	});
	
	
	socket.on('admin present',function(data) {
		socket.broadcast.to(data.room).emit('admin here',data);
	});
	
	socket.on('boy present',function(data) {
		socket.broadcast.to(data.room).emit('boy here',data);
	});
	
	socket.on('girl present',function(data) {
		socket.broadcast.to(data.room).emit('girl here',data);
	});
	

/*
	socket.on('disconnect',function(data) {
		socket.broadcast.to(data.room).emit('user left',data.username);
	});
*/

});