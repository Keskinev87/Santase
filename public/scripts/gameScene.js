class GameScene {
    constructor() {
        this.chatForm = document.getElementById('chat-form'); //get the typed message
        this.inputMsg = document.getElementById('m');
        this.gameJoinBtn = document.getElementById('join-game');
        this.readyBtn = document.getElementById('btn-ready');
        this.playField = document.getElementById('play-field');
        this.playArena = document.getElementById('play-arena');
        this.cardPile = document.getElementById('card-pile');
        this.opponentPile = document.getElementById('opponent-pile');
        this.ownPile = document.getElementById('own-pile');
        this.trumpSuit;
        this.room;
        this.myTurn = false;
        this.status = '';
        this.hand = document.getElementById('own-hand'); //player's hand - the cards will be visible
        this.opponentHand = document.getElementById('opponent-hand'); //opponent's hand - cards will not be visible
        this.messages = document.getElementById('messages');
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
            
            // this.chatForm.addEventListener('submit', function(event) {
            //     socket.emit('chat message', inputMsg.value);
            //     inputMsg.value='';
            //     event.preventDefault();
            // })
        
            this.gameJoinBtn.addEventListener('click', function() {
                socket.emit('join game')
            })

            window.addEventListener('resize', this.resizeGame);
        
            // readyBtn.addEventListener('click', function() {
            //     socket.emit('player-ready')
            // })
            resolve();
        })
    }

    clearPlayArena() {
        while (this.playArena.hasChildNodes()) {   
            this.playArena.removeChild(this.playArena.firstChild);
          }
    }

    createCard(type, index, card) {
        return new Promise((resolve, reject) => {
            if(type=='own') {
                let newCard = document.createElement('img');
                let id = card.number;
    
                newCard.setAttribute("src", cards[card.number].image);
                newCard.classList.add('card');
                newCard.setAttribute('id', id);
                newCard.setAttribute('data-pos', index);
                newCard.style.left = index * 13 + '%';
                newCard.style.top = '10%';
        
                resolve(newCard);
            } else if(type =="opponent") {
                let newCard = document.createElement('img');
    
                newCard.setAttribute("src", cardback);
                newCard.classList.add('card');
                newCard.style.left = index * 13 + '%';
                newCard.style.top = '10%';
                
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
        let id = card.number;
        trumpCard.setAttribute('id', id);
        trumpCard.setAttribute('src', cards[card.number].image);
       
        trumpCard.classList.add('trump-card');

        this.cardPile.appendChild(trumpCard);
        this.trumpSuit = card.suit;
    }

    dealPileCards() {
        let pileCard = document.createElement('img');
    
        pileCard.setAttribute("src", cardback);
        pileCard.classList.add('pile-card');
        
        this.cardPile.appendChild(pileCard);
        this.opponentPile.appendChild(pileCard.cloneNode());
        this.ownPile.appendChild(pileCard.cloneNode());
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
        data.player === player.playerNumber ? ownPoints.innerHTML = Number(ownPoints.innerHTML) + data.points : oppPoints.innerHTML = Number(oppPoints.innerHTML) + data.points;
    }

    displayChatMsg(msg) {
        
        let message = document.createTextNode(msg);
        let msgContainer = document.createElement('li');

        msgContainer.appendChild(message);
        this.messages.appendChild(msgContainer);
    }

    displayStatusMsg(msg) {
        let message = document.createTextNode(msg);
        let msgContainer = document.createElement('li');
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