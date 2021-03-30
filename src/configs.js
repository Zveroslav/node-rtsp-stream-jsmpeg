const genFfmpegFormatConfigs = (url, port, width, height) =>
  ["-rtsp_transport", "tcp", "-i", url, '-f', 'mpegts', '-codec:v', 'mpeg1video', '-s', `${width}x${height}`, '-b:v', '800k', '-r', '30', '-muxdelay', '0.4', `http://localhost:${port}/s1`];

module.exports = {genFfmpegFormatConfigs}