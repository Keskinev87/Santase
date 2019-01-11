var express = require('express')
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);


app.use(express.static('public'))

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

let roomCounter = 1;
let waitingRooms = []; //the rooms with waiting players
let playingRooms = {}; //the rooms with coupled players, who are playing - HASHTABLE
let cards = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24]

io.on('connection', function(socket){

    console.log('a user connected');   
    
    socket.on('join game', function() {
         //if the player is not in another room
         if(Object.keys(socket.rooms).length <= 1){

            if(waitingRooms.length > 0) { //there are rooms with players waiting for another player to join

                let gameRoom = waitingRooms.pop();
                gameRoom.player2 = new Player(socket.id); //set the second player in the room
                playingRooms[gameRoom.number] = gameRoom //move the room from waiting to playing
                socket.join(gameRoom.number); //join the socket to the room's number
    
                gameRoom.sendJoinedRoomStatus(); //send the number of the room to the front-end
                gameRoom.sendStatusMsg('Player joined'); //let the players know, that the second player has joined
                gameRoom.sendStatusMsg('The game will begin in 5 seconds...'); //let the players know when the game will start
                
                setTimeout(function() {
                    gameRoom.startGame();
                }, 1000); //start the game
    
            } else {
    
                let room = new Room(roomCounter);
                socket.join(room.number); //join the game
                room.player1 = new Player(socket.id);
    
                room.sendJoinedRoomStatus();
                room.sendStatusMsg('Waiting for another player')
                waitingRooms.unshift(room);
                roomCounter++;
            }
        } else {
            console.log(socket.rooms)
            io.sockets.to(socket.id).emit('error', 'You already joined the room')
        }
        
       
    });

    socket.on('chat message', function(msg){
        room.sendChatMsg(msg);
    });

    socket.on('card played', function(data){
        playingRooms[data.room]
    })

    
    
});

class Room {
    
    constructor(number){
        this.number = number;
        this.player1;
        this.player2;
        this.nextMove;
    }

    startGame() {
        
        let nextPlayer = this.getRandBetween(1,2); //the player who will play first
        nextPlayer == 1 ? this.dealCards(this.player1, this.player2) : this.dealCards(this.player2, this.player1)
       

    }

    shuffleCards(){
        let newDeck = cards.slice()
        let playDeck = [];
        for (let i = 0; i < 24; i++) {
            let randCard = Math.floor(Math.random() * newDeck.length);
            playDeck[i] = newDeck[randCard];
            newDeck.splice(randCard, 1)
        }
        return playDeck
    }

    dealCards(player1, player2) {
        
        let playDeck = this.shuffleCards();
        for (let i = 0; i < 12; i++) {
            if(i % 2 == 1) {
                player1.cards.push(playDeck[i])
            } else {
                player2.cards.push(playDeck[i])
            }
        }
        console.log(player1);
        console.log(player2);
        io.sockets.to(player1.id).emit('deal cards', player1.cards);
        io.sockets.to(player2.id).emit('deal cards', player2.cards);
        this.sendPlay(player1);
        this.sendWait(player2);
        io.sockets.to(this.number).emit('deal trump card', playDeck[13]);

    }
        
    

    getRandBetween(min, max) {
        return Math.floor(Math.random() * max) + min
    }

    sendPlay(player) {
        //tells the front-end to play
        io.sockets.to(player.id).emit('play');
    }

    sendWait(player) {
        //tells the front-end to wait
        io.sockets.to(player.id).emit('wait');
    }

    sendChatMsg(msg) {
        io.sockets.to(this.number).emit('chat message', msg);
    }
    
    sendStatusMsg(msg) {
        io.sockets.to(this.number).emit('status message', msg);
    }

    sendJoinedRoomStatus() {
        io.sockets.to(this.number).emit('room joined', this.number)
    }
        
}

class Player {
    constructor(id, name){
        this.id = id;
        this.name = name;
        this.cards=[];
        this.points=0;
        this.overallPoints=0;
    }
}

http.listen(5000, function(){
  console.log('listening on *:5000');
});
