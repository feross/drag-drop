# drag-drop
[![Build Status](http://img.shields.io/travis/feross/drag-drop.svg)](https://travis-ci.org/feross/drag-drop)
[![NPM Version](http://img.shields.io/npm/v/drag-drop.svg)](https://npmjs.org/package/drag-drop)
[![NPM](http://img.shields.io/npm/dm/drag-drop.svg)](https://npmjs.org/package/drag-drop)
[![Gittip](http://img.shields.io/gittip/feross.svg)](https://www.gittip.com/feross/)

[![browser support](https://ci.testling.com/feross/drag-drop.png)](https://ci.testling.com/feross/drag-drop)

### Unfuck the [HTML5 drag & drop API](https://developer.mozilla.org/en-US/docs/Using_files_from_web_applications)

Also works in the browser with [browserify](http://browserify.org/)!

## install

```
npm install drag-drop
```

## usage

```js
var dragDrop = require('drag-drop')
var dropTarget = document.querySelector('#dropTarget')

dragDrop(dropTarget, function (files) {
  console.log('Here are the dropped files', files)
})

```

Another handy thing this does is add a `drag` class to the drop target when the user
is dragging a file over the drop target. Useful for styling the drop target to make
it obvious that this is a drop target!

## a more complete example

```js
var dragDrop = require('drag-drop')
var dropTarget = document.querySelector('#dropTarget')

dragDrop(dropTarget, function (files) {
  console.log('Here are the dropped files', files)

  // `files` is an Array!
  files.forEach(function (file) {

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

## license

MIT. Copyright (c) [Feross Aboukhadijeh](http://feross.org).
