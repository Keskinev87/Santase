class GameScene {
    constructor() {
        this.chatForm = document.getElementById('chat-form'); //get the typed message
        this.inputMsg = document.getElementById('m');
        this.gameJoinBtn = document.getElementById('join-game');
        this.readyBtn = document.getElementById('btn-ready');
        this.playField = document.getElementById('play-field');
        this.playArena = document.getElementById('play-arena');
        this.cardPile = document.getElementById('card-pile');
        this.trumpSuit;
        this.room;
        this.myTurn = false;
        this.status = '';
        this.hand = document.getElementById('own-hand'); //player's hand - the cards will be visible
        this.opponentHand = document.getElementById('opponent-hand'); //opponent's hand - cards will not be visible
        this.messages = document.getElementById('messages');
    }

    addEventListeners() {
        return new Promise((resolve, reject) => {
            document.addEventListener('dblclick', function(e) {
                if(e.target && e.target.classList.contains('card')) {
                    player.playCard(e.target.id);
                }
            })
            
            this.chatForm.addEventListener('submit', function(event) {
                socket.emit('chat message', inputMsg.value);
                inputMsg.value='';
                event.preventDefault();
            })
        
            this.gameJoinBtn.addEventListener('click', function() {
                socket.emit('join game')
            })
        
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
                newCard.style.left = index * 10 + '%';
                newCard.style.top = '10%';
        
                resolve(newCard);
            } else if(type =="opponent") {
                let newCard = document.createElement('img');
    
                newCard.setAttribute("src", cardback);
                newCard.classList.add('card');
                newCard.style.left = index * 10 + '%';
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
    }
    
    showOpponentsCard(card) {
        this.createCard('own', 0, card).then((oppCard) => {
            oppCard.style.left = '20%';
            oppCard.classList.add('played-card');
            this.playArena.appendChild(oppCard);
        })
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
        msgContainer.classList.add('status-msg');
        msgContainer.appendChild(message);

        this.messages.appendChild(msgContainer);
    }
}