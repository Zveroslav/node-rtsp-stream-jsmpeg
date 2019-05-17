const WebSocket = require('ws');
const EventEmitter = require('events');
const http = require('http');
const STREAM_MAGIC_BYTES = "jsmp";
const Mpeg1Muxer = require('./mpeg1muxer');

class VideoStream extends EventEmitter {

  constructor(options) {
    super(options)
    this.name = options.name
    this.url = options.url
    this.width = options.width
    this.height = options.height
    this.wsPort = options.wsPort
    this.port = options.port || this.getPortForMiddlewareServer(options.wsPort)
    this.stream = 0
    this.httpServer = null
    this.server = null

    this.stream2Socket()
  }

  stream2Socket() {
    var socketServer = new WebSocket.Server({port: this.wsPort, perMessageDeflate: false});

    socketServer.connectionCount = 0;
    socketServer.on('connection', function(socket, upgradeReq) {
      socketServer.connectionCount++;
      console.log(
        'New WebSocket Connection: ',
        (upgradeReq || socket.upgradeReq).socket.remoteAddress,
        (upgradeReq || socket.upgradeReq).headers['user-agent'],
        '('+socketServer.connectionCount+' total)'
      );
      socket.on('close', function(code, message){
        socketServer.connectionCount--;
        console.log(
          'Disconnected WebSocket ('+socketServer.connectionCount+' total)'
        );
      });
    });
    socketServer.broadcast = function(data) {
      socketServer.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(data);
        }
      });
    };


    // HTTP Server to accept incomming MPEG-TS Stream from ffmpeg
    var streamServer = http.createServer( function(request, response) {
      var params = request.url.substr(1).split('/');

      if (params[0] !== 's1') {
        console.log(
          'Failed Stream Connection: '+ request.socket.remoteAddress + ':' +
          request.socket.remotePort + ' - wrong secret.'
        );
        response.end();
      }
      response.connection.setTimeout(0);
      console.log(
        'Stream Connected: ' +
        request.socket.remoteAddress + ':' +
        request.socket.remotePort
      );

      request.on('data', function(data){
        socketServer.broadcast(data);
        if (request.socket.recording) {
          request.socket.recording.write(data);
        }
      });
      request.on('end',function(){
        console.log('close');
        if (request.socket.recording) {
          request.socket.recording.close();
        }
      });

    });

    streamServer = require('http-shutdown')(streamServer);
    streamServer.listen(this.port);

    this.server = socketServer;
    this.httpServer = streamServer;
  }

  onSocketConnect(socket) {
    let streamHeader = new Buffer(8)
    streamHeader.write(STREAM_MAGIC_BYTES)
    streamHeader.writeUInt16BE(this.width, 4)
    streamHeader.writeUInt16BE(this.height, 6)
    socket.send(streamHeader, { binary: true })
    console.log(`New connection: ${this.name} - ${this.wsServer.clients.length} total`)
    return socket.on("close", function(code, message) {
      return console.log(`${this.name} disconnected - ${this.wsServer.clients.length} total`)
    })
  }

  start() {
    this.mpeg1Muxer = new Mpeg1Muxer({ url: this.url, port: this.port })
    this.mpeg1Muxer.on('mpeg1data', (data) => { return this.emit('camdata', data) })

    let gettingInputData = false
    let gettingOutputData = false
    let inputData = []
    let outputData = []

    this.mpeg1Muxer.on('ffmpegError', (data) => {
      data = data.toString()
      if (data.indexOf('Input #') !== -1) { gettingInputData = true }
      if (data.indexOf('Output #') !== -1) {
        gettingInputData = false
        gettingOutputData = true
      }
      if (data.indexOf('frame') === 0) { gettingOutputData = false }
      if (gettingInputData) {
        inputData.push(data.toString())
        let size = data.match(/\d+x\d+/)
        if (size != null) {
          size = size[0].split('x')
          if (this.width == null) { this.width = parseInt(size[0], 10) }
          if (this.height == null) { return this.height = parseInt(size[1], 10) }
        }
      }
    })
    this.mpeg1Muxer.on('ffmpegError', (data) => { return global.process.stderr.write(data) })
    return this
  }



  stop() {
      this.server.close();
      this.httpServer.shutdown(function() {})
  }

  getPortForMiddlewareServer(wsPort){
    let lustNumberPort = wsPort.toString().slice(-1),
      middlewareServerPort = wsPort.toString().slice(0, -1)
    lustNumberPort = Number(lustNumberPort) + 1 < 10 ? Number(lustNumberPort) + 1 : Number(lustNumberPort) - 1
    return middlewareServerPort + lustNumberPort
  }
}

module.exports = VideoStream
