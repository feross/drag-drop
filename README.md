# drag-drop [![ci][ci-image]][ci-url] [![npm][npm-image]][npm-url] [![downloads][downloads-image]][downloads-url] [![javascript style guide][standard-image]][standard-url]

[ci-image]: https://img.shields.io/github/workflow/status/feross/drag-drop/ci/master
[ci-url]: https://github.com/feross/drag-drop/actions
[npm-image]: https://img.shields.io/npm/v/drag-drop.svg
[npm-url]: https://npmjs.org/package/drag-drop
[downloads-image]: https://img.shields.io/npm/dm/drag-drop.svg
[downloads-url]: https://npmjs.org/package/drag-drop
[standard-image]: https://img.shields.io/badge/code_style-standard-brightgreen.svg
[standard-url]: https://standardjs.com

### HTML5 drag & drop for humans

In case you didn't know, the
[HTML5 drag and drop API](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API)
is a
[total disaster](http://www.quirksmode.org/blog/archives/2009/09/the_html5_drag.html)!
This is an attempt to make the API usable by mere mortals.

### live demo

See [https://instant.io](https://instant.io).

### features

- simple API
- supports files and directories
- excellent browser support (Chrome, Firefox, Safari, Edge)
- adds a `drag` class to the drop target on hover, for easy styling!
- optionally, get the file(s) as a Buffer (see [buffer](https://github.com/feross/buffer))

### install

```
npm install drag-drop
```

This package works in the browser with [browserify](https://browserify.org). If you do not use a bundler, you can use the [standalone script](https://bundle.run/drag-drop) directly in a `<script>` tag.

### usage

```js
const dragDrop = require('drag-drop')

dragDrop('#dropTarget', (files, pos, fileList, directories) => {
  console.log('Here are the dropped files', files) // Array of File objects
  console.log('Dropped at coordinates', pos.x, pos.y)
  console.log('Here is the raw FileList object if you need it:', fileList)
  console.log('Here is the list of directories:', directories)
})
```

Another handy thing this does is add a `drag` class to the drop target when the user
is dragging a file over the drop target. Useful for styling the drop target to make
it obvious that this is a drop target!

### complete example

```js
const dragDrop = require('drag-drop')

// You can pass in a DOM node or a selector string!
dragDrop('#dropTarget', (files, pos, fileList, directories) => {
  console.log('Here are the dropped files', files)
  console.log('Dropped at coordinates', pos.x, pos.y)
  console.log('Here is the raw FileList object if you need it:', fileList)
  console.log('Here is the list of directories:', directories)

  // `files` is an Array!
  files.forEach(file => {
    console.log(file.name)
    console.log(file.size)
    console.log(file.type)
    console.log(file.lastModifiedDate)
    console.log(file.fullPath) // not real full path due to browser security restrictions
    console.log(file.path) // in Electron, this contains the actual full path

    // convert the file to a Buffer that we can use!
    const reader = new FileReader()
    reader.addEventListener('load', e => {
      // e.target.result is an ArrayBuffer
      const arr = new Uint8Array(e.target.result)
      const buffer = new Buffer(arr)

      // do something with the buffer!
    })
    reader.addEventListener('error', err => {
      console.error('FileReader error' + err)
    })
    reader.readAsArrayBuffer(file)
  })
})
```

### get files as buffers

If you prefer to access file data as Buffers, then just require drag-drop like this:

```js
const dragDrop = require('drag-drop/buffer')

dragDrop('#dropTarget', files => {
  files.forEach(file => {
    // file is actually a buffer!
    console.log(file.readUInt32LE(0))
    console.log(file.toJSON())
    console.log(file.toString('hex')) // etc...

    // but it still has all the normal file properties!
    console.log(file.name)
    console.log(file.size)
    console.log(file.type)
    console.log(file.lastModifiedDate)
  })
})
```

### detect drag-and-dropped text

If the user highlights text and drags it, we capture that as a separate event.
Listen for it like this:

```js
const dragDrop = require('drag-drop')

dragDrop('#dropTarget', {
  onDropText: (text, pos) => {
    console.log('Here is the dropped text:', text)
    console.log('Dropped at coordinates', pos.x, pos.y)
  }
})
```

### detect `dragenter`, `dragover` and `dragleave` events

Instead of passing just an `ondrop` function as the second argument, instead pass an
object with all the events you want to listen for:

```js
const dragDrop = require('drag-drop')

dragDrop('#dropTarget', {
  onDrop: (files, pos, fileList, directories) => {
    console.log('Here are the dropped files', files)
    console.log('Dropped at coordinates', pos.x, pos.y)
    console.log('Here is the raw FileList object if you need it:', fileList)
    console.log('Here is the list of directories:', directories)
  },
  onDropText: (text, pos) => {
    console.log('Here is the dropped text:', text)
    console.log('Dropped at coordinates', pos.x, pos.y)
  },
  onDragEnter: (event) => {},
  onDragOver: (event) => {},
  onDragLeave: (event) => {}
})
```

You can rely on the `onDragEnter` and `onDragLeave` events to fire only for the
drop target you specified. Events which bubble up from child nodes are ignored
so that you can expect a single `onDragEnter` and then a single `onDragLeave`
event to fire.

Furthermore, neither `onDragEnter`, `onDragLeave`, nor `onDragOver` will fire
for drags which cannot be handled by the registered drop listeners. For example,
if you only listen for `onDrop` (files) but not `onDropText` (text) and the user
is dragging text over the drop target, then none of the listed events will fire.

### remove listeners

To stop listening for drag & drop events and remove the event listeners, just use the
`cleanup` function returned by the `dragDrop` function.

```js
const dragDrop = require('drag-drop')

const cleanup = dragDrop('#dropTarget', files => {
  // ...
})

// ... at some point in the future, stop listening for drag & drop events
cleanup()
```

### support pasting files from the clipboard

To support users pasting files from their clipboard, use the provided
`processItems()` function to process the `DataTransferItemList` from the
browser's native `'paste'` event.

```js
document.addEventListener('paste', event => {
  dragDrop.processItems(event.clipboardData.items, (err, files) => {
    // ...
  })
})
```

### a note about `file://` urls

Don't run your app from `file://`. For security reasons, browsers do not allow you to
run your app from `file://`.  In fact, many of the powerful storage APIs throw errors
if you run the app locally from `file://`.

Instead, start a local server and visit your site at `http://localhost:port`.

### license

MIT. Copyright (c) [Feross Aboukhadijeh](http://feross.org).
