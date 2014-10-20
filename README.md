# drag-drop [![travis](https://img.shields.io/travis/feross/drag-drop.svg)](https://travis-ci.org/feross/drag-drop) [![npm](https://img.shields.io/npm/v/drag-drop.svg)](https://npmjs.org/package/drag-drop) [![downloads](https://img.shields.io/npm/dm/drag-drop.svg)](https://npmjs.org/package/drag-drop) [![gittip](https://img.shields.io/gittip/feross.svg)](https://www.gittip.com/feross/)

### HTML5 drag & drop for humans

[![browser support](https://ci.testling.com/feross/drag-drop.png)](https://ci.testling.com/feross/drag-drop)

In case you didn't know, the
[HTML5 drag and drop API](https://developer.mozilla.org/en-US/docs/Using_files_from_web_applications)
is a
[total disaster](http://www.quirksmode.org/blog/archives/2009/09/the_html5_drag.html)!
This is an attempt to make the API usable by mere mortals.

This module works in the browser with [browserify](http://browserify.org/) and it's used
by [WebTorrent](http://webtorrent.io)!

**Note:** If you're not using browserify, then use the included standalone file
`dragdrop.bundle.js`. This exports a `DragDrop` function on `window`.

### features

- simple API
- adds a `drag` class to the drop target on hover, for easy styling!
- optionally, get the file(s) as a Buffer (see [buffer](https://github.com/feross/buffer))

### install

```
npm install drag-drop
```

### usage

```js
var dragDrop = require('drag-drop')

dragDrop('#dropTarget', function (files, pos) {
  console.log('Here are the dropped files', files)
  console.log('Dropped at coordinates', pos.x, pos.y)
})
```

Another handy thing this does is add a `drag` class to the drop target when the user
is dragging a file over the drop target. Useful for styling the drop target to make
it obvious that this is a drop target!

### a more complete example

```js
var dragDrop = require('drag-drop')

// You can pass in a DOM node or a selector string!
dragDrop('#dropTarget', function (files) {
  console.log('Here are the dropped files', files)

  // `files` is an Array!
  files.forEach(function (file) {
    console.log(file.name)
    console.log(file.size)
    console.log(file.type)
    console.log(file.lastModifiedData)

    // convert the file to a Buffer that we can use!
    var reader = new FileReader()
    reader.addEventListener('load', function (e) {
      // e.target.result is an ArrayBuffer
      var arr = new Uint8Array(e.target.result)
      var buffer = new Buffer(arr)

      // do something with the buffer!
    })
    reader.addEventListener('error', function (err) {
      console.error('FileReader error' + err)
    })
    reader.readAsArrayBuffer(file)
  })
})
```

### get files as buffers

If you prefer to access file data as Buffers, then just require drag-drop like this:

```js
var dragDrop = require('drag-drop/buffer')

dragDrop('#dropTarget', function (files) {
  files.forEach(function (file) {
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
}

```

### license

MIT. Copyright (c) [Feross Aboukhadijeh](http://feross.org).
