
/**
 * Require the given path.
 *
 * @param {String} path
 * @return {Object} exports
 * @api public
 */

function require(path, parent, orig) {
  var resolved = require.resolve(path);

  // lookup failed
  if (null == resolved) {
    orig = orig || path;
    parent = parent || 'root';
    var err = new Error('Failed to require "' + orig + '" from "' + parent + '"');
    err.path = orig;
    err.parent = parent;
    err.require = true;
    throw err;
  }

  var module = require.modules[resolved];

  // perform real require()
  // by invoking the module's
  // registered function
  if (!module.exports) {
    module.exports = {};
    module.client = module.component = true;
    module.call(this, module.exports, require.relative(resolved), module);
  }

  return module.exports;
}

/**
 * Registered modules.
 */

require.modules = {};

/**
 * Registered aliases.
 */

require.aliases = {};

/**
 * Resolve `path`.
 *
 * Lookup:
 *
 *   - PATH/index.js
 *   - PATH.js
 *   - PATH
 *
 * @param {String} path
 * @return {String} path or null
 * @api private
 */

require.resolve = function(path) {
  if (path.charAt(0) === '/') path = path.slice(1);
  var index = path + '/index.js';

  var paths = [
    path,
    path + '.js',
    path + '.json',
    path + '/index.js',
    path + '/index.json'
  ];

  for (var i = 0; i < paths.length; i++) {
    var path = paths[i];
    if (require.modules.hasOwnProperty(path)) return path;
  }

  if (require.aliases.hasOwnProperty(index)) {
    return require.aliases[index];
  }
};

/**
 * Normalize `path` relative to the current path.
 *
 * @param {String} curr
 * @param {String} path
 * @return {String}
 * @api private
 */

require.normalize = function(curr, path) {
  var segs = [];

  if ('.' != path.charAt(0)) return path;

  curr = curr.split('/');
  path = path.split('/');

  for (var i = 0; i < path.length; ++i) {
    if ('..' == path[i]) {
      curr.pop();
    } else if ('.' != path[i] && '' != path[i]) {
      segs.push(path[i]);
    }
  }

  return curr.concat(segs).join('/');
};

/**
 * Register module at `path` with callback `definition`.
 *
 * @param {String} path
 * @param {Function} definition
 * @api private
 */

require.register = function(path, definition) {
  require.modules[path] = definition;
};

/**
 * Alias a module definition.
 *
 * @param {String} from
 * @param {String} to
 * @api private
 */

require.alias = function(from, to) {
  if (!require.modules.hasOwnProperty(from)) {
    throw new Error('Failed to alias "' + from + '", it does not exist');
  }
  require.aliases[to] = from;
};

/**
 * Return a require function relative to the `parent` path.
 *
 * @param {String} parent
 * @return {Function}
 * @api private
 */

