
# clipboard-dom

  Makes a DOM element (i.e. &lt;button&gt;) write to the system clipboard. This
  component is based off of the [ZeroClipboard](https://github.com/jonrohan/ZeroClipboard)
  project, and in fact uses the same SWF Flash code.

## Installation

```
$ component install component/clipboard-dom
```

## Example

``` html
<html>
  <body>
    <!-- The "copy-button" *should* be inside a div with "position: relative"
         or something else that "has layout". -->
    <div style="position: relative;">
      <button id="copy-button">Copy to Clipboard</button>
    </div>
    <script src="build/build.js"></script>
    <script src="main.js"></script>
  </body>
</html>
```

``` js
// main.js

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
