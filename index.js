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
let cards =[{number: 1, suit: "clubs", name: "Nine", power: 0},
    {number: 2, suit: "clubs", name: "Jack", power: 2},
    {number: 3, suit: "clubs", name: "Queen", power: 3},
    {number: 4, suit: "clubs", name: "King", power: 4},
    {number: 5, suit: "clubs", name: "Ten", power: 10},
    {number: 6, suit: "clubs", name: "Ace", power: 11},
    {number: 7, suit: "diamonds", name: "Nine", power: 0},
    {number: 8, suit: "diamonds", name: "Jack", power: 2},
    {number: 9, suit: "diamonds", name: "Queen", power: 3},
    {number: 10, suit: "diamonds", name: "King", power: 4},
    {number: 11, suit: "diamonds", name: "Ten", power: 10},
    {number: 12, suit: "diamonds", name: "Ace", power: 11},
    {number: 13, suit: "hearts", name: "Nine", power: 0},
    {number: 14, suit: "hearts", name: "Jack", power: 2},
    {number: 15, suit: "hearts", name: "Queen", power: 3},
    {number: 16, suit: "hearts", name: "King", power: 4},
    {number: 17, suit: "hearts", name: "Ten", power: 10},
    {number: 18, suit: "hearts", name: "Ace", power: 11},
    {number: 19, suit: "spades", name: "Nine", power: 0},
    {number: 20, suit: "spades", name: "Jack", power: 2},
    {number: 21, suit: "spades", name: "Queen", power: 3},
    {number: 22, suit: "spades", name: "King", power: 4},
    {number: 23, suit: "spades", name: "Ten", power: 10},
    {number: 24, suit: "spades", name: "Ace", power: 11}
]

io.on('connection', function(socket){

    console.log('a user connected');   
    
    socket.on('join game', function() {
         //if the player is not in another room
         if(Object.keys(socket.rooms).length <= 1){

            if(waitingRooms.length > 0) { //there are rooms with players waiting for another player to join

                let gameRoom = waitingRooms.pop();
                gameRoom.player2 = new Player(socket.id, 'player2'); //set the second player in the room
                playingRooms[gameRoom.number] = gameRoom //move the room from waiting to playing
                socket.join(gameRoom.number); //join the socket to the room's number
    
                gameRoom.sendJoinedRoomStatus('player2'); //send the number of the room to the front-end
                gameRoom.sendStatusMsg('Player joined'); //let the players know, that the second player has joined
                gameRoom.sendStatusMsg('The game will begin in 5 seconds...'); //let the players know when the game will start
                
                setTimeout(function() {
                    gameRoom.startGame();
                }, 1000); //start the game
    
            } else {
    
                let room = new Room(roomCounter);
                socket.join(room.number); //join the game
                room.player1 = new Player(socket.id, 'player1');
    
                room.sendJoinedRoomStatus('player1');
                room.sendStatusMsg('Waiting for another player')
                waitingRooms.unshift(room);
                roomCounter++;
            }
        } else {
            io.sockets.to(socket.id).emit('error', 'You already joined the room')
        }
        
       
    });

    socket.on('chat message', function(msg){
        room.sendChatMsg(msg);
    });

    socket.on('card played', function(data){
        playingRooms[data.room].playTurn(data);
    })

    socket.on('card drawn', function(data){
        
        playingRooms[data.room].sendDrawCard(data.player);
    })

    socket.on('announcement', function(data){
        playingRooms[data.room][data.player].updatePoints(data.points);
        playingRooms[data.room].sendAnnouncement(data.player, data.points);
    })

    
    
});

class Room {
    
    constructor(number){
        this.number = number;
        this.name = 'player' + number;
        this.player1;
        this.player2;
        this.nextCard = 0;
        this.playdeck;
        this.trumpSuit;
        this.stage = 'initial';
    }

    startGame() {
        
        this.nextPlayer = this.getRandBetween(1,2); //the player who will play first
        this.nextPlayer == 1 ? this.dealCards(this.player1, this.player2) : this.dealCards(this.player2, this.player1)

    }

