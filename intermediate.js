var getTiles = require('./lib/image-tiles')
var loader = require('async-image-loader')
var Emitter = require('events').EventEmitter

module.exports = loadEquirectangular
function loadEquirectangular (id, opt) {
  opt = opt || {}
  var data = getTiles(id, opt.zoom, opt.tiles)

  var canvas = document.createElement('canvas')
  var context = canvas.getContext('2d')
  var emitter = new Emitter()
  var images = data.images
  var zero = [0, 0]
  var tileWidth = data.tileWidth
  var tileHeight = data.tileHeight

  process.nextTick(start)
  return emitter

  function done () {
    emitter.emit('complete')
  }

  function start () {
    emitter.emit('start', data)
    loader(images, { crossOrigin: opt.crossOrigin }, done)
      .on('not-found', function (tile) {
        emitter.emit('not-found', tile.url)
      })
      .on('progress', function (ev) {
        var tile = ev.tile
        var position = tile.position || zero
        var x = position[0]
        var y = position[1]
        var width = Math.min(tileWidth, data.width - x, data.width)
        var height = Math.min(tileHeight, data.height - y, data.height)

        // if we need to "crop" the image, or if the image wasn't found,
        // we will use an intermediate canvas
        var image = ev.image
        if (!image || width !== image.width || height !== image.height) {
          canvas.width = width
          canvas.height = height
          context.clearRect(0, 0, width, height)

          // if the image exists, blit it
          if (ev.image) {
            context.drawImage(ev.image, 0, 0)
          }

          image = canvas
        }

        emitter.emit('progress', {
          count: ev.count,
          total: ev.total,
          position: position,
          image: image
        })
      })
  }
}