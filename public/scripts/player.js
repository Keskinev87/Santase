class Player {
    constructor(number) {
        this.playArena = document.getElementById('play-arena');
        this.hand = document.getElementById('own-hand')
        this.pile = document.getElementById('own-pile');
        this.points = 0;
        this.playerNumber = number; //player1 or player2;
        this.lastPlayedCardPos;
    }

    playCard(id) {
        let card = document.getElementById(id);
        
        card.style.left = 0;
        card.classList.add('played-card');
        this.lastPlayedCardPos = Number(card.dataset.pos);
        this.playArena.appendChild(card);
        this.reorderHand();
        this.disableOwnHand();
        socket.emit('card played', {room: gameScene.room, card: id, player: this.playerNumber});
    }

    createPileCard() {
        return new Promise((resolve, reject) => {
            let newCard = document.createElement('img');
    
            newCard.setAttribute("src", cardback);
            newCard.classList.add('card');
            if(newCard)
                resolve(newCard);
            else 
                reject();
        })
        
    }

    collectCards() {
        let wonCards = document.getElementsByClassName('played-card');

        for (let card of wonCards) {
            this.points += cards[card.id].power;
        }
        gameScene.clearPlayArena();
    }

    drawPileCard(card) {
        let drawnCard = document.createElement('img');
        let id = card.number;

        drawnCard.setAttribute("src", cards[card.number].image);
        drawnCard.classList.add('card');
        drawnCard.setAttribute('id', id);
        drawnCard.style.left = '50%';
        drawnCard.style.top = '10%';
       
        this.hand.appendChild(drawnCard);
    }

    disableOwnHand() {
        let ownCards = this.hand.getElementsByClassName('card');
        for (let ownCard of ownCards){
            ownCard.classList.add('disabled-card');
        } 
        this.hand.classList.add('disabled-hand')
        //disables the player's hand (waiting for the opponent to play);
    }

    enableOwnHand(cardPlayed, stage) {
        //this method will activate only the cards that are allowed to be played.
        console.log("Card played is")
        console.log(cardPlayed)
        let allowedSuits = [];
        let allowedPower; 
        let hasValidCards = false;

        switch (stage) {
            case 'initial': {
                allowedSuits = suits;
                allowedPower = 0;
                break;
            }
            case 'pile-over': {
                allowedSuits.push(cardPlayed.suit);
                allowedPower = cardPlayed.power;
                break;
            }
            case 'closed': {
                allowedSuits.push(cardPlayed.suit);
                allowedPower = cardPlayed.power;
                break;
            }
            default: {
                break;
            }
        }
        
        let ownCards = this.hand.getElementsByClassName('card');
        
        for (let ownCard of ownCards) {
            
            let tempCard = cards[Number(ownCard.id)];
            for(let suit of allowedSuits) {
                if (tempCard.suit == suit && tempCard.power >= allowedPower) {
                    ownCard.classList.remove('disabled-card');
                    hasValidCards = true;
                }
                    
            }
        }

        if(!hasValidCards) {
            for (let ownCard of ownCards) {
                if(ownCard.suit == gameScene.trumpSuit){
                    ownCard.classList.remove('disabled-card');
                    hasValidCards = true;
                }
            }
        }

        if(!hasValidCards) {
            for (let ownCard of ownCards) {
                ownCard.classList.remove('disabled-card');
            }
        }
        this.hand.classList.remove('disabled-hand');
    }

    reorderHand() {
        let cardsInHand = document.getElementById("own-hand").querySelectorAll(".card");  
        for (let i = 0; i < cardsInHand.length; i++) {
            cardsInHand[i].style.left = i * 10 + '%'; 
        }
    }

}