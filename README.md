EventServer
===========

Socket.IO server that allows access to an MQTT broaker. 


<script type="text/javascript" src="socket.io.min.js"></script>
<script type="text/javascript" src="jquery-1.4.2.js"></script>
<script type="text/javascript">
  var socket = io.connect('http://localhost:5000');
    socket.on('connect', function () {
      socket.on('mqtt', function (msg) {
        var elmarr=msg.topic.split("/");
        var elm=elmarr[3];
        console.log(msg.topic+' '+msg.payload);
        
     });
     socket.emit('subscribe',{topic:'/sensor/OTGW/returntemp'});
     
    });
</script>


The appserver connects using username appserver (change the password in the code).

When new clients conntect to the server it publish a "Connected" message att on the MQTT path AppServer/session/N/

When the clients publish by:

    socket.emit('publish',{topic:'/path',payload:'test'});

The message ("test") will be sent to the path AppServer/session/{N}/{path} 


