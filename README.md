# Open Energy App Server/proxy

This is part of the [Open Energy Project](http://op-en.se/), a research project aiming to make it easier and faster to prototype smart energy services.

[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)

## Description

This Node.js proxy is a bridge from MQTT and influx databases to websockets using socket.io. The server is proxy to an MQTT broker and relays all messages that the connected client requests. I can also pull hitorical data from one or several influx databases. 

If messages are published to the server, they are forwarded to the MQTT broker under the 'appserver/session/[id]' topic.

## Installation
The easiest way to install the proxy is to use docker. It can also be installed with npm (node.js packet manager).

```
npm install -g op-en-app-server
```
To install the proxy as a docker container with docker and docker-compose installed copy the following to a docker-compose.yml file

```
app-server:
  image: openenergy/app-server:version2
  restart: always
  ports:
    - "5000:5000"
  links:
    - mosquitto:mqtt
    - influx:influx
  environment:
    - LOGIN=mqtt_username
    - PASSWD=mysecret_mqtt_password
    - INFLUX_HOST=influx
    - INFLUX_DB=databasename
    - INFLUX_PORT=8086
    - INFLUX=/opt/cfg/data_map.json
  volumes:
    - appserver:/opt/cfg
    
influx:
  image: influxdb:latest
  restart: always
  mem_limit: 6500000000
  volumes:
    - ./data/influxdbbackup:/var/lib/influxdb
  ports:
    - '8083:8083'
    - '8086:8086'
  environment:
    - INFLUXDB_HTTP_LOG_ENABLED=false
  container_name: influxdb
  
mosquitto:
  image: openenergy/mosquitto
  restart: always
  volumes:
    - ./settings/mosquitto:/etc/mosquitto
  ports:
    - '1883:1883'
    
```

and run 

```
docker-compose up -d 
```
If your influx or MQTT serveces are locate elsewhere outside docker adjust enviroment variables. 




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
socket.emit('publish',{topic:'~/path',payload:'test'});
```

When the "~/path" is used in a topic the message ("test") will be sent to the path appserver/session/{N}/{path}

Where N is the session id and path the topic in the emit command.

Topics without "~/" works normally however depending on the appservers credentials broaker configuration all paths might not be readable.  

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
