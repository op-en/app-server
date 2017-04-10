#!/usr/bin/env node

var mqtt = require('mqtt')
var log = require('logfmt')
var http = require('http')

var config = {
  port: process.env.PORT || 5000,
  mqtt_host: process.env.MQTT || '127.0.0.1',
  influx_host: process.env.INFLUX || '127.0.0.1:8086',
  influx_login: process.env.INFLUX_LOGIN || 'root',
  influx_passwd: process.env.INFLUX_PASSWD || 'root',
  mqtt_login: process.env.LOGIN || '',
  mqtt_passwd: process.env.PASSWD || '',
  verbose: process.env.VERBOSE === 'true' || false
}

var io = require('socket.io').listen(config.port)
io.sessionid = 0

var host = config.mqtt_login ? config.mqtt_login + ':' + config.mqtt_passwd + '@' + config.mqtt_host : config.mqtt_host
log.log({type: 'info', msg: 'App server started', port: config.port, host: host, verbose: config.verbose})

io.set('origins', '*:*')
io.on('connection', function (socket) {
  this.sessionid = this.sessionid || 0
  this.sessionid = this.sessionid + 1
  socket.sessionid = this.sessionid
  log.log({type: 'info', msg: 'User connected', session: this.sessionid})

  // Connect to the MQTT broker
  var broker = mqtt.connect('mqtt://' + host)
  broker.on('error', function (error) {
    log.log({type: 'error', msg: error.message})
  })

  // This is what you get when the connection to the broker fails
  broker.on('offline', function (error) {
    if (error) console.log(error)
    log.log({type: 'error', msg: 'MQTT offline', host: config.mqtt_host})
  })

  if (config.verbose) {
    broker.on('connect', function (error) {
      if (error) console.log(error)
      log.log({type: 'info', msg: 'MQTT connected', host: config.mqtt_host})
    })

    broker.on('close', function (error) {
      if (error) console.log(error)
      log.log({type: 'info', msg: 'MQTT closed', host: config.mqtt_host})
    })
  }

  broker.subscribe('appserver/session/' + socket.sessionid + '/#')
  broker.subscribe('appserver/session/all/#')
  // Temp fix
  // socket.mqtt.subscribe('#')
  broker.publish('appserver/session/' + socket.sessionid, 'Connected')

  // Subscribe
  socket.on('subscribe', function (data) {
    broker.subscribe(data.topic)
  })

  socket.on('mqtt_subscribe', function (data) {
    broker.subscribe(data.topic)
  })

  // Influx query
  socket.on('influx_query', function (data) {
    //data.query
    query = '/query?db=%DATABASE%&q=%QUERY%'
          .replace("%DATABASE%","1week")
          .replace("%QUERY%",data.query)


    http.get({ host: influx_host, path: query, 'auth': influx_login + ':' + influx_passwd }, function(response) {
          // Continuously update stream with data
          var body = ''
          response.on('data', function(d) {
              body += d
          })

          response.on('end', function() {
              // Data reception is done, send it to client!
              socket.emit('influx', {'topic': data.topic, 'payload': body})
          })

    })
  })


  // Forward all mqtt messages to socket.io
  broker.on('message', function (topic, message) {
    socket.emit('mqtt', {'topic': String(topic), 'payload': String(message)})
  })

  // Publish
  socket.on('publish', function (data) {
    var topic = data.topic.replace("~/",'appserver/session/' + this.sessionid + '/')
    broker.publish(topic, data.payload)
  })

  // Disconnection
  socket.on('disconnect', function () {
    log.log({type: 'info', msg: 'User disconnected', session: this.sessionid})
    broker.publish('appserver/session/' + socket.sessionid, 'Disconnected')
    broker.end()
  })
})

process.on('SIGTERM', function () {
  log.log({type: 'info', msg: 'SIGTERM: Shutting down'})
  process.exit(0)
})
