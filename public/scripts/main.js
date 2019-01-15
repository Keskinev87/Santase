var gameScene;
var socket;
var player;
window.onload = main;


function main () {
    gameScene = new GameScene();
    player = new Player();
    socket = io();
    gameScene.resizeGame();

    //ADD EVENT LISTENERS TO THE ELEMENTS  
    gameScene.addEventListeners().then(() => {
        socket.on('chat message', function(msg){
            gameScene.displayChatMsg(msg);
        });

        socket.on('status message', function(msg) {
            gameScene.displayStatusMsg(msg);
        })
    
        socket.on('room joined', function(data){
            gameScene.room = data.roomNumber;
            player.playerNumber = data.playerNumber;
        })
    
        socket.on('deal cards', function(cards) {
            gameScene.dealCards(cards);
        })

        socket.on('deal trump card', function(card) {
            gameScene.dealTrumpCard(card);
            gameScene.dealPileCards();
        })

        socket.on('play', function(cardPlayed, stage){
            player.enableOwnHand(cardPlayed, stage);
            gameScene.displayStatusMsg("Your turn...");
        })

        socket.on('wait', function(msg){
            player.disableOwnHand();
            gameScene.displayStatusMsg("Waiting for the other player...");
        })

        socket.on('draw card', function(card) {
            player.drawPileCard(card);
        })

        socket.on('opponent plays', function(card){
            gameScene.showOpponentsCard(card);
        })

        socket.on('collect cards', function(){
            player.collectCards();
        })

        socket.on('update points', function(data){
            //data includes player number and points
            gameScene.updatePoints(data)
        })

        socket.on('clear play area', function(){
            gameScene.clearPlayArena();
        })
    
        socket.on('error', function(error) {
            window.alert(error);
        })
    })
    
};