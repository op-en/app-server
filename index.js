#!/usr/bin/env node

var mqtt = require('mqtt')
var log = require('logfmt')
var http = require('http')
var qs = require('querystring')
var fs = require('fs')

var config = {
  port: process.env.PORT || 5000,
  mqtt_host: process.env.MQTT || '127.0.0.1',
  mqtt_port: process.env.MQTT_PORT || '',
  influx_mapping: process.env.INFLUX || 'data_map.json',
  influx_host: process.env.INFLUX_HOST || '127.0.0.1',
  influx_port: process.env.INFLUX_PORT || 8086,
  influx_login: process.env.INFLUX_LOGIN || 'root',
  influx_passwd: process.env.INFLUX_PASSWD || 'root',
  influx_db: process.env.INFLUX_DB || 'default',
  mqtt_login: process.env.LOGIN || '',
  mqtt_passwd: process.env.PASSWD || '',
  verbose: process.env.VERBOSE === 'true' || false
}

if (config.mqtt_port != '')
   config.mqtt_host = config.mqtt_host + ':' + config.mqtt_port



//Default mapping from enviroments variables
var data_mapping = [{"influx_host":config.influx_host,"influx_port":config.influx_port,"influx_login":config.influx_login,"influx_passwd":config.influx_passwd,"database":config.influx_db,"priority":100,"topic":"#","remapping_topic":"#"} ]
//<var data_mapping = []

//Advanced mapping form file.
fs.readFile(config.influx_mapping, 'utf8', function (err, data) {
  console.log("Data mapping loaded: ")
  if (err) {
    console.log("Missing data mapping file. Using default.")
    return
  }

  data_mapping = data_mapping.concat(JSON.parse(data))
  console.log(data_mapping)
  console.log("\n")
});



setTimeout(function () {
  console.log("Test:")
  console.log(getmapping({"topic":"#"},data_mapping))
}, 1000);

//setTimeout(function () {
//  console.log(data_mapping)
//}, 2000);
//console.log(getmapping("test/signalA",data_mapping))

function getmapping (params, mapping) {

    var topic = params.topic
    var sources = []
    var topic_hash = topic[topic.lenght-1] == "#"
    var remap_hash

    if (topic_hash)
        topic = topic.substring(0,topic.lenght-2)

    //console.log(topic)

    var nmaps = mapping.length;
    //var topic_remaps=[]

    for (var i = 0; i < nmaps; i++) {

      remap_hash = mapping[i].topic[mapping[i].topic.length-1] == "#"
      if (remap_hash) {
        remap = mapping[i].topic.substring(0,mapping[i].topic.length-2)
      }
      else {
        remap = mapping[i].topic
      }
      //Exact match
      if (!remap_hash && !topic_hash && topic == mapping[i].topic){
        //mapping[i].remapping_topic = "test"
        sources.push({"config":mapping[i],"topic":mapping[i].remapping_topic})
      }
      //With hash topic needs to includes remap current topic
      else if (remap_hash && topic.search(remap) == 0) {

        //Remove trailing /#  or single # if any
        var topic_remap = mapping[i].remapping_topic.replace("/#","").replace("#","")


        topic = topic.replace(remap,topic_remap)

        sources.push({"config":mapping[i],"topic":topic})
      }

    }

    sources.sort(function(a, b){return a.config.priority-b.config.priority})

    return sources
}

function getmap(params, mapping)
{
  var source = 0

  if (typeof params.source !== 'undefined')
    source = params.source

  var sources = getmapping(params, mapping)



  if (sources.length-1 < source)
    return null

  params.alternative_sources = sources.length - 1

  return sources[source]
}

function get(socket,params,mapping){

  //Mapping.
  var map = getmap(params,mapping)

  if (map == null) {
    socket.emit('requested', {'topic': params.topic, 'error': "No sources"})
    return -1
  }

  //Default limit
  if (typeof params.limit === 'undefined')
    params.limit = 10000

  //Basic query
  var query = "select * from \"%TOPIC%\""
  query = query.replace("%TOPIC%",map.topic)

  //We have both a to and a from parameter.
  if (typeof params.to !== 'undefined' && typeof params.from !== 'undefined') {
      query = query + " where time > %FROM% and time < %TO%"
          .replace("%FROM%",params.from * 1000000000.0)
          .replace("%TO%",params.to * 1000000000.0)
  }

  //We only a from.
  else if (typeof params.to === 'undefined' && typeof params.from !== 'undefined') {
      query = query + " where time > %FROM%"
          .replace("%FROM%",params.from * 1000000000.0)
  }

  //if (typeof params.downsample !== 'undefined')
  //    uery = query + " g"

  query = query +  " limit " + params.limit

  console.log(query)

  query = '/query?' + qs.stringify({ 'db': map.config.database, 'q':query, 'epoch':'ms'})
  //query = '/query?' + qs.stringify({ 'db': '1week', 'q':query, 'epoch':'ms'})
  //console.log(query)
  //console.log(map)
  //console.log(query)

  http.get({ host:map.config.influx_host, port:map.config.influx_port, path: query, 'auth': map.config.influx_login + ':' + map.config.influx_passwd }, function(response) {
        // Continuously update stream with data
        const { statusCode } = response;

        var body = ''
        response.on('data', function(d) {
            body += d
        })

        response.on('end', function() {
            // Data reception is done, send it to client!
            params.payload = body
            console.log(body)
            socket.emit('requested', params)
            //console.log(body)
        })

  }).on('error', (e) => {
      console.error(`Got error: ${e.message}`);
      log.log({type: 'error', msg: 'InfluxDB offline', host: config.influx_host})
  });
}

