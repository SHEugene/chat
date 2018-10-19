const socket_io = require('socket.io');
const BASE_USERNAME = 'Guest';
let io;
let guestNumber = 1;
let nickNames = {};
let namesUsed = [];
let currentRoom = {};

function assignGuestName(socket,guestNumber, nickNames, namesUsed)  {
	const name = BASE_USERNAME + guestNumber;
	nickNames[socket.id] = name;
	socket.emit('nameResult', {success: true, name: name});
	namesUsed.push(name);
	return guestNumber+1;
}

function joinRoom (socket, room) {
	socket.join(room);
	currentRoom[socket.id] = room;

	socket.emit('joinResult', {room:room});

	socket.broadcast.to(room).emit('message', {
		text: nickNames[socket.id] + ' has joined to ' + room + '.'
	});
}

function handleNameChange(socket,nickNames,namesUsed) {
	socket.on('nameAttempt', function (name) {
		if(name.indexOf(BASE_USERNAME) === 0) {
			socket.emit('nameResult', {success: false, message: 'Cannot set name with '+ BASE_USERNAME});
		} else {
			if(namesUsed.indexOf(name) === -1) {
				const  previousName = nickNames[socket.id];
				const previousNameIndex = namesUsed.indexOf(previousName);
				namesUsed.push(name);
				nickNames[socket.id] = name;

				delete namesUsed[previousNameIndex];

				socket.emit('nameResult', {success:true, name:name});

				socket.broadcast.to(currentRoom[socket.id]).emit('message',
					{
						text: 'User '+ previousName + ' changed name to ' + name + '.'
					});
			} else{
				socket.emit('nameResult', {success: false, message: 'this name already used'});
			}
		}
	})
}

function handleMessageBroadcasting(socket, nickNames) {
	socket.on('message', function (message) {
		socket.broadcast.to(message.room).emit('message', {
			text: nickNames[socket.id]+ ': '+ message.text
		});
	})
}

function handleRoomJoining(socket) {
	socket.on('join', function (room) {
		socket.leave(currentRoom[socket.id]);
		joinRoom(socket,room.newRoom);
	})
}

function handleClientDisconnection(socket, nickNames, namesUsed) {
	socket.on('disconnect', function () {
		const nameIndex = namesUsed.indexOf(nickNames[socket.id]);
		delete  namesUsed[nameIndex];
		delete nickNames[socket.id];
	})
}

exports.listen = function (server) {
	io = socket_io.listen(server);

	io.sockets.on('connection', function (socket) {
		guestNumber = assignGuestName(socket,guestNumber, nickNames, namesUsed);
		joinRoom(socket, 'Lobby');
		handleMessageBroadcasting(socket, nickNames);
		handleNameChange(socket,nickNames,namesUsed);
		handleRoomJoining(socket);


		socket.on('rooms', function () {
			socket.emit('rooms', io.sockets.manager.room);
		});
		handleClientDisconnection(socket, nickNames, namesUsed);
	});
};