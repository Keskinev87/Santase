window.onload = main;

function main () {
    var socket = io();

    let chatForm = document.getElementById('chat-form'); //get the typed message
    let inputMsg = document.getElementById('m');
    let gameJoinBtn = document.getElementById('join-game');
    let readyBtn = document.getElementById('btn-ready')
    let playField = document.getElementById('play-field')
    let room = '';
    let myTurn = false;
    let status = '';
    
    //                ADD EVENT LISTENERS TO THE ELEMENTS
    
    //Make cards dragable. The player will be able to drag it into the play area.
    //Since the cards are generated dynamically, we implemented this with event delegation
    document.addEventListener('dragstart',function(e){
        if(e.target) {
            console.log(e)
            e.dataTransfer.setData("text", e.target.id);
        }
    })

    //allow the card to be dragged over the play field
    playField.addEventListener('dragover', allowDrop)

    //allow the card to be dropped in the play field
    playField.addEventListener('drop', drop)

    //The other option for the users to play a card will be a doulbe click...
    document.addEventListener('dblclick', function(e) {
        if(e.target && e.target.classList.contains('card')) {
            playCard(e.target.id);
        }
     })
    
    chatForm.addEventListener('submit', function(event) {
        socket.emit('chat message', inputMsg.value);
        inputMsg.value='';
        event.preventDefault();
    })

    gameJoinBtn.addEventListener('click', function(event) {
        socket.emit('join game')
    })

    readyBtn.addEventListener('click', function(event) {
        socket.emit('player-ready')
    })
    
    //             ADD SOCKET EVENT HANDLERS

    socket.on('chat message', function(msg){
        let messages = document.getElementById('messages');
        let message = document.createTextNode(msg);
        let msgContainer = document.createElement('li');

        msgContainer.appendChild(message);
        messages.appendChild(msgContainer);
    });

    socket.on('room', function(assignedRoom){
        room = assignedRoom;
    })

    socket.on('status-message', function(status) {
        console.log(status)
        switch (status) {
            case 'starting': {
                console.log('Game starting')
            }
            default: break
        }
    })

    socket.on('deal cards', function(cards) {
        console.log(cards)
        dealCards(cards)
    })

    socket.on('error', function(error) {
        window.alert(error)
    })

    //             GAME FUNCTIONS


    //creates the cards from the server array
    function createCard(type, card) {

        if(type=='own') {
            let newCard = document.createElement('img')
            let posHor = (card.posHor-1) * -80 - (card.posHor - 1);
            let posVer = (card.posVer-1) * -117;
            let id = card.number + card.suit[0]

            newCard.setAttribute("src", "images/transparent-1.png");
            newCard.classList.add('card');
            newCard.setAttribute('draggable', 'true');
            newCard.setAttribute('id', id);
            newCard.style.background = 'url(images/cards.gif) ' + posHor + 'px ' + posVer + 'px';
    
            return newCard
        } else if(type =="opponent") {
            let newCard = document.createElement('img')
          
            newCard.classList.add('card');
            newCard.style.background = 'url(images/card-back-1.png)'

            return newCard;
        }
        
    }

    // deals the created cards to the player

    function dealCards(cards) {
        let hand = document.getElementById('own-hand'); //player's hand - the cards will be visible
        let opponentHand = document.getElementById('opponent-hand'); //opponent's hand - cards will not be visible

        for (let card of cards) {
            let cardEl = createCard('own', card); //generate a visible card
            let opponentCard = createCard('opponent'); //generate a card with a card-back

            hand.appendChild(cardEl); //deal a visible card to the player
            opponentHand.appendChild(opponentCard); //deal a card to the opponent
        }
        // <img class="trump-card" style="background: url(images/card-back-1.png)"></img>
    }

    function disableHandTillOpponentPlays() {
        let ownHand = document.getElementById('own-hand');
        ownHand.classList.add('disabled-play');
    }

    function playCard(id) {
        let card = document.getElementById(id);
        let playField = document.getElementById('play-field');
        
        playField.appendChild(card);
        disableHandTillOpponentPlays();
        socket.emit('card played', card)
    }

    function allowDrop(ev) {
        ev.preventDefault();
        console.log('preventing')
    }
    
    function drop(ev) {
        ev.preventDefault();
        //the dataTransfer contains the id of the card which was dragged
        let id = ev.dataTransfer.getData("text");
        playCard(id);
    }

    

};