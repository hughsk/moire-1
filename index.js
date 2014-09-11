var canvas      = document.body.appendChild(document.createElement('canvas'))
var camera      = require('canvas-orbit-camera')(canvas)
var perspective = require('gl-matrix').mat4.perspective
var rotateX     = require('gl-matrix').quat.rotateX
var rotateY     = require('gl-matrix').quat.rotateY
var rotateZ     = require('gl-matrix').quat.rotateZ
var identity    = require('gl-matrix').quat.identity
var Analyser    = require('web-audio-analyser')
var Texture2d   = require('gl-texture2d')
var Buffer      = require('gl-buffer')
var ndarray     = require('ndarray')
var glslify     = require('glslify')
var VAO         = require('gl-vao')

var gl = require('gl-context')(canvas, render)
var scale = window.devicePixelRatio || 1

gl.getExtension('OES_texture_float')

window.addEventListener('resize'
  , require('canvas-fit')(canvas, null, scale)
  , false
)

var POINTS = 25000

var analyser
var daudio = new Uint8Array(512)
var faudio = new Float32Array(512 * 4)
var naudio = ndarray(faudio, [512, 1, 4])
var taudio = Texture2d(gl, [512, 1], null, gl.FLOAT)
var proj = new Float32Array(16)
var view = new Float32Array(16)
var data = new Float32Array(POINTS)
for (var i = 0; i < data.length; i++) data[i] = i

taudio.minFilter = gl.LINEAR
taudio.magFilter = gl.LINEAR

var line = VAO(gl, [{
  buffer: Buffer(gl, data)
  , size: 1
  , type: gl.FLOAT
}])

var start  = Date.now()
var shader = glslify({
    vert: './line.vert'
  , frag: './line.frag'
})(gl)

camera.distance = 5

var audio = new Audio

require('soundcloud-badge')({
    client_id: 'ded451c6d8f9ff1c62f72523f49dab68'
  , song: 'https://soundcloud.com/coltongorg/floating'
  , getFonts: true
}, function(err, src, data) {
  if (err) throw err

  audio.addEventListener('canplay', function() {
    if (analyser) return
    audio.play()
    analyser = Analyser(audio)
  }, false)

  audio.src  = src
  audio.addEventListener('ended', function() {
    console.log('ended')
    audio.currentTime = 0
    audio.play()
  }, false)
})

function render() {
  var width  = canvas.width
  var height = canvas.height
  var time = (Date.now() - start) * 0.08

  if (analyser) {
    analyser.waveform(daudio)
    for (var i = 0, n = 0; i < 512; i++) {
      var o = faudio[n]
      var N = (daudio[i] - 127)
      faudio[n++] =
      faudio[n++] =
      faudio[n++] =
      faudio[n++] = o + (N - o) * 0.0025
    }
    taudio.setPixels(naudio)
  }

  gl.disable(gl.BLEND)
  gl.viewport(0, 0, width, height)
  gl.clearColor(1, 1, 1, 1)
  gl.clearDepth(true)
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
  gl.enable(gl.BLEND)
  gl.blendFunc(gl.DST_COLOR, gl.ZERO)
  gl.lineWidth(scale > 1 ? 3 : 1)

  identity(camera.rotation)
  rotateX(camera.rotation, camera.rotation, 0.0050 * time)
  rotateY(camera.rotation, camera.rotation, 0.0062 * time)
  rotateZ(camera.rotation, camera.rotation, 0.0046 * time)
  camera.view(view)
  camera.tick()
  perspective(proj
    , Math.PI / 4
    , width / height
    , 0.001
    , 100
  )

  shader.bind()
  shader.uniforms.view = view
  shader.uniforms.proj = proj
  shader.uniforms.time = time
  shader.uniforms.audio = taudio.bind(0)
  shader.uniforms.rings[0].radius = 1
  shader.uniforms.rings[0].spin = [0.2, 0.1]
  shader.uniforms.rings[0].speed = 0.00001
  shader.uniforms.rings[0].movement = 0.1

  shader.uniforms.rings[1].radius = 0
  shader.uniforms.rings[1].spin = [0.052, 0.05]
  shader.uniforms.rings[1].speed = 0.0002
  shader.uniforms.rings[1].movement = 0.1

  line.bind()
  line.draw(gl.LINE_STRIP, data.length / 2)
}
