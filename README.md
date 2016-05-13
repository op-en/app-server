# Open Energy App Server

This is part of the [Open Energy Project](http://op-en.se/), a research project aiming to make it easier and faster to prototype smart energy services.

[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)

## Description

This Node.js server is a bridge from MQTT to websockets using socket.io. The server is connected to an MQTT broker and relays all messages that the connected client requests.

If messages are published to the server, they are forwarded to the MQTT broker under the 'appserver/session/[id]' topic.

## Installation

```
npm install -g op-en-app-server
```

## Configuration

All configuration of the server is done via environment variables, as compliant with a [12 factor app](http://12factor.net/config).

See index.js for default config.

## Starting the server

When installed as a global package, the server can simply be started by running:
```
op-en-app-server
```

## Client example

Client example using socket.io client in a web app:
```
var socket = io.connect('http://localhost:5000');
socket.on('connect', function () {
  socket.on('mqtt', function (msg) {
    console.log(msg.topic+' '+msg.payload);
  });
  socket.emit('subscribe',{topic:'/some/sensor/data'});
});
```
When new clients connect to the server it publishes a "Connected" message on the MQTT path appserver/session/N/

When the clients publish by:

```
socket.emit('publish',{topic:'/path',payload:'test'});
```

The message ("test") will be sent to the path AppServer/session/{N}/{path}

Where N is the session id and path the topic in the emit command.

## Testing

For development, there is a suite of Mocha unit tests, run them with

```
npm test
```

The test suite can also be run to ensure that the server is running and responding correctly in a different environment (like. remote server, docker, virtual machine etc.). In that case, the environment variable HOST specifies what server to test.

So if you want to test a server on the url op-en.se on port 5000 for example, you would run:

```
env HOST=http://op-en.se:5000 npm test
```
