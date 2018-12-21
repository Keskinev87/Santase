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
let cards = [
{number: 9, suit: "clubs", name: "Nine"},
{number: 10, suit: "clubs", name: "Jack"},
{number: 11, suit: "clubs", name: "Queen"},
{number: 12, suit: "clubs", name: "King"},
{number: 13, suit: "clubs", name: "Ten"},
{number: 14, suit: "clubs", name: "Ace"},
{number: 9, suit: "diamonds", name: "Nine"},
{number: 10, suit: "diamonds", name: "Jack"},
{number: 11, suit: "diamonds", name: "Queen"},
{number: 12, suit: "diamonds", name: "King"},
{number: 13, suit: "diamonds", name: "Ten"},
{number: 14, suit: "diamonds", name: "Ace"},
{number: 9, suit: "hearts", name: "Nine"},
{number: 10, suit: "hearts", name: "Jack"},
{number: 11, suit: "hearts", name: "Queen"},
{number: 12, suit: "hearts", name: "King"},
{number: 13, suit: "hearts", name: "Ten"},
{number: 14, suit: "hearts", name: "Ace"},
{number: 9, suit: "spades", name: "Nine"},
{number: 10, suit: "spades", name: "Jack"},
{number: 11, suit: "spades", name: "Queen"},
{number: 12, suit: "spades", name: "King"},
{number: 13, suit: "spades", name: "Ten"},
{number: 14, suit: "spades", name: "Ace"}
]

io.on('connection', function(socket){
    let room = '';
    let player1 = {
        id: '',
        cards: [],
        points: 0,
        overallPoints: 0
    };
    let player2 = {
        id: '',
        cards: [],
        points: 0,
        overallPoints: 0
    };
    console.log('a user connected');
    
    socket.on('join game', function() {
        if(Object.keys(socket.rooms).length <= 1) {
            if(activeRooms.length > 0) {
                //the first waiting room
                room = activeRooms.pop()
                //join the first waiting room
                socket.join(room)
                //emit information to the client
                player2.id = socket.id;
                io.sockets.in(room).emit('chat message', 'Player joined');
                    io.in(room).clients((error, clients) => {
                            if (error) {
                                io.sockets.to(socket.id).emit('error', 'Player 1 left...')
                            } else {
                                player1.id = clients[0];
                            }
                          });
                io.sockets.in(room).emit('chat message', 'The game will begin in 5 seconds...');
                setTimeout(dealCards, 5000);
                io.sockets.in(room).emit('status-message', 'starting');
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
            console.log("Rooms")
            console.log(socket.rooms)
        } else {
            let message = "You are already in another room"
            io.sockets.to(socket.id).emit('error', message)
        }
    });

    function shuffleCards() {
        let newDeck = cards.slice()
        let playDeck = [];
        for (let i = 0; i < 24; i++) {
            let randCard = Math.floor(Math.random() * newDeck.length);
            playDeck[i] = newDeck[randCard];
            newDeck.splice(randCard, 1)
        }
        return playDeck
    }

    function dealCards() {
        let playDeck = shuffleCards();
        for (let i = 0; i < 12; i++) {
            if(i % 2 == 1) {
                player1.cards.push(playDeck[i])
            } else {
                player2.cards.push(playDeck[i])
            }
        }
        console.log(player1)
        console.log(player2)
        io.sockets.to(player1.id).emit('dealt cards', player1.cards)
        io.sockets.to(player2.id).emit('dealt cards', player2.cards)
    }
    //both players are ready
    // socket.on('player-ready', function() {
    //     let socketRooms = Object.keys(socket.rooms)
    //     socket.ready = true
    //     // console.log(room)
    //     // console.log(socket.id)
    //     // console.log(socket.rooms)
    //    
    // });
    //for chatting during the game
    socket.on('chat message', function(msg){
        console.log('message: ' + msg);
        io.sockets.to(room).emit('chat message', msg);
    });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