function list_topics(socket,params,mapping) {
  var map = getmap(params,mapping)

  if (map == null)
    return

  var target_topic_regex = "/" + map.topic.split("/").join("\\/") + "/"
  target_topic_regex = target_topic_regex.replace("#",".*")

  console.log(map.topic)
  console.log(target_topic_regex)

  var query = "SHOW MEASUREMENTS WITH MEASUREMENT=" + target_topic_regex

  query = '/query?' + qs.stringify({ 'db': map.config.database, 'q':query, 'epoch':'ms'})

  console.log(query)

  http.get({ host:map.config.influx_host, port:map.config.influx_port, path: query, 'auth': map.config.influx_login + ':' + map.config.influx_passwd }, function(response) {
        // Continuously update stream with data
        const { statusCode } = response;

        var body = ''
        response.on('data', function(d) {
            body += d
        })

        response.on('end', function() {
            // Data reception is done, send it to client!

            console.log(body)
            var topics = JSON.parse(body)
            if (typeof topics.results[0].series !== 'undefined')
              params.payload = topics.results[0].series[0].values
            else {
              params.payload = body
            }
            //socket.emit('requested', "hello")
            socket.emit('topics_list', params)
            //console.log(body)
        })

  }).on('error', (e) => {
      console.error(`Got error: ${e.message}`);
      log.log({type: 'error', msg: 'InfluxDB offline', host: config.influx_host})
  });
}




//SERVER STUFF

var io = require('socket.io').listen(config.port)
io.sessionid = 0
io.data_mapping = data_mapping

var host = config.mqtt_login ? config.mqtt_login + ':' + config.mqtt_passwd + '@' + config.mqtt_host : config.mqtt_host
log.log({type: 'info', msg: 'App server started', port: config.port, host: host, verbose: config.verbose})

io.set('origins', '*:*')
io.on('connection', function (socket) {
  this.sessionid = this.sessionid || 0
  this.sessionid = this.sessionid + 1
  socket.sessionid = this.sessionid
  socket.mapping =  data_mapping

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
  socket.on('subscribe', function (params) {
    broker.subscribe(params.topic)

    var topic_hash = params.topic[params.topic.lenght-1] == "#"

    //Get historical data if requested.
    if (typeof params.from !== 'undefined' && !topic_hash)
      get(params)

  })

  socket.on('request', function (params) {
    get(this,params,this.mapping)
  })


  socket.on('mqtt_subscribe', function (params) {
    broker.subscribe(params.topic)
  })

  socket.on('list_topics', function (params){
    var topics = []

    list_topics(this,params,this.mapping)

  })

  // Influx query
  socket.on('influx_query', function (params) {

    var map = getmapping(params,this.mapping)

    //data.query
    query = '/query?' + qs.stringify({ 'db': params.db, 'q':params.query, 'epoch':'ms'})

//    console.log(query)

    http.get({ host:params.influx_host, port:params.influx_port, path: query, 'auth': config.influx_login + ':' + config.influx_passwd }, function(response) {
          // Continuously update stream with data
          const { statusCode } = response;

          //let error;
          //if (statusCode !== 200) {
          //  error = new Error(`Request Failed.\n` + `Status Code: ${statusCode}`);
          //}

          //if (error) {
          //  console.error(error.message);
            // consume response data to free up memory
          //  response.resume();
          //  return;
          //}

          var body = ''
          response.on('data', function(d) {
              body += d
          })

          response.on('end', function() {
              // Data reception is done, send it to client!
              socket.emit('influx', {'topic': data.topic, 'payload': body})
              //console.log(body)
          })

    }).on('error', (e) => {
        console.error(`Got error: ${e.message}`);
        log.log({type: 'error', msg: 'InfluxDB offline', host: config.influx_host})
    });

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
