module.exports = DragDropAsBuffer

var dragDrop = require('./')
var parallel = require('run-parallel')
var toBuffer = require('blob-to-buffer')

function DragDropAsBuffer (elem, cb) {
  dragDrop(elem, function (files, pos) {
    var tasks = files.map(function (file) {
      return function (cb) {
        toBuffer(file, function (err, buffer) {
          if (err) return cb(err)
          buffer.name = file.name
          buffer.size = file.size
          buffer.type = file.type
          buffer.lastModifiedDate = file.lastModifiedDate
          cb(null, buffer)
        })
      }
    })
    parallel(tasks, function (err, results) {
      if (err) throw err
      cb(results, pos)
    })
  })
}
