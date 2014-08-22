var socket = require('socket.io-client')('http://localhost:5000');

socket.on('connect', function(data){
        console.log("Connected");
	this.emit("subscribe",{topic:'#'} )
});


socket.on('mqtt', function(data){
	console.log(data);
});
