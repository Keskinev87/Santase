window.onload = main;

function main () {
    var socket = io();

    //declare variables
    let chatForm = document.getElementById('chat-form');
    let inputMsg = document.getElementById('m');
    let gameJoinBtn = document.getElementById('join-game');
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
    
    //add socket event handlers
    socket.on('chat message', function(msg){
        let messages = document.getElementById('messages');
        let message = document.createTextNode(msg);
        let msgContainer = document.createElement('li');

        msgContainer.appendChild(message);
        messages.appendChild(msgContainer);
    });

    socket.on('status-message', function(args) {
        console.log(args.message);
        room = args.room;
    })
};