module.exports = DragDropAsBuffer

var toBuffer = require('typedarray-to-buffer') // efficient typedarray to buffer
var dragDrop = require('./')
var parallel = require('run-parallel')

function DragDropAsBuffer (elem, cb) {
  dragDrop(elem, function (files, pos) {
    var tasks = files.map(function (file) {
      return function (cb) {
        var reader = new FileReader()
        reader.addEventListener('load', function (e) {
          cb(null, {
            name: file.name,
            size: file.size,
            type: file.type,
            lastModifiedDate: file.lastModifiedDate,
            buffer: toBuffer(new Uint8Array(e.target.result))
          })
        })
        reader.addEventListener('error', cb)
        reader.readAsArrayBuffer(file)
      }
    })
    parallel(tasks, function (err, results) {
      if (err) throw err
      cb(results, pos)
    })
  })
}
