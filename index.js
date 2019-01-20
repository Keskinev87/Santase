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
let privateWaitingRooms = {};
let privatePlayingRooms = {};

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

    socket.on('host private room', function(data) {
        let room = new Room(roomCounter, data.gameCode);
        socket.join(room.number);
        room.player1 = new Player(socket.id, 'player1', data.nickName);
        room.sendJoinedRoomStatus('player1');
        room.sendStatusMsg('Waiting for another player')
        privateWaitingRooms[data.gameCode] = room
        console.log('Created Private room')
        roomCounter++;
    })

    socket.on('join private room', function(data){
        
        if(privateWaitingRooms[data.gameCode] !== undefined) {
            console.log("Joining room")
            let gameRoom = privateWaitingRooms[data.gameCode];
            gameRoom.player2 = new Player(socket.id, 'player2'); //set the second player in the room
            privatePlayingRooms[data.gameCode] = gameRoom //move the room from waiting to playing
            delete privateWaitingRooms[data.gameCode];
            socket.join(gameRoom.number); //join the socket to the room's number
            gameRoom.sendJoinedRoomStatus('player2'); //send the number of the room to the front-end
            gameRoom.sendStatusMsg('Player joined'); //let the players know, that the second player has joined
            gameRoom.sendStatusMsg('The game will begin in 5 seconds...'); //let the players know when the game will start
                
            setTimeout(function() {
                gameRoom.startGame();
            }, 1000); //start the game
        }
    })
    
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

    socket.on('changed trump card', function(data){
        playingRooms[data.room].announceTrumpChange(data.player, data.ownTrump);
    })

    socket.on('announcement', function(data){
        playingRooms[data.room][data.player].updatePoints(data.points);
        playingRooms[data.room].sendAnnouncement(data.player, data.points);
    })

    socket.on('closed', function(data) {
        playingRooms[data.room].announceClosed(data.player);
    })

    
    
});

class Room {
    
    constructor(number, code){
        this.number = number;
        this.code = code;
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

        this.playDeck = this.shuffleCards();
        this.trumpSuit = this.playDeck[12].suit;

        io.sockets.to(this.number).emit('deal trump card', this.playDeck[12]);
        for (let i = 0; i < 12; i++) {
            if(i % 2 == 1) {
                if(this.playDeck[i].suit == this.trumpSuit && this.playDeck[i].power == 0) {
                    io.sockets.to(player1.id).emit("enable trump change", this.playDeck[i]);
                }
                player1.cards.push(this.playDeck[i])
            } else {
                if(this.playDeck[i].suit == this.trumpSuit && this.playDeck[i].power == 0) {
                    io.sockets.to(player2.id).emit("enable trump change", this.playDeck[i]);
                }
                player2.cards.push(this.playDeck[i])
            }
        }
        this.nextCard += 12;
        bubbleSort(player1.cards, player1.cards.length);
        bubbleSort(player2.cards, player2.cards.length);
        io.sockets.to(player1.id).emit('deal cards', player1.cards);
        io.sockets.to(player2.id).emit('deal cards', player2.cards);
        this.sendPlay(player1);
        this.sendWait(player2);


        function bubbleSort(arr, n) {
            // Base case 
            if (n == 1) 
                return; 
        
            // One pass of bubble sort. After 
            // this pass, the largest element 
            // is moved (or bubbled) to end. 
            for (let i=0; i < n-1; i++) {
                if (arr[i].number > arr[i+1].number) {
                    let temp = arr[i]; 
                    arr[i] = arr[i+1]; 
                    arr[i+1] = temp;
                } 
            }
                
        
            // Largest element is fixed, 
            // recur for remaining array 
            bubbleSort(arr, n-1); 
        }
    }

    announceTrumpChange(player, card) {
        let opponent = this.getOpponent(player);
        let index = this[player].cards.map(function(e) { return e.number}).indexOf(card.number);
        let temp;

        

        temp = this.playDeck[12]; //the current trump card
        this.playDeck[12] = this[player].cards[index]; //change the trump card
        this[player].cards[index] = temp; //change the player's card
    
        console.log("Cards of player")
        console.log(this[player].cards)
        console.log("New turmp")
        console.log(this.playDeck[12])

        io.sockets.to(this[opponent].id).emit('trump card changed', card);
    }

