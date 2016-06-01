module.exports = dragDrop

var flatten = require('flatten')
var parallel = require('run-parallel')

function dragDrop (elem, listeners) {
  if (typeof elem === 'string') {
    elem = window.document.querySelector(elem)
  }

  if (typeof listeners === 'function') {
    listeners = { onDrop: listeners }
  }

  var timeout

  elem.addEventListener('dragenter', stopEvent, false)
  elem.addEventListener('dragover', onDragOver, false)
  elem.addEventListener('dragleave', onDragLeave, false)
  elem.addEventListener('drop', onDrop, false)

  // Function to remove drag-drop listeners
  return function remove () {
    removeDragClass()
    elem.removeEventListener('dragenter', stopEvent, false)
    elem.removeEventListener('dragover', onDragOver, false)
    elem.removeEventListener('dragleave', onDragLeave, false)
    elem.removeEventListener('drop', onDrop, false)
  }

  function onDragOver (e) {
    e.stopPropagation()
    e.preventDefault()
    if (e.dataTransfer.items) {
      var items = toArray(e.dataTransfer.items)

      // Only add "drag" class when `items` contains a file
      var fileItems = items.filter(function (item) {
        return item.kind === 'file'
      })

      // Otherwise add "drag" class if `onDropText` event is present and `items` contains a string
      if (fileItems.length === 0 && !listeners.onDropText) return

      var stringItem = items.find(function (item) {
        return item.kind === 'string' && item.type === 'text/plain'
      })

      if (!stringItem) return
    }

    elem.classList.add('drag')
    clearTimeout(timeout)

    if (listeners.onDragOver) {
      listeners.onDragOver(e)
    }

    e.dataTransfer.dropEffect = 'copy'
    return false
  }

  function onDragLeave (e) {
    e.stopPropagation()
    e.preventDefault()

    if (listeners.onDragLeave) {
      listeners.onDragLeave(e)
    }

    clearTimeout(timeout)
    timeout = setTimeout(removeDragClass, 50)

    return false
  }

  function onDrop (e) {
    e.stopPropagation()
    e.preventDefault()

    if (listeners.onDragLeave) {
      listeners.onDragLeave(e)
    }

    clearTimeout(timeout)
    removeDragClass()

    var pos = {
      x: e.clientX,
      y: e.clientY
    }

    if (e.dataTransfer.items) {
      var items = toArray(e.dataTransfer.items)

      // Handle directories in Chrome using the proprietary FileSystem API
      var fileItems = items.filter(function (item) {
        return item.kind === 'file'
      })

      if (fileItems.length !== 0) {
        parallel(fileItems.map(function (item) {
          return function (cb) {
            processEntry(item.webkitGetAsEntry(), cb)
          }
        }), function (err, results) {
          // This catches permission errors with file:// in Chrome. This should never
          // throw in production code, so the user does not need to use try-catch.
          if (err) throw err
          if (listeners.onDrop) {
            listeners.onDrop(flatten(results), pos)
          }
        })
      } else if (listeners.onDropText) {
        // Handle text drop if `onDropText` event is present
        var stringItem = items.find(function (item) {
          return item.kind === 'string' && item.type === 'text/plain'
        })

        if (stringItem) {
          stringItem.getAsString(function (text) { listeners.onDropText(text, pos) })
        }
      }
    } else {
      var files = toArray(e.dataTransfer.files)

      if (files.length === 0) return

      files.forEach(function (file) {
        file.fullPath = '/' + file.name
      })

      if (listeners.onDrop) {
        listeners.onDrop(files, pos)
      }
    }

    return false
  }

  function removeDragClass () {
    elem.classList.remove('drag')
  }
}

function stopEvent (e) {
  e.stopPropagation()
  e.preventDefault()
  return false
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
