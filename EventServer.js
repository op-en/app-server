var sys = require('sys');
var net = require('net');
//var mqtt = require('mqtt');

var io  = require('socket.io').listen(5000);



var mqtt = require('mqtt')
  , client = mqtt.createClient();

client.subscribe('#');
//client.publish('messages', 'hello me!');
client.on('message', function(topic, message) {
  console.log(message);
  io.sockets.emit('mqtt',{'topic':String(topic),'payload':String(message)});
});