    playTurn(data) {
        //data includes room number, card played, player number as a string - 'player1' || 'player2'
        let player = data.player;
        let opponent = this.getOpponent(data.player);
        let curIndex;
        
        let card = this[player].cards.find(function(value, index) {
            curIndex = index;
            if(value.number == data.card)
                return value
        });

        this[player].cards.splice(curIndex, 1);

        
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
        
        //1. Equal suits? - does not depend on the stage of the game. If the suits are equal, the higher takes. 
        //2. One of the cards is a trump card, the other is not? - does not depend on the stage. Trump card always takes ordinary one. 
        //3. Different non-trump cards? - depends on who played first. If the opponent plays different non-trump card, the player wins.
        if(card1.suit === card2.suit) {
            card1.power > card2.power ? card1Wins = true : card1Wins = false;
        } else if(card1.suit !== card2.suit) {
            if(card1.suit === this.trumpSuit || card2.suit === this.trumpSuit) {
                card1.suit === this.trumpSuit ? card1Wins = true : card1Wins = false;
                card2.suit === this.trumpSuit ? card1Wins = false : card1Wins = true;
            } else {
                card1Wins = true;
            }
        } 

        card1Wins? this.updatePoints(firstPlayer, card1.power + card2.power) : this.updatePoints(secondPlayer, card1.power + card2.power);

    }

    updatePoints(player, points) {
        let opponent = this.getOpponent(player.number);

        this[player.number].points += points;
        
        io.sockets.to(this.number).emit('update points', {player: player.number, points: this[player.number].points});
        if(this[player.number].points >= 66) {
            let self = this;
            setTimeout(function() {
                self.endRound(player, self[opponent]);
            }, 1000);
        } else {
            let self = this;
            setTimeout(function(){
                self.endTurn(player, self[opponent]);
            }, 1000)
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
        
        if(winner.cards.length == 0 && loser.cards.length == 0) {
            this.endRound(winner, loser);
        }
        
        this.sendPlay(winner);
        this.sendWait(loser);
    }

    endRound(winner, loser){
        if(loser.points == 0) 
            winner.roundPoints += 3;
        else if(loser.points < 33)
            winner.roundPoints += 2;
        else 
            winner.roundPoints++

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

        io.sockets.to(this.number).emit("end round", winner);
        this.sendStatusMsg(`${winner.number} wins...`);
        this.sendStatusMsg("Starting new round...");

        let self = this;
        setTimeout(function(){
            self.dealCards(winner, loser);
        }, 8000);
    }

    sendDrawCard(winner, loser) {
        this.nextCard++;
        
        if(this.playDeck[this.nextCard].suit == this.trumpSuit && this.playDeck[this.nextCard].power == 0) {
            io.sockets.to(winner.id).emit("enable trump change", this.playDeck[this.nextCard]);
        }
        this[winner.number].cards.push(this.playDeck[this.nextCard]);
       
        io.sockets.to(winner.id).emit("draw card", this.playDeck[this.nextCard]);

        this.nextCard++;
        if(this.nextCard == 24) {
            this.stage = 'pile-over';
            this[loser.number].cards.push(this.playDeck[12]);
            io.sockets.to(this.number).emit('clear trump');
            io.sockets.to(loser.id).emit("draw card", this.playDeck[12]); //draw the trump card, beause it is the last
            return;
        }
        if(this.playDeck[this.nextCard].suit == this.trumpSuit && this.playDeck[this.nextCard].power == 0) {
            io.sockets.to(loser.id).emit("enable trump change", this.playDeck[this.nextCard]);
        }
        this[loser.number].cards.push(this.playDeck[this.nextCard]);
        
        io.sockets.to(loser.id).emit("draw card", this.playDeck[this.nextCard]);
    }

    announceClosed(player){
        let opponent = this.getOpponent(player);
        io.sockets.to(this.number).emit('closed', player);
        this.stage = 'closed';
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
