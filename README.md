# node-rtsp-stream-jsmpeg

First of all, it's a based on  [**node-rtsp-stream-es6**](https://github.com/Wifsimster/node-rtsp-stream-es6) and [**node-rtsp-stream**]

## Differences with the original modules

- Code based on official documentation of https://github.com/phoboslab/jsmpeg for server side decoding video

## Description

Stream any RTSP stream and output to [WebSocket](https://github.com/websockets/ws) for consumption by [jsmpeg](https://github.com/phoboslab/jsmpeg).
HTML5 streaming video!

## Requirements

You need to download and install [FFMPEG](https://ffmpeg.org/download.html) in server-side.

##Installation

```
npm i node-rtsp-stream-jsmpeg
```

## Server

```
const Stream = require('node-rtsp-stream-jsmpeg')

const options = {
  name: 'streamName',
  url: 'rtsp://184.72.239.149/vod/mp4:BigBuckBunny_115k.mov',
  wsPort: 3333
}

stream = new Stream(options)
stream.start()
```


## Client

```
<!DOCTYPE html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <title>DEMO node-rtsp-stream-jsmpeg</title>
  <script src="https://jsmpeg.com/jsmpeg.min.js"></script>
</head>
<body>
  <div>
    <canvas id="video-canvas">
    </canvas>
  </div>

  <script type="text/javascript">
  var url = ws://localhost:3333;
  var canvas = document.getElementById('video-canvas');
  var player = new JSMpeg.Player(url, {canvas: canvas});
  </script>
</body>
```

You can find a live stream JSMPEG example here : https://github.com/phoboslab/jsmpeg/blob/master/stream-example.html
