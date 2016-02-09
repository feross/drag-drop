module.exports = dragDrop

var flatten = require('flatten')
var parallel = require('run-parallel')

function dragDrop (elem, listeners) {
  if (typeof elem === 'string') elem = window.document.querySelector(elem)
  if (typeof listeners === 'function') listeners = { onDrop: listeners }

  var onDragOver = makeOnDragOver(elem, listeners.onDragOver)
  var onDragLeave = makeOnDragLeave(elem, listeners.onDragLeave)
  var onDrop = makeOnDrop(elem, listeners.onDrop, listeners.onDragLeave)

  elem.addEventListener('dragenter', stopEvent, false)
  elem.addEventListener('dragover', onDragOver, false)
  elem.addEventListener('dragleave', onDragLeave, false)
  elem.addEventListener('drop', onDrop, false)

  // Function to remove drag-drop listeners
  return function remove () {
    if (elem instanceof window.Element) elem.classList.remove('drag')
    elem.removeEventListener('dragenter', stopEvent, false)
    elem.removeEventListener('dragover', onDragOver, false)
    elem.removeEventListener('dragleave', onDragLeave, false)
    elem.removeEventListener('drop', onDrop, false)
  }
}

function stopEvent (e) {
  e.stopPropagation()
  e.preventDefault()
  return false
}

function makeOnDragOver (elem, ondragover) {
  return function (e) {
    e.stopPropagation()
    e.preventDefault()
    if (elem instanceof window.Element) elem.classList.add('drag')
    e.dataTransfer.dropEffect = 'copy'
    if (ondragover) ondragover(e)
    return false
  }
}

function makeOnDragLeave (elem, ondragleave) {
  return function (e) {
    if (e.target !== elem) {
      var parent = e.target
      while (parent !== elem) parent = parent.parentNode
      if (!parent) return
    }
    e.stopPropagation()
    e.preventDefault()
    if (ondragleave) ondragleave(e)
    if (elem instanceof window.Element) elem.classList.remove('drag')
    return false
  }
}

function makeOnDrop (elem, ondrop, ondragleave) {
  return function (e) {
    e.stopPropagation()
    e.preventDefault()
    if (ondragleave) ondragleave(e)
    if (elem instanceof window.Element) elem.classList.remove('drag')
    var pos = { x: e.clientX, y: e.clientY }
    if (e.dataTransfer.items) {
      // Handle directories in Chrome using the proprietary FileSystem API
      var items = toArray(e.dataTransfer.items).filter(function (item) {
        return item.kind === 'file'
      })
      if (items.length === 0) return
      parallel(items.map(function (item) {
        return function (cb) {
          processEntry(item.webkitGetAsEntry(), cb)
        }
      }), function (err, results) {
        // There should never be an error in production code. This catches permission
        // errors with file:// in Chrome.
        if (err) throw err
        ondrop(flatten(results), pos)
      })
    } else {
      var files = toArray(e.dataTransfer.files)
      if (files.length === 0) return
      files.forEach(function (file) {
        file.fullPath = '/' + file.name
      })
      ondrop(files, pos)
    }

    return false
  }
}

function processEntry (entry, cb) {
  var entries = []

  if (entry.isFile) {
    entry.file(function (file) {
      file.fullPath = entry.fullPath  // preserve pathing for consumer
      cb(null, file)
    }, function (err) {
      cb(err)
    })
  } else if (entry.isDirectory) {
    var reader = entry.createReader()
    readEntries()
  }

  function readEntries () {
    reader.readEntries(function (entries_) {
      if (entries_.length > 0) {
        entries = entries.concat(toArray(entries_))
        readEntries() // continue reading entries until `readEntries` returns no more
      } else {
        doneEntries()
      }
    })
  }

  function doneEntries () {
    parallel(entries.map(function (entry) {
      return function (cb) {
        processEntry(entry, cb)
      }
    }), cb)
  }
}

function toArray (list) {
  return Array.prototype.slice.call(list || [], 0)
}
