var sys = require('sys');
var net = require('net');
//var mqtt = require('mqtt');
var mqtt = require('mqtt');

var io  = require('socket.io').listen(5000);

io.on('connection', function(socket){
  console.log('a user connected');

  socket.mqtt = mqtt.createClient();
  socket.mqtt.subscribe('#');

  //Forward all messages to socket.io
  socket.mqtt.on('message', function(topic, message) {
    console.log(message);
    io.sockets.emit('mqtt',{'topic':String(topic),'payload':String(message)});
  });

  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
});

//client = mqtt.createClient();

//client.subscribe('#');
//client.publish('messages', 'hello me!');
//client.on('message', function(topic, message) {
//  console.log(message);
//  io.sockets.emit('mqtt',{'topic':String(topic),'payload':String(message)});
//});
