AppServer
===========

Socket.IO server that allows access to an MQTT broaker. 

    var socket = io.connect('http://localhost:5000');
      socket.on('connect', function () {
        socket.on('mqtt', function (msg) {
          var elmarr=msg.topic.split("/");
          var elm=elmarr[3];
          console.log(msg.topic+' '+msg.payload);
        });
        socket.emit('subscribe',{topic:'/sensor/OTGW/returntemp'});
    }); 

 

The appserver connects using username appserver (change the password in the code).

When new clients conntect to the server it publish a "Connected" message att on the MQTT path AppServer/session/N/

When the clients publish by:

    socket.emit('publish',{topic:'/path',payload:'test'});

The message ("test") will be sent to the path AppServer/session/{N}/{path} 