    shuffleCards(){
        let newDeck = cards.slice()
        let playDeck = [];
        for (let i = 0; i < 24; i++) {
            let randCard = Math.floor(Math.random() * newDeck.length);
            playDeck[i] = newDeck[randCard];
            newDeck.splice(randCard, 1)
        }
        return playDeck;
    }

    dealCards(player1, player2) {
        console.log("Logging this")
        console.log(this)
        this.playDeck = this.shuffleCards();
        console.log(this.playDeck)
        
        for (let i = 0; i < 12; i++) {
            if(i % 2 == 1) {
                player1.cards.push(this.playDeck[i])
            } else {
                player2.cards.push(this.playDeck[i])
            }
        }
        this.nextCard += 12;
        io.sockets.to(player1.id).emit('deal cards', player1.cards);
        io.sockets.to(player2.id).emit('deal cards', player2.cards);
        this.sendPlay(player1);
        this.sendWait(player2);
        this.trumpSuit = this.playDeck[12].suit;
        console.log("Trump card is")
        console.log(this.playDeck[this.nextCard])
        io.sockets.to(this.number).emit('deal trump card', this.playDeck[this.nextCard]);

    }

    playTurn(data) {
        //data includes room number, card played, player number as a string - 'player1' || 'player2'
        let player = data.player;
        let opponent = this.getOpponent(data.player);
        let card = cards.find(x => x.number == data.card);
        this[player].cardPlayed = card;
        //if both players have made their play, compare their cards to see who wins the turn
        if(this.player1.cardPlayed !== undefined && this.player2.cardPlayed !== undefined) {
           
            this.sendStatusMsg(`${player} played ${card.name} of ${card.suit}`);
            this.sendPlayToOpponent(this[player], this[opponent] ); //send the play to the opponent
            this.compareCards(this[opponent], this[player]); //compare the cards and decide who wins the turn. We have to pass who played first - this would be the opponent if we are here
        } else {
            this.sendPlayToOpponent(this[player], this[opponent]);
            this.sendPlay(this[opponent], this[player].cardPlayed, this.stage); //the method requires the opponent and the hand of the player so it can determine which cards are allowed. 
            this.sendStatusMsg(`${player} played ${card.name} of ${card.suit}`);
            this.sendWait(this[player])
        }

    }

    getOpponent(player) {
        if(player == 'player1')
            return 'player2';
        else
            return 'player1';
    }

    compareCards(firstPlayer, secondPlayer) {
        let card1 = firstPlayer.cardPlayed;
        let card2 = secondPlayer.cardPlayed;
        let card1Wins; //is card1 more powerfull than card2
        console.log("Card 1");
        console.log(card1);
        console.log("Card 2")
        console.log(card2)
        console.log(this.trumpSuit)
        console.log(card1.suit === this.trumpSuit)
        //1. Equal suits? - does not depend on the stage of the game. If the suits are equal, the higher takes. 
        //2. One of the cards is a trump card, the other is not? - does not depend on the stage. Trump card always takes ordinary one. 
        //3. Different non-trump cards? - depends on who played first. If the opponent plays different non-trump card, the player wins.
        if(card1.suit === card2.suit) {
            console.log("Case equal suits")
            card1.power > card2.power ? card1Wins = true : card1Wins = false;
        } else if(card1.suit !== card2.suit) {
            if(card1.suit === this.trumpSuit || card2.suit === this.trumpSuit) {
                console.log("Case trump card")
                card1.suit === this.trumpSuit ? card1Wins = true : card1Wins = false;
                card2.suit === this.trumpSuit ? card1Wins = false : card1Wins = true;
            } else {
                console.log("Case no trump card")
                card1Wins = true;
            }
        } 
        
        if(card1Wins) {
            firstPlayer.points += (card1.power + card2.power);
            if(firstPlayer.points >= 66) {
                this.endRound(firstPlayer, secondPlayer);
            } else {
                io.sockets.to(this.number).emit('update points', {player: firstPlayer.number, points: this.player1.points});
                this.endTurn(firstPlayer, secondPlayer);
            }    
        } else {
            secondPlayer.points += (card1.power + card2.power);
            if(secondPlayer.points >= 66) {
                this.endRound(secondPlayer, firstPlayer);
            } else{
                io.sockets.to(this.number).emit('update points', {player: secondPlayer.number, points: this.player2.points});
                this.endTurn(secondPlayer, firstPlayer);
            }
           
        }

        
    }

