var express = require('express')
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);


app.use(express.static('public'));

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

let roomCounter = 1;
let activeRooms = [];

io.on('connection', function(socket){
    console.log('a user connected');
    socket.on('chat message', function(msg){
        console.log('message: ' + msg);
        io.emit('chat message', msg);
    });
    socket.on('join game', function(room) {
        if(activeRooms.length > 0) {
            //the first waiting room
            let joinRoom = activeRooms.pop()
            let args = {room: joinRoom, message: "Player joined"}
            //join the first waiting room
            socket.join(joinRoom)
            //emit information to the client
            io.sockets.in(joinRoom).emit('status-message', args);
        } else {
            let room = "room-" + roomCounter;
            let args = {room: room, message: 'Room created. Waiting for another player'}
            //join the game
            socket.join(room);
            //emit status
            io.sockets.in(room).emit('status-message', args);
            //add the game to the active games
            activeRooms.unshift(room);
            //increase the counter
            roomCounter++;
        }
        socket.join(room);
    });
  });

http.listen(3000, function(){
  console.log('listening on *:3000');
});
