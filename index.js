module.exports = dragDrop

const parallel = require('run-parallel')

function dragDrop (elem, listeners) {
  if (typeof elem === 'string') {
    const selector = elem
    elem = window.document.querySelector(elem)
    if (!elem) {
      throw new Error(`"${selector}" does not match any HTML elements`)
    }
  }

  if (!elem) {
    throw new Error(`"${elem}" is not a valid HTML element`)
  }

  if (typeof listeners === 'function') {
    listeners = { onDrop: listeners }
  }

  let timeout

  elem.addEventListener('dragenter', onDragEnter, false)
  elem.addEventListener('dragover', onDragOver, false)
  elem.addEventListener('dragleave', onDragLeave, false)
  elem.addEventListener('drop', onDrop, false)

  // Function to remove drag-drop listeners
  return function remove () {
    removeDragClass()
    elem.removeEventListener('dragenter', onDragEnter, false)
    elem.removeEventListener('dragover', onDragOver, false)
    elem.removeEventListener('dragleave', onDragLeave, false)
    elem.removeEventListener('drop', onDrop, false)
  }

  function onDragEnter (e) {
    if (listeners.onDragEnter) {
      listeners.onDragEnter(e)
    }

    // Prevent event
    e.stopPropagation()
    e.preventDefault()
    return false
  }

  function onDragOver (e) {
    e.stopPropagation()
    e.preventDefault()

    if (listeners.onDragOver) {
      listeners.onDragOver(e)
    }

    if (e.dataTransfer.items) {
      // Only add "drag" class when `items` contains items that are able to be
      // handled by the registered listeners (files vs. text)
      const items = Array.from(e.dataTransfer.items)
      const fileItems = items.filter(item => { return item.kind === 'file' })
      const textItems = items.filter(item => { return item.kind === 'string' })

      if (fileItems.length === 0 && !listeners.onDropText) return
      if (textItems.length === 0 && !listeners.onDrop) return
      if (fileItems.length === 0 && textItems.length === 0) return
    }

    elem.classList.add('drag')
    clearTimeout(timeout)

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

    const pos = {
      x: e.clientX,
      y: e.clientY
    }

    // text drop support
    const text = e.dataTransfer.getData('text')
    if (text && listeners.onDropText) {
      listeners.onDropText(text, pos)
    }

    // File drop support. The `dataTransfer.items` API supports directories, so we
    // use it instead of `dataTransfer.files`, even though it's much more
    // complicated to use.
    // See: https://github.com/feross/drag-drop/issues/39
    if (listeners.onDrop && e.dataTransfer.items) {
      const fileList = e.dataTransfer.files

      // Handle directories in Chrome using the proprietary FileSystem API
      const items = Array.from(e.dataTransfer.items).filter(item => {
        return item.kind === 'file'
      })

      if (items.length === 0) return

      parallel(items.map(item => {
        return cb => {
          processEntry(item.webkitGetAsEntry(), cb)
        }
      }), (err, results) => {
        // This catches permission errors with file:// in Chrome. This should never
        // throw in production code, so the user does not need to use try-catch.
        if (err) throw err

        const entries = results.flat()

        const files = entries.filter(item => {
          return item.isFile
        })

        const directories = entries.filter(item => {
          return item.isDirectory
        })

        listeners.onDrop(files, pos, fileList, directories)
      })
    }

    return false
  }

  function removeDragClass () {
    elem.classList.remove('drag')
  }
}

function processEntry (entry, cb) {
  let entries = []

  if (entry.isFile) {
    entry.file(file => {
      file.fullPath = entry.fullPath // preserve pathing for consumer
      file.isFile = true
      file.isDirectory = false
      cb(null, file)
    }, err => {
      cb(err)
    })
  } else if (entry.isDirectory) {
    const reader = entry.createReader()
    readEntries(reader)
  }

  function readEntries (reader) {
    reader.readEntries(entries_ => {
      if (entries_.length > 0) {
        entries = entries.concat(Array.from(entries_))
        readEntries() // continue reading entries until `readEntries` returns no more
      } else {
        doneEntries()
      }
    })
  }

  function doneEntries () {
    parallel(entries.map(entry => {
      return cb => {
        processEntry(entry, cb)
      }
    }), (err, results) => {
      if (err) {
        cb(err)
      } else {
        results.push({
          fullPath: entry.fullPath,
          name: entry.name,
          isFile: false,
          isDirectory: true
        })
        cb(null, results)
      }
    })
  }
}
