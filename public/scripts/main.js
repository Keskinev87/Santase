var gameScene;
var socket;
var player;
window.onload = main;


function main () {
    gameScene = new GameScene();
    player = new Player();
    socket = io();

    //ADD EVENT LISTENERS TO THE ELEMENTS  
    gameScene.addEventListeners().then(() => {
        socket.on('chat message', function(msg){
            gameScene.displayChatMsg(msg);
        });

        socket.on('status message', function(msg) {
            gameScene.displayStatusMsg(msg)
        })
    
        socket.on('room joined', function(assignedRoom){
            gameScene.room = assignedRoom;
        })
    
        socket.on('deal cards', function(cards) {
            console.log(cards);
            gameScene.dealCards(cards);
        })

        socket.on('deal trump card', function(card) {
            gameScene.dealTrumpCard(card);
        })

        socket.on('play', function(msg){
            gameScene.enableOwnHand();
            gameScene.displayStatusMsg(msg);
        })

        socket.on('wait', function(msg){
            gameScene.disableOwnHand();
            gameScene.displayStatusMsg(msg);
        })
    
        socket.on('error', function(error) {
            window.alert(error);
        })
    })
    
};