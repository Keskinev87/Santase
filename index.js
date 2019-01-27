var express = require('express')
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
const PORT = process.env.PORT || 5000;


app.use(express.static('public'))

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

let roomCounter = 1;
let waitingRooms = []; //the rooms with waiting players
let playingRooms = {}; //the rooms with coupled players, who are playing - HASHTABLE
let privateWaitingRooms = {};


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
        let room = new Room(Number(data.gameCode), data.gameCode);
   
        socket.join(room.number);
        socket.curRoom = room.number;
        room.player1 = new Player(socket.id, 'player1', data.nickName);
        room.sendHostedRoomStatus('player1');
        room.sendStatusMsg('Изчакване на друг играч...')
        privateWaitingRooms[room.number] = room;
        console.log("First player check")
        console.log(data)
        console.log(room.player1)
        roomCounter++;
    })

    socket.on('join private room', function(data){

        if(privateWaitingRooms[data.gameCode] !== undefined) {
            let gameRoom = privateWaitingRooms[data.gameCode];

            gameRoom.player2 = new Player(socket.id, 'player2', data.nickName); //set the second player in the room
           
            socket.join(gameRoom.number); //join the socket to the room's number
            socket.curRoom = gameRoom.number;
            gameRoom.sendJoinedRoomStatus('player2'); //send the number of the room to the front-end
            gameRoom.sendStatusMsg(gameRoom.player2.nickName + ' joined'); //let the players know, that the second player has joined
            gameRoom.sendStatusMsg('Играта започва...'); //let the players know when the game will start

            playingRooms[gameRoom.number] = gameRoom //move the room from waiting to playing
            delete privateWaitingRooms[data.gameCode]; //delete the room, since both players left
            
            setTimeout(function() {
                gameRoom.startGame();
            }, 1000); //start the game
        } else {
            io.sockets.to(socket.id).emit('wrong room code');
        }
    })
    
    socket.on('join game', function(nickName) {
         //if the player is not in another room
         if(Object.keys(socket.rooms).length <= 1){
           
            if(waitingRooms.length > 0) { //there are rooms with players waiting for another player to join

                let gameRoom = waitingRooms.pop();
                gameRoom.player2 = new Player(socket.id, 'player2', nickName); //set the second player in the room
                playingRooms[gameRoom.number] = gameRoom //move the room from waiting to playing
                socket.join(gameRoom.number); //join the socket to the room's number
                socket.curRoom = gameRoom.number;
    
                gameRoom.sendJoinedRoomStatus('player2'); //send the number of the room to the front-end
                gameRoom.sendStatusMsg(gameRoom.player2.nickName + ' joined'); //let the players know, that the second player has joined
                gameRoom.sendStatusMsg('Играта започва...'); //let the players know when the game will start
                
                setTimeout(function() {
                    gameRoom.startGame();
                }, 1000); //start the game
    
            } else {
    
                let room = new Room(roomCounter);
                socket.join(room.number); //join the game
                socket.curRoom = room.number;
                room.player1 = new Player(socket.id, 'player1', nickName);
    
                room.sendHostedRoomStatus('player1');
                room.sendStatusMsg('Изчакване за друг играч...')
                waitingRooms.unshift(room);
                roomCounter++;
            }
        } else {
            io.sockets.to(socket.id).emit('error', 'Вече сте в стая!')
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
        playingRooms[data.room][data.player].updatePoints(data.points, data.room);
        playingRooms[data.room].sendAnnouncement(data.player, data.points);
    })

    socket.on('closed', function(data) {
        playingRooms[data.room].announceClosed(data.player);
    })

    // socket.on('quitting', function(msg) {
    //     console.log(msg);
    //     console.log(socket.id);
    //     console.log(socket.nsp.rooms);
    // })

    socket.on('disconnect', function() {
        io.sockets.to(socket.curRoom).emit('player left', "the player has left");
        if(playingRooms[socket.curRoom])
            delete playingRooms[socket.curRoom];
        else if(privateWaitingRooms[socket.curRoom])
            delete privateWaitingRooms[socket.curRoom];
        else
            waitingRooms.pop();
    })

    socket.on('leave room', function(room) {
        socket.leave(room);
    })
 
});

class Room {
    
    constructor(number, code){
        this.number = number;
        this.code = code;
        this.player1;
        this.player2;
        this.playerClosed;
        this.nextCard = 0;
        this.turnNumber = 0;
        this.playdeck;
        this.trumpSuit;
        this.stage = 'initial';
    }

    startGame() {
        this.nextPlayer = this.getRandBetween(1,2); //the player who will play first
        this.nextPlayer == 1 ? this.dealCards(this.player1, this.player2) : this.dealCards(this.player2, this.player1);
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
            this.sendStatusMsg(`${this[player].nickName} игра ${card.name} of ${card.suit}`);
            this.sendPlayToOpponent(this[player], this[opponent] ); //send the play to the opponent
            this.compareCards(this[opponent], this[player]); //compare the cards and decide who wins the turn. We have to pass who played first - this would be the opponent if we are here
        } else {
            this.sendPlayToOpponent(this[player], this[opponent]);
            this.sendPlay(this[opponent], this[player].cardPlayed, this.stage); //the method requires the opponent and the hand of the player so it can determine which cards are allowed. 
            this.sendStatusMsg(`${this[player].nickName} игра ${card.name} of ${card.suit}`);
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

        if(card1Wins) {
            firstPlayer.updatePoints(card1.power + card2.power, this.number);
            this.checkPoints(firstPlayer);
        } else {
            secondPlayer.updatePoints(card1.power + card2.power, this.number);
            this.checkPoints(secondPlayer);
        }
        
    }

