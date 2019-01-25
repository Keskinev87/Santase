class GameScene {
    constructor() {
        this.nickNameForm = document.getElementById('nickname-form');
        this.chatForm = document.getElementById('chat-form'); //get the typed message
        this.menu = document.getElementById('menu');
        this.gameScene = document.getElementById('game-container');
        this.inputMsg = document.getElementById('m');
        this.gameJoinBtn = document.getElementById('join-game');
        this.readyBtn = document.getElementById('btn-ready');
        this.playField = document.getElementById('play-field');
        this.playArena = document.getElementById('play-arena');
        this.cardPile = document.getElementById('card-pile');
        this.hand = document.getElementById('own-hand'); //player's hand - the cards will be visible
        this.opponentHand = document.getElementById('opponent-hand'); //opponent's hand - cards will not be visible
        this.messages = document.getElementById('messages');
        this.ownPoints = document.getElementById('own-pts');
        this.oppPoints = document.getElementById('opp-pts');
        this.oppRounds = document.getElementById('opp-rounds-won');
        this.ownRounds = document.getElementById('own-rounds-won');
        this.ownGamePointsCounter = document.getElementById('own-games-won');
        this.oppGamePointsCounter = document.getElementById('opp-games-won');
        this.hostPrivateRoomBtn = document.getElementById('host-private-room');
        this.joinPrivateRoomBtn = document.getElementById('join-private-room');
        this.gameHostJoinForm = document.getElementById('game-host-join-form');
        this.setNickNameForm = document.getElementById('set-nickname-form');
        this.turnNumber = 1;
        this.trumpChangeAllowed = false;
        this.trumpSuit;
        this.room;
        this.myTurn = false;
        this.status = '';
        this.latesttap;
    }

    addEventListeners() {
        return new Promise((resolve, reject) => {
            
            document.addEventListener('click', function(e) {
                
                let now = new Date().getTime();
                var timesince = now - gameScene.latesttap;
                if((timesince < 600) && (timesince > 0)){
                    if(e.target && e.target.classList.contains('card')) {
                        player.playCard(e.target.id);
                    }  
                }

                gameScene.latesttap = new Date().getTime();

            })

            this.setNickNameForm.addEventListener('submit', function(event){
                gameScene.setNickName(event);
            })
        
            this.gameJoinBtn.addEventListener('click', function() {
                gameScene.showGameScene();
                socket.emit('join game', player.nickName);
            })

            this.hostPrivateRoomBtn.addEventListener('click', function(event){
                gameScene.showHostJoinForm('host', event);
            })

            this.joinPrivateRoomBtn.addEventListener('click', function(event){
                gameScene.showHostJoinForm('join', event);
            })


            window.addEventListener('resize', this.resizeGame);
        
            resolve();
        })
    }

    setNickName(e) {
        e.preventDefault();
        let nickName = document.getElementById('nickname-input').value;
        let nickNameErr = document.getElementById('nickname-error');
        let nickNameHolder = document.getElementById('own-name')

        if(!nickName){
            nickNameErr.innerHTML = "Моля въведете име!";
            nickNameErr.style.visibility = '';
        } else {
            player.nickName = nickName;
            nickNameHolder.innerHTML = nickName;
            this.setNickNameForm.style.visibility = 'hidden';
            this.showMenu();
        }
    }

    showMenu(){
        this.menu.style.visibility = '';
    }

    showHostJoinForm(mode, e) {
        e.preventDefault();
        this.menu.style.visibility = 'hidden';
        this.gameHostJoinForm.style.visibility = '';
        if(mode === 'host') {
           this.gameHostJoinForm.addEventListener('submit', function(event) {
               event.preventDefault();
               
               let gameCode = document.getElementById('roomcode-input').value;
               let gameCodeErr = document.getElementById('roomcode-error');

               if(!gameCode){
                    gameCodeErr.innerHTML = "Моля въведете кода на стаята!";
                    gameCodeErr.style.visibility = '';
               } 
               gameScene.showGameScene();
               socket.emit('host private room', {nickname: player.nickName, gameCode: gameCode});
               console.log(player.nickName, gameCode);
           })
        } else if(mode === 'join') {
            this.gameHostJoinForm.addEventListener('submit', function(event){
                event.preventDefault();
                let gameCode = document.getElementById('roomcode-input').value;
                let gameCodeErr = document.getElementById('roomcode-error');

                if(!gameCode){
                        gameCodeErr.innerHTML = "Моля въведете кода на стаята";
                        gameCodeErr.style.visibility = '';
                } 
                gameScene.showGameScene();
                socket.emit('join private room', {nickName: player.nickName, gameCode: gameCode});
                console.log(player.nickName, gameCode);
            })
        }
        
    }

    closeForm(e) {
        e.preventDefault();
        this.gameHostJoinForm.style.visibility = "hidden";
        this.menu.style.visibility = "";
    }


    showGameScene() {
        this.launchIntoFullscreen(document.documentElement);
        this.gameScene.style.visibility = '';
        this.menu.style.visibility = 'hidden';
    }

    announce(message) {
        let announcementMsg = document.getElementById('announcement');
        let announcementContainer = document.getElementById('announcement-container');

        announcementMsg.innerHTML = message;
        announcementContainer.style.visibility = '';

        setTimeout(function() {
            announcementContainer.style.visibility = 'hidden';
            announcementMsg.innerHTML = ''; 
        }, 4000);

    } 

    announceClosed() {
        console.log(this.turnNumber);
        console.log(this.playArena.hasChildNodes())
        if (!this.playArena.hasChildNodes() && this.turnNumber > 1)
            socket.emit('closed', {room: gameScene.room, player: player.playerNumber});
    }

    handleClosed(name) {
        let closedCardBack = document.getElementById('closed-card-back');
        let pileCard = document.getElementById('play-pile-card');
        let trumpCard = document.getElementsByClassName('trump-card')[0];

        this.stage = 'closed';
        closedCardBack.style.visibility = '';
        pileCard.classList.add('disabled-card');
        trumpCard.classList.add('disabled-card');
        this.announce(name + " затвори");
    }

    allowTrumpChange() {
        //allows the change of the trump for the current player
        console.log("Should be enabled");
            let trumpCard = document.getElementsByClassName('trump-card')[0];
            trumpCard.addEventListener('click', function() {
                player.swapTrumpCard();
            }); 
    }

    swapTrump(card) {
        let trumpCard = document.getElementsByClassName('trump-card')[0];
        trumpCard.parentElement.removeChild(trumpCard);
        this.dealTrumpCard(card);
    }

    clearPlayArena() {
        this.turnNumber++;
        while (this.playArena.hasChildNodes()) {   
            this.playArena.removeChild(this.playArena.firstChild);
        }
    }

    clearTrumpArea() {
        while(this.cardPile.hasChildNodes()) {
            this.cardPile.removeChild(this.cardPile.firstChild);
        }
    }

    createCard(type, index, card) {
        return new Promise((resolve, reject) => {
            if(type=='own') {
                let newCard = document.createElement('img');
                let id = card.number;
                let cardName = cards[card.number].number + cards[card.number].suit;
    
                newCard.setAttribute("src", cards[card.number].image);
                newCard.classList.add('card');
                newCard.setAttribute('id', id);
                newCard.setAttribute('data-pos', index);
                newCard.setAttribute('data-name', cardName);
                newCard.setAttribute('data-suit', card.suit);
                newCard.style.left = (index * 15 + 2)  + '%';
                newCard.style.top = '10%';
        
                resolve(newCard);
            } else if(type =="opponent") {
                let newCard = document.createElement('img');
    
                newCard.setAttribute("src", cardback);
                newCard.classList.add('opp-card');
                newCard.style.left = (index * 15 + 2) + '%';
                newCard.style.top = '2%';
                
                resolve(newCard);
            } else {
                reject();
            }
        })
        
    }

    // deals the created cards to the player

    dealCards(cards) { 
        for (let i=0; i < cards.length; i++) {
             //deal a visible card to the player
            this.createCard('own', i, cards[i]).then((card) => {
                this.hand.appendChild(card);
            }); 
            //deal a card to the opponent
            this.createCard('opponent', i).then((oppCard) => {
                this.opponentHand.appendChild(oppCard);
            })  
        }
    }

    dealTrumpCard(card) {
        let trumpCard = document.createElement('img');
        let cardName = cards[card.number].number + cards[card.number].suit;
        let id = card.number;
        // let swapIcon = document.createElement('img');


        // swapIcon.setAttribute('src', swapIcn);
        // swapIcon.classList.add('swap-icon');

        trumpCard.setAttribute('id', id);
        trumpCard.setAttribute('data-name', cardName);
        trumpCard.setAttribute('src', cards[card.number].image);
        trumpCard.classList.add('trump-card');

        this.cardPile.appendChild(trumpCard);
        // this.cardPile.appendChild(swapIcon);
        this.trumpSuit = card.suit;
    }

    dealPileCards() {
        let pileCard = document.createElement('img');
        let closedImage = document.createElement('img');
        closedImage.setAttribute('src', closedCardBack);
        closedImage.setAttribute('id', 'closed-card-back');
        closedImage.style.visibility = 'hidden';
        closedImage.classList.add('pile-card');
    
        pileCard.setAttribute("src", cardback);
        pileCard.classList.add('pile-card');
        
        let trumpPileCard = pileCard.cloneNode();
        trumpPileCard.setAttribute('id', 'play-pile-card')
        trumpPileCard.addEventListener('click', function(){
            gameScene.announceClosed();
        })
        this.cardPile.appendChild(trumpPileCard);
        this.cardPile.appendChild(closedImage);
        
        
    }
    
    showOpponentsCard(card) {
        this.createCard('own', 0, card).then((oppCard) => {
            oppCard.style.left = '40%';
            oppCard.classList.remove('card');
            oppCard.classList.add('played-card');
            this.playArena.appendChild(oppCard);
        })
    }

    updatePoints(data) {
        let ownPoints = document.getElementById('own-pts');
        let oppPoints = document.getElementById('opp-pts');   
        data.player === player.playerNumber ? ownPoints.innerHTML = data.points : oppPoints.innerHTML = data.points;
    }

    updateRoundPoints(targetPlayer) {
        targetPlayer.number == player.playerNumber ? this.ownRounds.innerHTML = targetPlayer.roundPoints : this.oppRounds.innerHTML = targetPlayer.roundPoints;
    }

    awardGamePoints(playerWon){
        if(playerWon.number === player.playerNumber) {
            this.ownGamePointsCounter.innerHTML = playerWon.gamePoints; 
        } else {
            this.oppGamePointsCounter.innerHTML = playerWon.gamePoints;
        }
    }

    resetRound(winner) {
        this.playArena.innerHTML='';
        this.cardPile.innerHTML ='';
        this.ownPoints.innerHTML = 0;
        this.oppPoints.innerHTML = 0;
        this.turnNumber = 1;

        let ownCards = this.hand.getElementsByClassName('card');
        
        while(ownCards[0]) {
            ownCards[0].parentNode.removeChild(ownCards[0]);
        }

        let oppCards = this.opponentHand.getElementsByClassName('opp-card');

        while(oppCards[0]) {
            oppCards[0].parentNode.removeChild(oppCards[0]);
        };
    
    }

    displayChatMsg(msg) {
        
        let message = document.createTextNode(msg);
        let msgContainer = document.createElement('p');

        msgContainer.appendChild(message);
        this.messages.appendChild(msgContainer);
    }

    displayStatusMsg(msg) {
        let message = document.createTextNode(msg);
        let msgContainer = document.createElement('p');
        let shouldScroll;

        msgContainer.classList.add('status-msg');
        msgContainer.appendChild(message);

        shouldScroll = messages.scrollTop + messages.clientHeight === messages.scrollHeight;
        this.messages.appendChild(msgContainer);

        if (!shouldScroll) {
            this.scrollToBottom();
        }
    }
    
    scrollToBottom() {
      messages.scrollTop = messages.scrollHeight;
    }

    quitGame() {
        console.log("quitGame")
        this.resetRound();
        this.gameScene.style.visibility = 'hidden';
        this.showMenu();

        let opponentsNameHolder = document.getElementById('opp-name');
        opponentsNameHolder.innerHTML = '';
        socket.emit('leave room', gameScene.room);
        gameScene.room = undefined;
        player.playerNumber = undefined;
    }

    launchIntoFullscreen(element) {
        return new Promise((resolve, reject) => {
            if(element.requestFullscreen) {
                element.requestFullscreen();
                resolve();
              } else if(element.mozRequestFullScreen) {
                element.mozRequestFullScreen();
                resolve();
              } else if(element.webkitRequestFullscreen) {
                element.webkitRequestFullscreen();
                resolve();
              } else if(element.msRequestFullscreen) {
                element.msRequestFullscreen();
                resolve();
              } else {
                  reject();
              }
        })
        
     }

    resizeGame () {
        console.log("Resizing")
        let gameArea = document.getElementById('game-container');

        let widthToHeight = 9 / 16;
        // let newWidth = window.outerWidth;
        // let newHeight = window.outerHeight;
        let newWidth = window.innerWidth;
        let newHeight = window.innerHeight;
        let newWidthToHeight = newWidth / newHeight;

        if (newWidthToHeight > widthToHeight) {
            newWidth = newHeight * widthToHeight;
            gameArea.style.height = newHeight + 'px';
            gameArea.style.width = newWidth + 'px';
        } else {
            newHeight = newWidth / widthToHeight;
            gameArea.style.width = newWidth + 'px';
            gameArea.style.height = newHeight + 'px';
        }

        gameArea.style.marginTop = (-newHeight / 2) + 'px';
        gameArea.style.marginLeft = (-newWidth / 2) + 'px'; 
      }
}