
# clipboard-dom

  Makes a DOM element (i.e. &lt;button&gt;) write to the system clipboard

## Installation

```
$ component install component/clipboard-dom
```

## Example

``` js
var Clip = require('clipboard-dom');

// set the path to the swf file first
Clip.swf('/swf/ZeroClipboard.swf');

// create a "Clip" instance
var ele = document.getElementById('copy-button');
var parent = ele.parentNode; // parent should "have layout"
var clip = new Clip(ele, parent);

// listen for meaningful events
clip.on('load', function(){
  console.log('button loaded');
});

clip.on('completed', function(text){
  console.log('copied text to the clipboard:', text);
});

clip.on('mousedown', function() {
  // "mousedown" is the last chance to set the text before it gets copied
  var input = document.getElementById('copy-text');
  clip.text(input.value);
});
```

## Events

### "load"

Fired when the SWF movie for the clipboard instance has loaded.

### "complete"

Fired when the user clicks on the button and the text has been copied.
The text that got copied is passed in as an argument.

### "mouseover"

Fired when the user mouses over the button.

### "mouseout"

Fired when the user mouses away from the button.

### "mousedown"

Fired when the user pressed the mouse down on the button.

### "mouseup"

Fired when the user releases the mouse from the button.