    checkPoints(player) {
        let opponent = this.getOpponent(player.number);
        
        if(this.player1.points >= 66) {
                this.endRound(self.player1, self.player2);
        } else if (this.player2.points >= 66) {
                this.endRound(self.player2, self.player1);
        } else {
            let self = this;
            setTimeout(function(){
                self.endTurn(player, self[opponent]);
            }, 1000)
        }
    }

    endTurn(winner, loser) {
        
        this.sendStatusMsg(`${winner.nickName} печели ръката`); //send status message with the winner
        io.sockets.to(winner.id).emit('collect cards'); //send event to collect the cards from the play arena
        io.sockets.to(loser.id).emit('clear play area'); //send event to clear the play arena
        
        //set the cards for both players to undefined, so the next turn can be played
        winner.cardPlayed = undefined;
        loser.cardPlayed = undefined;
        
        //both players run out of cards - end the round
        if(winner.cards.length == 0 && loser.cards.length == 0) {
            if(this.stage === 'pile-over') 
                this.endRound(winner, loser);
            else if(this.stage === 'closed') {
                let winnerFromClosed = this.getOpponent(this.playerClosed);
                this.endRound(this[winnerFromClosed], this[this.playerClosed]); //the player who closed didn't make 66
            }
            
        } else if (this.stage == 'initial'){
            
            this.sendDrawCard(winner, loser); //send draw card event 
            this.turnNumber++;
            this.sendPlay(winner);
            this.sendWait(loser);
        } else {
            this.turnNumber++;
            this.sendPlay(winner);
            this.sendWait(loser);
        }

        
    }

    endRound(winner, loser){
      
        if(loser.number === this.playerClosed) {
            winner.roundPoints += 3; //the player who closed didn't make 66
        } else {
            if(loser.points == 0) 
                winner.roundPoints += 3;
            else if(loser.points < 33)
                winner.roundPoints += 2;
            else 
                winner.roundPoints++;
        }

        if(winner.roundPoints >= 11) {
            winner.roundPoints = 0;
            winner.gamePoints++;
            io.sockets.to(this.number).emit("game won", winner);
            this.sendStatusMsg(`${winner.nickName} печели раздаването...`);
        }
        

        //reset everything;
        this.player1.cards=[];
        this.player1.cardPlayed = undefined;
        this.player1.points = 0;

        this.player2.cards=[];
        this.player2.cardPlayed = undefined;
        this.player2.points = 0;

        this.playerClosed = '';
        this.nextCard = 0;
        this.playdeck = [];
        this.trumpSuit = '';
        this.turnNumber = 0;
        this.stage = 'initial';

        let self = this;
        setTimeout(function(){
            io.sockets.to(self.number).emit("end round", winner);
            self.sendStatusMsg(`${winner.nickName} печели раздаването...`);
            self.sendStatusMsg("Започва ново раздаване...");
        }, 2000)

        setTimeout(function(){
            self.dealCards(winner, loser);
        }, 3000);
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
        this.playerClosed = player;
        this.stage = 'closed';
        io.sockets.to(this.number).emit('closed', this[player].nickName);
    }

    sendAnnouncement(player, points) {
        let opponent = this.getOpponent(player);
        io.sockets.to(this[opponent].id).emit('announcement', this[player].nickName, points);
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

    sendHostedRoomStatus(player) {
        io.sockets.to(this[player].id).emit('room hosted', {roomNumber: this.number, playerNumber: player, opponentsNickName: ''});
    }

    sendJoinedRoomStatus(player) {
        let opponent = this.getOpponent(player);
        console.log("Sending joined")
        console.log(this[opponent])
        console.log(this[player])
        io.sockets.to(this[player].id).emit('room joined', {roomNumber: this.number, playerNumber: player, opponentsNickName: this[opponent].nickName});
        io.sockets.to(this[opponent].id).emit('room joined', {roomNumber: this.number, playerNumber: opponent, opponentsNickName: this[player].nickName});
        
        
            
    }

   
        
}

class Player {
    constructor(id,number, nickName){
        this.id = id;
        this.number = number; //player1 or player 2
        this.nickName = nickName;
        this.cards=[];
        this.cardPlayed;
        this.points=0;
        this.roundPoints=0;
        this.gamePoints=0;
    }

    updatePoints(points, roomNumber) {
        this.points += points;
        io.sockets.to(roomNumber).emit('update points', {player: this.number, points: this.points});

        if(this.points >= 66) {
            let loser = playingRooms[roomNumber].getOpponent(this.number);
            
            playingRooms[roomNumber].endRound(this, playingRooms[roomNumber][loser]);
        }
    }
}

http.listen(PORT, function(){
    console.log('listening on *:5000');
});