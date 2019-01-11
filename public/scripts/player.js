class Player {
    constructor() {
        this.playField = document.getElementById('play-arena');
    }

    playCard(id) {
        let card = document.getElementById(id);
        
        this.playField.appendChild(card);
        gameScene.disableOwnHand();
        socket.emit('card played', {room: gameScene.room, card: card});
    }
}