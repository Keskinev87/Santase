class Player {
    constructor(number) {
        this.nickName;
        this.playerNumber = number; //player1 or player2;
        this.playArena = document.getElementById('play-arena');
        this.hand = document.getElementById('own-hand');
        this.cardPile = document.getElementById('card-pile');
        this.points = 0;
        this.swapCard;
        this.lastPlayedCardPos;
    }

    playCard(id) {
        let card = document.getElementById(id);
        card.style.left = 0;
        card.classList.remove('card')
        card.classList.add('played-card');
        this.lastPlayedCardPos = Number(card.dataset.pos);
        this.checkForAnnouncement(id);
        this.playArena.appendChild(card);
        this.disableOwnHand();
        socket.emit('card played', {room: gameScene.room, card: id, player: this.playerNumber});
    }

    swapTrumpCard() {
        if(gameScene.turnNumber > 1) {
            let trumpCard = document.getElementsByClassName('trump-card')[0];
            let ownTrump = document.getElementById(this.swapCard.number);
    
            trumpCard.style.top = "15%"
            trumpCard.style.left = ownTrump.dataset.pos * 13 + '%';
            trumpCard.classList.remove('trump-card');
            trumpCard.classList.add('card')
            trumpCard.setAttribute('data-pos', ownTrump.dataset.pos);
    
            ownTrump.style.removeProperty('top');
            ownTrump.style.removeProperty('left');
            ownTrump.classList.remove('card');
            ownTrump.classList.add('trump-card');
            
            this.hand.appendChild(trumpCard);
            this.cardPile.appendChild(ownTrump);

            socket.emit('changed trump card', {room: gameScene.room, player: this.playerNumber, ownTrump: this.swapCard});
            this.swapCard = {};
            this.reorderHand();
        }
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
        drawnCard.style.left = '65%';
        drawnCard.style.top = '15%';
       
        this.hand.appendChild(drawnCard);
        this.reorderHand();
    }

    disableOwnHand() {
        let ownCards = this.hand.getElementsByClassName('card');
        for (let ownCard of ownCards){
            ownCard.classList.add('disabled-card');
        } 
        this.hand.classList.add('disabled-hand')
        if(gameScene.stage == 'initial') {
            let pileCard = document.getElementById('play-pile-card');
            pileCard.disabled = true;
        }
        //disables the player's hand (waiting for the opponent to play);
    }

    enableOwnHand(cardPlayed, stage) {
        //this method will activate only the cards that are allowed to be played.
        let ownCards = this.hand.getElementsByClassName('card');

        if( this.playArena.hasChildNodes()){
            let allowedSuits = [];
            let allowedPower; 
            let hasValidCards = false;
    
            switch (stage) {
                case 'initial': {
                    allowedSuits = suits;
                    allowedPower = 0;
                    //allow closing
                    if(!this.playArena.hasChildNodes()) {
                        let pileCard = document.getElementById('play-pile-card');
                        pileCard.disabled = false;
                    }
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
            
            
            
            for (let ownCard of ownCards) {
                
                let tempCard = cards[Number(ownCard.id)];
                for(let suit of allowedSuits) {
                    if (tempCard.suit == suit && tempCard.power >= allowedPower) {
                        ownCard.classList.remove('disabled-card');
                        hasValidCards = true;
                    } else if(tempCard.suit == suit) {
                        ownCard.classList.remove('disabled-card');
                        hasValidCards = true;
                    }
                }
                
            }
    
            if(!hasValidCards) {
                for (let ownCard of ownCards) {
                    if(cards[ownCard.id].suit == gameScene.trumpSuit){
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
        } else {
            for (let ownCard of ownCards) {
                ownCard.classList.remove('disabled-card');
            }
            
            this.hand.classList.remove('disabled-hand');
        }
        
    }

    reorderHand() {
        let cardsInHand = this.hand.getElementsByClassName('card');  //get the cards in hand
        let arr = []; // create temporaty array
        
        for (let i = 0; i < cardsInHand.length; i++) {
            arr.push(Number(cardsInHand[i].id));
        }

        bubbleSort(arr, arr.length); //sort the array
        console.log(arr)

        //clean the hand
        while(cardsInHand[0]) {
            console.log(cardsInHand[0].parentNode);
            cardsInHand[0].parentNode.removeChild(cardsInHand[0]);
            console.log("removed")
        }

        //attach the cards again in sorted order
        for (let i = 0; i < arr.length; i++) {
            let curCard = cards[arr[i]];
           
            gameScene.createCard('own', i, curCard).then((card) => {
                this.hand.appendChild(card);
            }); 
        }  

        function bubbleSort(arr, n) {
                // Base case 
                if (n == 1) 
                    return; 
            
                // One pass of bubble sort. After 
                // this pass, the largest element 
                // is moved (or bubbled) to end. 
                for (let i=0; i < n-1; i++) {
                    if (arr[i] > arr[i+1]) {
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

    checkForAnnouncement(id) {
        if(!this.playArena.hasChildNodes()) { //it has to be your turn to announce 
            console.log("It is my turn")
            let playerCard = cards[id];
            
            let cardsInHand = document.getElementById("own-hand").querySelectorAll(".card");
            console.log(cardsInHand);
    
            if(playerCard.power == 3 || playerCard.power == 4) {
                for (let cardInHand of cardsInHand) {
                    let card = cards[cardInHand.id];
                    if(playerCard.suit == card.suit && (card.power == 3 || card.power == 4)){
                        playerCard.suit == gameScene.trumpSuit ? this.announceForty() : this.announceTwenty();
                    }
                }
            }
        }
    }

    announceTwenty() {
        socket.emit('announcement', {room: gameScene.room, player: this.playerNumber, points: 20});
        
        gameScene.announce('Обявявам 20');
        gameScene.updatePoints({player: this.playerNumber, points: 20});
        
    }

    announceForty() {
        socket.emit('announcement', {room: gameScene.room, player: this.playerNumber, points: 40});
        gameScene.announce('Обявявам 40');
        console.log("player to update")
        console.log(this.number)
        gameScene.updatePoints({player: this.playerNumber, points: 40});
    }

}