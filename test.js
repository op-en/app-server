/* global describe, it */
var expect = require('expect.js')
var io = require('socket.io-client')

var config = {
  host: process.env.HOST || 'http://localhost:5000'
}

describe('App server', function () {
  it('connects to the app-server', function (done) {
    var socket = io.connect(config.host, {multiplex: false})
    socket.on('connect', () => {
      console.log('connect')
      // We don't need to close the socket manually, but it's nice. Be nice!
      socket.disconnect()
      done()
    })
  })

  it('subscribes to a topic', function (done) {
    var socket = io.connect(config.host, {multiplex: false})
    socket.on('connect', function () {
      this.emit('subscribe', {topic: '#'})
    })
    socket.on('mqtt', function (data) {
      expect(data).to.not.eql(null)
      expect(data).to.have.property('payload', 'Connected')
      socket.disconnect()
      done()
    })
  })

  it('has a working cors')
})
