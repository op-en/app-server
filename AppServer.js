var sys = require('sys');
var net = require('net');
//var mqtt = require('mqtt');
//var mqtt = require('mqtt');
var io  = require('socket.io').listen(5000);

io.sessionid = 0;

io.on('connection', function(socket){
  console.log('a user connected');
  this.sessionid = this.sessionid || 0;
  this.sessionid = this.sessionid + 1;
  socket.sessionid = this.sessionid

  var mqtt = require('mqtt');
  socket.mqtt = mqtt.connect('mqtt://appserver:sde32dDDgl3234@127.0.0.1');
  socket.mqtt.subscribe('appserver/session/' + socket.sessionid + "/#");
  socket.mqtt.subscribe('appserver/session/all/#');
  //Temp fix
  //socket.mqtt.subscribe('#');
  socket.mqtt.publish('appserver/session/' + socket.sessionid,"Connected")

  //Subscribe
  socket.on('subscribe', function(data) {
    this.mqtt.subscribe(data.topic);    
  });

  //Forward all mqtt messages to socket.io
  socket.mqtt.on('message', function(topic, message) {
    //console.log(message);
    socket.emit('mqtt',{'topic':String(topic),'payload':String(message)});
  });

  //Publish 
  socket.on('publish', function(data) {
    this.mqtt.publish('appserver/session/' + this.sessionid + "/" + data.topic,data.payload);
  });

  //Disconnection
  socket.on('disconnect', function(){
    console.log('user disconnected');
    socket.mqtt.publish('appserver/session/' + socket.sessionid,"Disconnected")
    this.mqtt.end()
  });
});

//client = mqtt.createClient();

//client.subscribe('#');
//client.publish('messages', 'hello me!');
//client.on('message', function(topic, message) {
//  console.log(message);
//  io.sockets.emit('mqtt',{'topic':String(topic),'payload':String(message)});
//});
