
/**
 * Module dependencies.
 */

var classes = require('classes');
var inherit = require('inherit');
var Emitter = require('emitter');

/**
 * URL to the "ZeroClipboard.swf" file.
 */

var swfPath = 'ZeroClipboard.swf';

/**
 * Sets "display: none" on the DOM node.
 *
 * @api private
 */

function hide(node){
  node.style.display = 'none';
}

/**
 * Sets "display: " on the DOM node.
 *
 * @api private
 */

function show(node){
  node.style.display = '';
}

/**
 * Adds class name "name" to the DOM node.
 *
 * @api private
 */

function addClass(node, name){
  classes(node).add(name);
}

/**
 * Removes class name "name" from the DOM node.
 *
 * @api private
 */

function removeClass(node, name){
  classes(node).remove(name);
}

/**
 * Returns `true` if the DOM node has class "name", `false` otherwise.
 *
 * @api private
 */

function hasClass(node, name){
  classes(node).has(name);
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

window.ZeroClipboard = { dispatch: dispatch, nextId: 1, clients: {} };

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


Client.prototype.glue = function(elem, appendElem, stylesToAdd) {
  // glue to DOM element
  // elem can be ID or actual DOM element object
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

  if (typeof(stylesToAdd) == 'object') {
    for (var addedStyle in stylesToAdd) {
      style[addedStyle] = stylesToAdd[addedStyle];
    }
  }

  // style.backgroundColor = '#f00'; // debug

  appendElem.appendChild(this.div);

  this.div.innerHTML = this.getHTML( box.width, box.height );
};

Client.prototype.getHTML = function(width, height){
  // return HTML for movie
  var html = '';
  var flashvars = 'id=' + this.id +
    '&width=' + width +
    '&height=' + height;

  if (navigator.userAgent.match(/MSIE/)) {
    // IE gets an OBJECT tag
    var protocol = /^https/i.test(location.href) ? 'https://' : 'http://';
    html += '<object classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000" codebase="'+protocol+'download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=9,0,0,0" width="'+width+'" height="'+height+'" id="'+this.movieId+'" align="middle"><param name="allowScriptAccess" value="always" /><param name="allowFullScreen" value="false" /><param name="movie" value="'+swfPath+'" /><param name="loop" value="false" /><param name="menu" value="false" /><param name="quality" value="best" /><param name="bgcolor" value="#ffffff" /><param name="flashvars" value="'+flashvars+'"/><param name="wmode" value="transparent"/></object>';
  }
  else {
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
      if (this.domElement) {
        addClass(this.domElement, 'hover');
        if (this.recoverActive) {
          addClass(this.domElement, 'active');
        }
      }
      break;

    case 'mouseout':
      if (this.domElement) {
        this.recoverActive = false;
        if (hasClass(this.domElement, 'active')) {
          removeClass(this.domElement, 'active');
          this.recoverActive = true;
        }
        removeClass(this.domElement, 'hover');
      }
      break;

    case 'mousedown':
      if (this.domElement) {
        addClass(this.domElement, 'active');
      }
      break;

    case 'mouseup':
      if (this.domElement) {
        removeClass(this.domElement, 'active');
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
