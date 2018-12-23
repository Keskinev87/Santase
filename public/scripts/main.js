window.onload = main;

function main () {
    var socket = io();

    //declare variables
    let chatForm = document.getElementById('chat-form');
    let inputMsg = document.getElementById('m');
    let gameJoinBtn = document.getElementById('join-game');
    let readyBtn = document.getElementById('btn-ready')
    let room = '';
    let status = '';
    
    //add event listeners
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
    
    //add socket event handlers
    socket.on('chat message', function(msg){
        let messages = document.getElementById('messages');
        let message = document.createTextNode(msg);
        let msgContainer = document.createElement('li');

        msgContainer.appendChild(message);
        messages.appendChild(msgContainer);
    });

    socket.on('status-message', function(status) {
        console.log(status)
        switch (status) {
            case 'starting': {
                console.log('Game starting')
            }
            default: break
        }
    })

    socket.on('dealt cards', function(cards) {
        console.log(cards)
        dealCards(cards)
    })

    socket.on('error', function(error) {
        window.alert(error)
    })

    function createCard(type, card) {
        // <img id="home" src="img_trans.gif" width="1" height="1"><br><br></br>;
        // width: 46px;
        // height: 44px;
        // background: url(img_navsprites.gif) 0 0;
        // 80 x 117
        if(type=='own') {
            let newCard = document.createElement('img')
            let posHor = (card.posHor-1) * -80 - (card.posHor - 1);
            let posVer = (card.posVer-1) * -117;
            let id = card.number + card.suit[0]
            // let imgUrl = ;
            // console.log(imgUrl)
            // newCard.setAttribute('src', 'images/transparent.png');
            newCard.classList.add('card');
            newCard.setAttribute('draggable', 'true')
            newCard.setAttribute('id', id)
            newCard.ondragstart = drag(event)
            newCard.style.background = 'url(images/cards.gif) ' + posHor + 'px ' + posVer + 'px';
    
            return newCard
        } else if(type =="opponent") {
            let newCard = document.createElement('img')
            // let imgUrl = ;
            // console.log(imgUrl)
            // newCard.setAttribute('src', 'images/transparent.png');
            newCard.classList.add('card');
            newCard.style.background = 'url(images/card-back-1.jpg)'

            return newCard;
        }
        
    }

    function dealCards(cards) {
        let hand = document.getElementById('own-hand');
        let opponentHand = document.getElementById('opponent-hand');
        for (let card of cards) {
            let cardEl = createCard('own', card);
            let opponentCard = createCard('opponent');
            opponentCard.style.background = 'url(images/card-back-1.png)';
            hand.appendChild(cardEl);
            opponentHand.appendChild(opponentCard);
        }
        // <img class="trump-card" style="background: url(images/card-back-1.png)"></img>

    }

};