require.relative = function(parent) {
  var p = require.normalize(parent, '..');

  /**
   * lastIndexOf helper.
   */

  function lastIndexOf(arr, obj) {
    var i = arr.length;
    while (i--) {
      if (arr[i] === obj) return i;
    }
    return -1;
  }

  /**
   * The relative require() itself.
   */

  function localRequire(path) {
    var resolved = localRequire.resolve(path);
    return require(resolved, parent, path);
  }

  /**
   * Resolve relative to the parent.
   */

  localRequire.resolve = function(path) {
    var c = path.charAt(0);
    if ('/' == c) return path.slice(1);
    if ('.' == c) return require.normalize(p, path);

    // resolve deps by returning
    // the dep in the nearest "deps"
    // directory
    var segs = parent.split('/');
    var i = lastIndexOf(segs, 'deps') + 1;
    if (!i) i = 0;
    path = segs.slice(0, i + 1).join('/') + '/deps/' + path;
    return path;
  };

  /**
   * Check if module is defined at `path`.
   */

  localRequire.exists = function(path) {
    return require.modules.hasOwnProperty(localRequire.resolve(path));
  };

  return localRequire;
};
require.register("component-indexof/index.js", function(exports, require, module){

var indexOf = [].indexOf;

module.exports = function(arr, obj){
  if (indexOf) return arr.indexOf(obj);
  for (var i = 0; i < arr.length; ++i) {
    if (arr[i] === obj) return i;
  }
  return -1;
};
});
require.register("component-classes/index.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var index = require('indexof');

/**
 * Whitespace regexp.
 */

var re = /\s+/;

/**
 * toString reference.
 */

var toString = Object.prototype.toString;

/**
 * Wrap `el` in a `ClassList`.
 *
 * @param {Element} el
 * @return {ClassList}
 * @api public
 */

module.exports = function(el){
  return new ClassList(el);
};

/**
 * Initialize a new ClassList for `el`.
 *
 * @param {Element} el
 * @api private
 */

function ClassList(el) {
  this.el = el;
  this.list = el.classList;
}

/**
 * Add class `name` if not already present.
 *
 * @param {String} name
 * @return {ClassList}
 * @api public
 */

ClassList.prototype.add = function(name){
  // classList
  if (this.list) {
    this.list.add(name);
    return this;
  }

  // fallback
  var arr = this.array();
  var i = index(arr, name);
  if (!~i) arr.push(name);
  this.el.className = arr.join(' ');
  return this;
};

/**
 * Remove class `name` when present, or
 * pass a regular expression to remove
 * any which match.
 *
 * @param {String|RegExp} name
 * @return {ClassList}
 * @api public
 */

ClassList.prototype.remove = function(name){
  if ('[object RegExp]' == toString.call(name)) {
    return this.removeMatching(name);
  }

  // classList
  if (this.list) {
    this.list.remove(name);
    return this;
  }

  // fallback
  var arr = this.array();
  var i = index(arr, name);
  if (~i) arr.splice(i, 1);
  this.el.className = arr.join(' ');
  return this;
};

/**
 * Remove all classes matching `re`.
 *
 * @param {RegExp} re
 * @return {ClassList}
 * @api private
 */

ClassList.prototype.removeMatching = function(re){
  var arr = this.array();
  for (var i = 0; i < arr.length; i++) {
    if (re.test(arr[i])) {
      this.remove(arr[i]);
    }
  }
  return this;
};

/**
 * Toggle class `name`.
 *
 * @param {String} name
 * @return {ClassList}
 * @api public
 */

ClassList.prototype.toggle = function(name){
  // classList
  if (this.list) {
    this.list.toggle(name);
    return this;
  }

  // fallback
  if (this.has(name)) {
    this.remove(name);
  } else {
    this.add(name);
  }
  return this;
};

/**
 * Return an array of classes.
 *
 * @return {Array}
 * @api public
 */

ClassList.prototype.array = function(){
  var arr = this.el.className.split(re);
  if ('' === arr[0]) arr.pop();
  return arr;
};

/**
 * Check if class `name` is present.
 *
 * @param {String} name
 * @return {ClassList}
 * @api public
 */

ClassList.prototype.has =
ClassList.prototype.contains = function(name){
  return this.list
    ? this.list.contains(name)
    : !! ~index(this.array(), name);
};

});
require.register("component-emitter/index.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var index = require('indexof');

/**
 * Expose `Emitter`.
 */

module.exports = Emitter;

/**
 * Initialize a new `Emitter`.
 *
 * @api public
 */

function Emitter(obj) {
  if (obj) return mixin(obj);
};

/**
 * Mixin the emitter properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in Emitter.prototype) {
    obj[key] = Emitter.prototype[key];
  }
  return obj;
}

/**
 * Listen on the given `event` with `fn`.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.on = function(event, fn){
  this._callbacks = this._callbacks || {};
  (this._callbacks[event] = this._callbacks[event] || [])
    .push(fn);
  return this;
};

/**
 * Adds an `event` listener that will be invoked a single
 * time then automatically removed.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.once = function(event, fn){
  var self = this;
  this._callbacks = this._callbacks || {};

  function on() {
    self.off(event, on);
    fn.apply(this, arguments);
  }

  fn._off = on;
  this.on(event, on);
  return this;
};

/**
 * Remove the given callback for `event` or all
 * registered callbacks.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.off =
Emitter.prototype.removeListener =
Emitter.prototype.removeAllListeners = function(event, fn){
  this._callbacks = this._callbacks || {};

  // all
  if (0 == arguments.length) {
    this._callbacks = {};
    return this;
  }

  // specific event
  var callbacks = this._callbacks[event];
  if (!callbacks) return this;

  // remove all handlers
  if (1 == arguments.length) {
    delete this._callbacks[event];
    return this;
  }

  // remove specific handler
  var i = index(callbacks, fn._off || fn);
  if (~i) callbacks.splice(i, 1);
  return this;
};

/**
 * Emit `event` with the given args.
 *
 * @param {String} event
 * @param {Mixed} ...
 * @return {Emitter}
 */

Emitter.prototype.emit = function(event){
  this._callbacks = this._callbacks || {};
  var args = [].slice.call(arguments, 1)
    , callbacks = this._callbacks[event];

  if (callbacks) {
    callbacks = callbacks.slice(0);
    for (var i = 0, len = callbacks.length; i < len; ++i) {
      callbacks[i].apply(this, args);
    }
  }

  return this;
};

/**
 * Return array of callbacks for `event`.
 *
 * @param {String} event
 * @return {Array}
 * @api public
 */

Emitter.prototype.listeners = function(event){
  this._callbacks = this._callbacks || {};
  return this._callbacks[event] || [];
};

/**
 * Check if this emitter has `event` handlers.
 *
 * @param {String} event
 * @return {Boolean}
 * @api public
 */

Emitter.prototype.hasListeners = function(event){
  return !! this.listeners(event).length;
};

});
require.register("component-inherit/index.js", function(exports, require, module){

module.exports = function(a, b){
  var fn = function(){};
  fn.prototype = b.prototype;
  a.prototype = new fn;
  a.prototype.constructor = a;
};
});
require.register("clipboard-dom/index.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var classes = require('classes');
var inherit = require('inherit');
var Emitter = require('emitter');

/**
 * Module exports.
 */

exports = module.exports = Client;
exports.swf = swf;

/**
 * URL to the "ZeroClipboard.swf" file.
 */

var swfPath = 'ZeroClipboard.swf';

/**
 * Get/set the SWF path.
 */

function swf(path){
  if (0 === arguments.length) {
    return swfPath;
  } else {
    return swfPath = path;
  }
}

/**
 * Get absolute coordinates for dom element.
 * XXX: this probably belongs in a more focused component ("position"?)
 *
 * @api private
 */

function getDOMObjectPosition(obj, stopObj){
  var info = {
    left: 0,
    top: 0,
    width: obj.width ? obj.width : obj.offsetWidth,
    height: obj.height ? obj.height : obj.offsetHeight
  };

  while (obj && (obj != stopObj)) {
    info.left += obj.offsetLeft;
    info.top += obj.offsetTop;
    obj = obj.offsetParent;
  }

  return info;
}

/**
 * Dispatches an event from the ZeroClipboard SWF Flash environment.
 */

function dispatch(id, eventName, args){
  var client = window.ZeroClipboard.clients[id];
  if (client) {
    client.receiveEvent(eventName, args);
  }
}

/**
 * Ensure that the ZeroClipboard-required global variables are set.
 */

if (!window.ZeroClipboard) window.ZeroClipboard = {};
if (!window.ZeroClipboard.nextId) window.ZeroClipboard.nextId = 1;
if (!window.ZeroClipboard.clients) window.ZeroClipboard.clients = {};
if (!window.ZeroClipboard.dispatch) window.ZeroClipboard.dispatch = dispatch;

/**
 * The Client constructor. Turns a DOM node into a "Copy to Clipboard" button.
 * To simulate ":hover" and ":active" styling on "node", define ".hover" and
 * ".active" CSS classes.
 *
 * @param node The DOM node to turn into a "Copy to Clipboard" button.
 * @param parent (optional) The parent DOM node of "node" that "has layout".
 * @api public
 */

function Client(node, parent){
  if (!(this instanceof Client)) {
    return new Client(node, parent);
  }
  Emitter.call(this);
  this.loaded = false;    // "true" when the SWF movie has loaded
  this._text = '';        // the text to copy to the clipboard. set with "text()".
  this._cursor = true;    // whether to show the hand cursor on mouse-over
  this.zIndex = 99;       // default z-index of the movie object

  // unique ID
  this.id = window.ZeroClipboard.nextId++;
  this.movieId = 'ZeroClipboardMovie_' + this.id;

  // register client with ZeroClipboard global to receive flash events
  window.ZeroClipboard.clients[this.id] = this;

  // create movie
  if (node) this.render(node, parent);
}

/**
 * Inherits from `Emitter.prototype`.
 */

inherit(Client, Emitter);

/**
 * Render the SWF movie on top of the "elem" DOM element.
 *
 * @param elem DOMNode The DOM node that will be "converted"
 * @param appendElem DOMNode (optional) The DOM node that the SWF will be inserted into
 * @api public
 */

Client.prototype.glue =
Client.prototype.render = function(elem, appendElem) {
  this.domElement = elem;

  // float just above object, or default zIndex if dom element isn't set
  if (this.domElement.style.zIndex) {
    this.zIndex = parseInt(this.domElement.style.zIndex, 10) + 1;
  }

  if (typeof(appendElem) == 'string') {
    appendElem = appendElem;
  }
  else if (typeof(appendElem) == 'undefined') {
    appendElem = document.getElementsByTagName('body')[0];
  }

  // find X/Y position of domElement
  var box = getDOMObjectPosition(this.domElement, appendElem);

  // create floating DIV above element
  this.div = document.createElement('div');
  var style = this.div.style;
  style.position = 'absolute';
  style.left = '' + box.left + 'px';
  style.top = '' + box.top + 'px';
  style.width = '' + box.width + 'px';
  style.height = '' + box.height + 'px';
  style.zIndex = this.zIndex;

  appendElem.appendChild(this.div);
  this.div.innerHTML = this.getHTML(box.width, box.height);
};

/**
 * Generate the HTML for SWF embed.
 *
 * @api private
 */

Client.prototype.getHTML = function(width, height){
  var html = '';
  var flashvars = 'id=' + this.id + '&width=' + width + '&height=' + height;

  if (navigator.userAgent.match(/MSIE/)) {
    // IE gets an OBJECT tag
    var protocol = /^https/i.test(location.href) ? 'https://' : 'http://';
    html += '<object classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000" codebase="'+protocol+'download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=9,0,0,0" width="'+width+'" height="'+height+'" id="'+this.movieId+'" align="middle"><param name="allowScriptAccess" value="always" /><param name="allowFullScreen" value="false" /><param name="movie" value="'+swfPath+'" /><param name="loop" value="false" /><param name="menu" value="false" /><param name="quality" value="best" /><param name="bgcolor" value="#ffffff" /><param name="flashvars" value="'+flashvars+'"/><param name="wmode" value="transparent"/></object>';
  } else {
    // all other browsers get an EMBED tag
    html += '<embed id="'+this.movieId+'" src="'+swfPath+'" loop="false" menu="false" quality="best" bgcolor="#ffffff" width="'+width+'" height="'+height+'" name="'+this.movieId+'" align="middle" allowScriptAccess="always" allowFullScreen="false" type="application/x-shockwave-flash" pluginspage="http://www.macromedia.com/go/getflashplayer" flashvars="'+flashvars+'" wmode="transparent" />';
  }
  return html;
};

/**
 * temporarily hide floater offscreen
 */

Client.prototype.hide = function(){
  if (this.div) {
    this.div.style.left = '-2000px';
  }
};

/**
 * show ourselves after a call to hide()
 */

Client.prototype.show = function(){
  this.reposition();
};

/**
 * destroy control and floater
 */

Client.prototype.destroy = function(){
  if (this.domElement && this.div) {
    this.hide();
    this.div.innerHTML = '';

    var body = document.getElementsByTagName('body')[0];
    try { body.removeChild( this.div ); } catch(e) {}

    this.domElement = null;
    this.div = null;
  }
};

/**
 * Reposition our floating div, optionally to new container.
 *
 * @api private
 */

Client.prototype.reposition = function(elem){
  // warning: container CANNOT change size, only position
  if (elem) {
    this.domElement = elem;
    if (!this.domElement) this.hide();
  }

  if (this.domElement && this.div) {
    var box = getDOMObjectPosition(this.domElement);
    var style = this.div.style;
    style.left = '' + box.left + 'px';
    style.top = '' + box.top + 'px';
  }
};

/**
 * Set the text that will be copied to clipboard upon a user click.
 *
 * @param text String the text that will be copied to the clipboard on-click
 * @api public
 */

Client.prototype.text =
Client.prototype.setText = function(text){
  if (0 === arguments.length) {
    return this._text;
  } else {
    this._text = text;
    if (this.loaded) this.movie.setText(text);
  }
};

/**
 * Enable hand cursor (true), or default arrow cursor (false).
 *
 * @param enabled Boolean true enabled the cursor hand, false enables the arrow
 * @api public
 */

Client.prototype.cursor =
Client.prototype.setHandCursor = function(enabled){
  if (0 === arguments.length) {
    return this._cursor;
  } else {
    var e = !!enabled;
    this._cursor = e;
    if (this.loaded) this.movie.setHandCursor(e);
  }
};

/**
 * Receive event from flash. Process the event and possibly relay the event to
 * this client instance using "emit()".
 *
 * @api private
 */

Client.prototype.receiveEvent = function(eventName, args){
  eventName = eventName.toString().toLowerCase().replace(/^on/, '');

  var domClasses;
  if (this.domElement) {
    domClasses = classes(this.domElement);
  }

  // special behavior for certain events
  switch (eventName) {
    case 'load':
      // movie claims it is loaded, but in IE this isn't always the case...
      // bug fix: Cannot extend EMBED DOM elements in Firefox, must use traditional function
      this.movie = document.getElementById(this.movieId);
      if (!this.movie) {
        var self = this;
        setTimeout(function(){ self.receiveEvent('load', null); }, 1);
        return;
      }

      // Firefox on Windows needs a "kick" in order to set these in certain cases
      if (!this.loaded && navigator.userAgent.match(/Firefox/) && navigator.userAgent.match(/Windows/)) {
        var self = this;
        setTimeout(function(){ self.receiveEvent('load', null); }, 100);
        this.loaded = true;
        return;
      }

      this.loaded = true;
      this.movie.setText(this._text);
      this.movie.setHandCursor(this._cursor);
      break;

    case 'mouseover':
      if (domClasses) {
        domClasses.add('hover');
        if (this.recoverActive) {
          domClasses.add('active');
        }
      }
      break;

    case 'mouseout':
      if (domClasses) {
        this.recoverActive = false;
        if (domClasses.has('active')) {
          domClasses.remove('active');
          this.recoverActive = true;
        }
        domClasses.remove('hover');
      }
      break;

    case 'mousedown':
      if (domClasses) {
        domClasses.add('active');
      }
      break;

    case 'mouseup':
      if (domClasses) {
        domClasses.remove('active');
        this.recoverActive = false;
      }
      break;
  }

  // emit the event
  var a;
  if ('string' == typeof args) {
    a = [eventName, args]; // "args" is only a string
  } else if (args) {
    a = args.slice(0); // "args" is actually an array
    a.unshift(eventName);
  } else {
    a = [eventName];
  }
  this.emit.apply(this, a);
};

});
require.alias("component-classes/index.js", "clipboard-dom/deps/classes/index.js");
require.alias("component-indexof/index.js", "component-classes/deps/indexof/index.js");

require.alias("component-emitter/index.js", "clipboard-dom/deps/emitter/index.js");
require.alias("component-indexof/index.js", "component-emitter/deps/indexof/index.js");

require.alias("component-inherit/index.js", "clipboard-dom/deps/inherit/index.js");