    endTurn(winner, loser) {
        
        this.sendStatusMsg(`${winner.name} wins the round`); //send status message with the winner
        io.sockets.to(winner.id).emit('collect cards'); //send event to collect the cards from the play arena
        io.sockets.to(loser.id).emit('clear play area'); //send event to clear the play arena
        
        //set the cards for both players to undefined, so the next turn can be played
        winner.cardPlayed = undefined;
        loser.cardPlayed = undefined;

        if(this.stage == 'initial'){
            this.sendDrawCard(winner, loser); //send draw card event 
        }
        
        this.sendPlay(winner);
        this.sendWait(loser);
    }

    endRound(winner, loser){
        winner.roundPoints++;

        //reset everything;
        this.player1.cards=[];
        this.player1.cardPlayed = undefined;
        this.player1.points = 0;

        this.player2.cards=[];
        this.player2.cardPlayed = undefined;
        this.player2.points = 0;

        this.nextCard = 0;
        this.playdeck = [];
        this.trumpSuit = '';
        this.stage = 'initial';

        io.sockets.to(this.number).emit("end round");
        this.sendStatusMsg(`${winner.number} wins...`);
        this.sendStatusMsg("Starting new round...");

        let self = this;
        setTimeout(function(){
            self.dealCards(winner, loser);
        }, 80000);
    }

    sendDrawCard(winner, loser) {
        this.nextCard++;
        io.sockets.to(winner.id).emit("draw card", this.playDeck[this.nextCard])

        this.nextCard++;
        if(this.nextCard == 24) {
            this.stage = 'pile-over';
            this.nextCard = 12;
            io.sockets.to(this.number).emit('clear trump');
            console.log("The last card")
            console.log(this.nextCard);
        }
        io.sockets.to(loser.id).emit("draw card", this.playDeck[this.nextCard]);
    }

    sendAnnouncement(player, points) {
        let opponent = this.getOpponent(player);
        io.sockets.to(this[opponent].id).emit('announcement', points);
    }
        
    sendPlay(player, cardPlayed, stage) {
        //Tells the front-end of the opponent to play. If it's opponents turn, we will determine through the hand which cards are forbidden to play.
        //The front-end will only enable the cards that are allowed to be played. 
        
        io.sockets.to(player.id).emit('play', cardPlayed, stage);
    }

    sendWait(player) {
        //tells the front-end to wait
        io.sockets.to(player.id).emit('wait');
    }

    sendPlayToOpponent(player,opponent) {
        io.sockets.to(opponent.id).emit('opponent plays', player.cardPlayed);
    }

    getRandBetween(min, max) {
        return Math.floor(Math.random() * max) + min
    }

    sendChatMsg(msg) {
        io.sockets.to(this.number).emit('chat message', msg);
    }
    
    sendStatusMsg(msg) {
        
        io.sockets.to(this.number).emit('status message', msg);
    }

    sendJoinedRoomStatus(player) {
        io.sockets.to(this[player].id).emit('room joined', {roomNumber: this.number, playerNumber: player});
    }
        
}

class Player {
    constructor(id,number, name){
        this.id = id;
        this.number = number; //player1 or player 2
        this.name = name;
        this.cards=[];
        this.cardPlayed;
        this.points=0;
        this.roundPoints=0;
        this.gamePoints=0;
    }

    updatePoints(points) {
        this.points += points;
    }
}

http.listen(5000, function(){
  console.log('listening on *:5000');
});
