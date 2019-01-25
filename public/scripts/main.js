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
            let opponentsNameHolder = document.getElementById('opp-name');

            opponentsNameHolder.innerHTML = data.opponentsNickName;
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
            gameScene.displayStatusMsg("Ваш ред е...");
        })

        socket.on('wait', function(msg){
            player.disableOwnHand();
            gameScene.displayStatusMsg("Изчакване на другия играч...");
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

        socket.on('announcement', function(name, points){
            gameScene.announce(`${name} обявява ${points}`)
            let opponent = player.playerNumber == 'player1' ? 'player2' : 'player1';
            gameScene.updatePoints({player: opponent, points:points});
        })

        socket.on('clear trump', function(){
            gameScene.clearTrumpArea();
        })

        socket.on('trump card changed', function(card){
            gameScene.swapTrump(card);
        })

        socket.on('end round', function(winner){
            gameScene.resetRound(winner);
        })

        socket.on('enable trump change', function(swapCard){
            player.swapCard = swapCard;
            gameScene.allowTrumpChange();
        })

        socket.on('closed', function(name){
            gameScene.handleClosed(name);
        })

        socket.on('game won', function(playerWon) {
            gameScene.announce(playerWon.nickName + " печели играта");
            gameScene.awardGamePoints(playerWon);
        })
    
        socket.on('error', function(error) {
            window.alert(error);
        })
    })
    
};