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
    let room = '';
    console.log('a user connected');
    console.log(Object.keys(socket.rooms))
    
    socket.on('join game', function() {
        if(Object.keys(socket.rooms).length <= 1) {
            if(activeRooms.length > 0) {
                //the first waiting room
                room = activeRooms.pop()
                let args = {room: room, message: "Player joined"}
                //join the first waiting room
                socket.join(room)
                //emit information to the client
                io.sockets.in(room).emit('status-message', args);
            } else {
                room = "room-" + roomCounter;
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
            console.log(socket.rooms)
        } else {
            let message = "You are already in another room"
            io.sockets.to(socket.id).emit('error', message)
        }
    });
    socket.on('player-ready', function() {
        // console.log(room)
        // console.log(socket.id)
        // console.log(socket.rooms)
        io.in(room).clients((error, clients) => {
            if (error) console.log(error);
            else {
                console.log("Clients")
                console.log(clients);
            }
          });
    });
    socket.on('chat message', function(msg){
        console.log('message: ' + msg);
        let socketRooms = Object.keys(socket.rooms)
        io.sockets.to(socket.rooms[socketRooms[1]]).emit('chat message', msg);
    });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
