class GameScene {
    constructor() {
        this.chatForm = document.getElementById('chat-form'); //get the typed message
        this.menu = document.getElementById('menu');
        this.gameScene = document.getElementById('game-container');
        this.inputMsg = document.getElementById('m');
        this.gameJoinBtn = document.getElementById('join-game');
        this.readyBtn = document.getElementById('btn-ready');
        this.playField = document.getElementById('play-field');
        this.playArena = document.getElementById('play-arena');
        this.cardPile = document.getElementById('card-pile');
        this.opponentPile = document.getElementById('opponent-pile');
        this.ownPile = document.getElementById('own-pile');
        this.hand = document.getElementById('own-hand'); //player's hand - the cards will be visible
        this.opponentHand = document.getElementById('opponent-hand'); //opponent's hand - cards will not be visible
        this.messages = document.getElementById('messages');
        this.ownPoints = document.getElementById('own-pts');
        this.oppPoints = document.getElementById('opp-pts');
        this.oppRounds = document.getElementById('opp-rounds-won');
        this.ownRounds = document.getElementById('own-rounds-won');
        this.hostPrivateRoomBtn = document.getElementById('host-private-room');
        this.joinPrivateRoomBtn = document.getElementById('join-private-room');
        this.gameHostJoinForm = document.getElementById('game-host-join-form');
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
        
            this.gameJoinBtn.addEventListener('click', function() {
                gameScene.showGameScene();
                socket.emit('join game');
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

    showHostJoinForm(mode, e) {
        e.preventDefault();
        this.menu.style.visibility = 'hidden';
        this.gameHostJoinForm.style.visibility = '';
        if(mode === 'host') {
           this.gameHostJoinForm.addEventListener('submit', function(event) {
               event.preventDefault();
               let nickName = document.getElementById('nickname-input').value;
               let gameCode = document.getElementById('roomcode-input').value;
               let nickNameErr = document.getElementById('nickname-error');
               let gameCodeErr = document.getElementById('roomcode-error');

               if(!nickName){
                    nickNameErr.innerHTML = "Please enter some nickname";
                    nickNameErr.style.visibility = '';
               }

               if(!gameCode){
                    gameCodeErr.innerHTML = "Please enter the code of the room you want to join";
                    gameCodeErr.style.visibility = '';
               } 
               gameScene.showGameScene();
               socket.emit('host private room', {nickname: nickName, gameCode: gameCode});
               console.log(nickName, gameCode);
               
           })
        } else if(mode === 'join') {
            this.gameHostJoinForm.addEventListener('submit', function(event){
                event.preventDefault();
                let nickName = document.getElementById('nickname-input').value;
                let gameCode = document.getElementById('roomcode-input').value;
                let nickNameErr = document.getElementById('nickname-error');
                let gameCodeErr = document.getElementById('roomcode-error');

                if(!nickName){
                        nickNameErr.innerHTML = "Please enter some nickname";
                        nickNameErr.style.visibility = '';
                }

                if(!gameCode){
                        gameCodeErr.innerHTML = "Please enter the code of the room you want to join";
                        gameCodeErr.style.visibility = '';
                } 
                gameScene.showGameScene();
                socket.emit('join private room', {nickName: nickName, gameCode: gameCode});
                console.log(nickName, gameCode);
            })
        }
        
    }

    closeForm(e) {
        e.preventDefault();
        this.gameHostJoinForm.style.visibility = "hidden";
        this.menu.style.visibility = "";
    }


    showGameScene() {
        this.gameScene.style.visibility = '';
        this.menu.style.visibility = 'hidden';
    }

    announce(message) {
        let announcementMsg = document.getElementById('announcement');
        let announcementContainer = document.getElementById('announcement-container');
        console.log(announcementMsg)
        console.log(announcementContainer)

        announcementMsg.innerHTML = message;
        announcementContainer.style.visibility = '';
        console.log(announcementMsg)
        console.log(announcementContainer)

        setTimeout(function() {
            announcementContainer.style.visibility = 'hidden';
            announcementMsg.innerHTML = ''; 
        }, 4000);

    } 

    announceClosed() {
        socket.emit('closed', {room: gameScene.room, player: player.playerNumber});
    }

    handleClosed(player) {
        let closedCardBack = document.getElementById('closed-card-back');
        let pileCard = document.getElementById('play-pile-card');
        let trumpCard = document.getElementsByClassName('trump-card')[0];

        this.stage = 'closed';
        closedCardBack.style.visibility = '';
        pileCard.classList.add('disabled-card');
        trumpCard.classList.add('disabled-card');
        this.announce(player + "closed");
    }

    allowTrumpChange() {
        //allows the change of the trump for the current player
        console.log("Should be enabled");
        let trumpCard = document.getElementsByClassName('trump-card')[0];
        trumpCard.addEventListener('click', function() {
            player.swapTrumpCard();
        });
    }

    clearPlayArena() {
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
                newCard.style.left = index * 13 + '%';
                newCard.style.top = '15%';
        
                resolve(newCard);
            } else if(type =="opponent") {
                let newCard = document.createElement('img');
    
                newCard.setAttribute("src", cardback);
                newCard.classList.add('opp-card');
                newCard.style.left = index * 13 + '%';
                newCard.style.top = '15%';
                
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

        this.ownPile.appendChild(pileCard.cloneNode());
        this.opponentPile.appendChild(pileCard.cloneNode());
        
        let trumpPileCard = pileCard.cloneNode();
        trumpPileCard.setAttribute('id', 'play-pile-card')
        trumpPileCard.addEventListener('click', function(){
            console.log("Closed")
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
        console.log(data.player)
        console.log(player.playerNumber)
        console.log(data.points)
        data.player === player.playerNumber ? ownPoints.innerHTML = data.points : oppPoints.innerHTML = data.points;
    }

    updateRoundPoints(targetPlayer) {
        targetPlayer.number == player.playerNumber ? this.ownRounds.innerHTML = targetPlayer.roundPoints : this.oppRounds.innerHTML = targetPlayer.roundPoints;
    }

    resetRound(winner) {
        this.playArena.innerHTML='';
        this.cardPile.innerHTML ='';
        this.opponentPile.innerHTML ='';
        this.ownPile.innerHTML = '';
        this.ownPoints.innerHTML = 0;
        this.oppPoints.innerHTML = 0;
        this.updateRoundPoints(winner);

        let ownCards = this.hand.getElementsByClassName('card');
        console.log(ownCards)
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