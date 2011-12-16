var Sx = {
    
  Object: function(base, extras){
    function F(){};
    F.prototype = base;
    var obj = new F();
    if(extras) Sx.mix(obj, extras);
    return obj;
  },
  
  mix: function(obj, properties, test){
    for (var key in properties){
      if(!(test && obj[key])) obj[key] = properties[key];
    }
    return obj;
  },
  
  extend: function(r, s, px, ox){
    var sp = s.prototype;
    
    // clone base prototype
    var rp = Sx.Object(sp);
    r.prototype = rp;
    rp.constructor = r;
    r.superclass = sp;
    
    // assign constructor property (to allow call of superclass.constructor)
    if (s != Object && sp.constructor == Object.prototype.constructor) {
      sp.constructor = s;
    }
    
    // add prototype overrides (doesn't impact the base class)
    if (px) {
      Sx.mix(rp, px);
    }

    // add object overrides
    if (ox) {
      Sx.mix(r, ox);
    }
    
    return r;
  },
      
  Element: function(tagName, attrs){
    var elt = window.document.createElement(tagName);
    for(var name in attrs){
      var mod = Sx.Modifiers[name]
      if(mod){
        mod(elt, attrs[name]);
      }else{
        elt.setAttribute(name, attrs[name]);
      }
    }
    return elt;
  },
    
  Modifiers: {
    html: function(elt, value){
      elt.innerHTML = value;
    },
    cls: function(elt, value){
      Sx.addClass(elt, value);
    },
    style: function(elt, value){
      Sx.setStyle(elt, value);
    }
  },
  
  _reCl: function(cl){
    return new RegExp('(^|\\s)'+cl+'(\\s|$)')
  },
  
  hasClass: function(elt, cl){
    return Sx._reCl(cl).test(elt.className);
  },
    
  addClass: function(elt, cl){
    if(! Sx.hasClass(elt, cl)){
      elt.className += (elt.className!=''?' ':'') + cl;
    }
  },
  
  removeClass: function(elt, cl){
    elt.className = elt.className.replace(Sx._reCl(cl), '$1');
  },
  
  changeClass: function(elt, cl){
    if(elt._chgCl) Sx.removeClass(elt, elt._chgCl);
    if(cl){
      elt._chgCl = cl;
      Sx.addClass(elt, cl);
    }
  },

  setStyle: function(elt, prop){
    for(var name in prop){
      elt.style[name] = prop[name];
    }
  },
  
  getPosition: function(elt, parent){
    var pos = {x: 0, y: 0};
    while(elt && elt != parent){
      pos.x += elt.offsetLeft;
      pos.y += elt.offsetTop;
      elt = elt.offsetParent;
    }
    return pos;
  },
  
  hide: function(elt){
    elt.style.display = "none";
    return elt;
  },
  
  show: function(elt){
    elt.style.display = "";
    return elt;
  },
    
  getElementsByClassName: function(root, cl, tagName){
    var res;
    if(!tagName && root.constructor && root.constructor.prototype.getElementsByClassName){
      res = root.constructor.prototype.getElementsByClassName.call(root, cl);
    }else{
      res = [];
      var pattern = Sx._reCl(cl);
      var elts = root.getElementsByTagName(tagName || '*');
      for(var elt, i=0; elt = elts[i]; i++){
        if(pattern.test(elt.className)){
          res.push(elt);
        }
      }
    }
    return res;
  },
    
  findAll: function(pattern, root){
    var patterns = pattern.split(' ');
    return Sx._find(patterns, [root || window.document]);
  },
  
  find: function(pattern, root){
    return this.findAll(pattern, root)[0];
  },
  
  _find: function(patterns, roots){
    if(patterns.length == 0) return roots;

    var res = [];    
    var pattern = patterns.shift();
    var parts = pattern.split('.');
    
    for(var node, i=0; node = roots[i]; i++){
      var collected;
      if(parts[0] == ""){ // className
        collected = Sx.getElementsByClassName(node, parts[1]);
      }else if(parts[0].charAt(0) == "#"){ // id
        var id = parts[0].slice(1);
        collected = [node.getElementById(id)];
      }else{
        if(parts[1]){ // tagName + className
          collected = Sx.getElementsByClassName(node, parts[1], parts[0]);
        }else{ // tagName 
          collected = node.getElementsByTagName(parts[0]);
        }
      }
      
      if(!(collected instanceof Array)){ 
        for (var j=0; j<collected.length;j++) {
          res.push(collected[j]);
        }
      }else{
        res.push.apply(res, collected);
      }
    }
    
    return Sx._find(patterns, res);
  },
  
  replace: function(dst, elt){
    var container = dst.parentNode;
    if(container){
      container.insertBefore(elt, dst);
      container.removeChild(dst);
    }
  },
  
  remove: function(elt){
    var container = elt.parentNode;
    if(container){
      container.removeChild(elt);
    }
  },
    
  addEvent: function(elt, type, fn){
    if (elt.addEventListener) elt.addEventListener(type, fn, false);
    else elt.attachEvent('on' + type, fn);
  },

  removeEvent: function(elt, type, fn){
    if (elt.removeEventListener) elt.removeEventListener(type, fn, false);
    else elt.detachEvent('on' + type, fn);
  },
  
  bind: function(fct, target){
    var bindArgs = Array.prototype.slice.call(arguments, 2);
    return function(){
      var callArgs = bindArgs.concat(Array.prototype.slice.call(arguments, 0));
      return fct.apply(target || null, callArgs);
    };
  },
    
  capitalize: function(text){
    return text.replace(/\b[a-z]/g, function(match){
      return match.toUpperCase();
    });
  },
  
  _xmlEntities: [['&', '&amp;'], ['\'', '&apos;'], ['"', '&quot;'], ['<', '&lt;'], ['>', '&gt;']],
  escapeXml: function(text){    
    Sx._xmlEntities.forEach(function(entity){
      text = text.replace(new RegExp(entity[0], 'g'), entity[1]);
    });
    return text;
  },
  
  urlEncode: function(data){
    var params = [];
    for(var name in data){
      if(data[name] != undefined){
        params.push(name + "=" + encodeURIComponent(data[name]));
      }
    }
    return params.join('&');
  },
          
  // (str) url: post to this url
  // (dict) data: data to post
  // (dict) form: extra form attributes
  doPost: function(options){
    var attrs = Sx.mix({method:'post', action:options.url}, options.form);
    var form = window.document.body.appendChild(Sx.Element('form', attrs));
    for(var name in options.data){
      if(options.data[name] != undefined){
        form.appendChild(Sx.Element('input', {type:'hidden', name:name, value:options.data[name]}));
      }
    }
    form.submit();
    window.document.body.removeChild(form);
  },

  buildSwfObject: function(url, attrs, flashvars, params) {
    attrs = attrs || {};
    params = params || {};
    params['flashvars'] = Sx.urlEncode(flashvars);
    
    if(Sx.isIE()){
      attrs['classid'] = 'clsid:D27CDB6E-AE6D-11cf-96B8-444553540000';
      params['movie'] = url;
    }else{
      attrs['data'] = url;
      attrs['type'] = 'application/x-shockwave-flash';
    }
    
    html_attrs = [];
    for(var name in attrs){
      html_attrs.push(name+'="'+attrs[name]+'"');
    }
    
    html_params = [];
    for(var name in params){
      html_params.push('<param name="'+name+'" value="'+params[name]+'"/>');
    }

    return '<object '+html_attrs.join(' ')+'>'+html_params.join('')+'</object>';
  },
  
  memoize: function(fct, target){
    var result;
    return function(){
      return (result != undefined) ? result : (result = fct.call(target || window));
    }
  }

};

// -----------------------------------------------------------------------------------------------------------------------------------

Sx.isIE = Sx.memoize(function(){ return (!+"\v1"); });
Sx.isIE6 = Sx.memoize(function(){ return navigator.userAgent.match(/MSIE 6.0/) != null; });
Sx.isIE7 = Sx.memoize(function(){ return navigator.userAgent.match(/MSIE 7.0/) != null; });

Sx.isIpad = Sx.memoize(function(){
  return navigator.userAgent.match(/iPad/i) != null;
});

Sx.isMobileSafari = Sx.memoize(function(){
  return navigator.userAgent.match(/Apple.*Mobile.*Safari/) != null;
});

// -----------------------------------------------------------------------------------------------------------------------------------

Sx.Array = {
  forEach: function(fn, bind){
    for(var i=0, l=this.length; i < l; i++) fn.call(bind, this[i], i, this);
  },
 
  map: function(fn, bind){
    var res = [];
    for(var i=0, l=this.length; i < l; i++) res[i] = fn.call(bind, this[i], i, this);
    return res;
  },
  
  filter: function(fn, bind){
    var res = [];
    for(var i=0, l=this.length; i < l; i++){
      if (fn.call(bind, this[i], i, this)) res.push(this[i]);
    }
    return res;
  }
};
Sx.mix(Array.prototype, Sx.Array, true);

// -----------------------------------------------------------------------------------------------------------------------------------

Sx.Controller = {
          
  addListener: function(listener, name){
    if(!this._listeners) this._listeners = [];
    this._listeners.push({
      listener: listener, 
      name: name || ""
    });
    return this;
  },
  
  removeListener: function(listener, name){
    if(!this._listeners) return;
    this._listeners = this._listeners.filter(function(entry){
      var match = entry.listener == listener;
      if(name) match &= entry.name == name;
      return !match;
    });
  },
  
  setDelegate: function(delegate, name){
    if(this._delegate){
      this.removeListener(this._delegate);
    }
    this.addListener(delegate, name);
    this._delegate = delegate;
    return this;
  },
  
  fire: function(eventName, data){
    if(!this._listeners) return;
    for(var entry, i=0; entry = this._listeners[i]; i++){
      var handlerName = 'on' + Sx.capitalize(entry.name) + Sx.capitalize(eventName);
      if(entry.listener[handlerName]) entry.listener[handlerName](this, data);
    }
  }
  
};



Sx.Url = function(url){
  if(url) this.parse(url);
}

Sx.mix(Sx.Url.prototype, {
  parse: function(url){
    var parts = url.split('?');
    this.base = parts[0];
    this.params = {};
    var qs = parts[1];
    if(qs){
      var params = qs.split('&');
      for(var param, i = 0; param = params[i]; i++){
        var bits = param.split('=');
        this.params[bits[0]] = decodeURIComponent(bits[1]);
      }
    }
  },
  toString: function(){
    var qs = Sx.urlEncode(this.params);
    return this.base + (qs?'?'+qs:'');
  }
});


Sx.Template = function(tpl){
  this._tpl = tpl;
}

Sx.mix(Sx.Template.prototype, {
  render: function(data){
    var res = new String(this._tpl);
    for(var name in data){
      res = res.replace(new RegExp('{{'+name+'}}', 'g'), data[name]);
    }
    return res;
  }
});


Sx.Duration = function(seconds){
  this.hour = Math.floor(seconds/3600);
  this.minutes = Math.floor(seconds%3600 / 60);
  this.seconds = Math.floor(seconds%60);
};

Sx.Duration.prototype = {
  reduced: function(){
    return (this.hour?this.hour+':':'')+String(100+this.minutes).slice(1)+':'+String(100+this.seconds).slice(1);
  },
  full: function(){
    return (this.hour?this.hour+'h ':'') + (this.minutes?this.minutes+'min ':'') + this.seconds + 's';
  }
};

Sx.fixUrl = function(url){
  
  if(url.search(/^https?:\/\//) < 0){
    var loc = window.location;
    
    if(url.charAt(0) != '/'){
      var parts = loc.pathname.split('/');
      parts.pop();
      var base = parts.join('/') + '/';
      
      if(url.slice(0,2) == './'){
        url = base + url.slice(2);
      }else{
        url = base + url;
      }
    }
    
    url = loc.protocol + '//' + loc.host + url;
  }  
  
  return url;
};

Sx.genUid = function(length, range){
  length = length || 32;
  range = range || "0z";
  
  var start = range.charCodeAt(0);
  range = range.charCodeAt(1) - start;
  
  var uid = "";
  for(var i=0; i < length; i++){
    uid += String.fromCharCode(start + Math.round(Math.random() * range));
  }
  
  return uid;
};

Sx.Callbacks = {
  _idx: 0,
  register: function(callback){
    var id = '_'+this._idx++;
    this[id] = function(data){
      callback(data);
      delete Sx.Callbacks[id]
    }
    return 'Sx.Callbacks.'+id;
  }
}

Sx.Get = function(options){
  var me = this;
  var callbackId = Sx.Callbacks.register(function(data){
    if(!me._stopped && options.onComplete) options.onComplete(data);
    document.body.removeChild(script);
  });
  
  var url = new Sx.Url(options.url);
  Sx.mix(url.params, options.data);
  url.params['callback'] = callbackId;
  
  var script = Sx.Element('script', {src: url.toString()});
  document.body.appendChild(script);
};


Sx.Post = function(options){
  var iframeId = "sx_iframe_" + Sx.Callbacks._idx++;

  // craft iframe from raw html (ie compatibility)
  var iframe = Sx.Element('div', {html: '<iframe name="'+iframeId+'" style="display:none" src=""/>'}).firstChild;
  document.body.appendChild(iframe);
    
  var me = this;
  Sx.addEvent(iframe, "load", function(){
    if(!me._stopped && options.onComplete) options.onComplete();
    // Let the load event finish before removing the iframe (avoid infinite load spinner in FF)
    setTimeout(function(){document.body.removeChild(iframe);}, 0);
  });

  // extra form attributes
  options.form = options.form || {};
  options.form.target = iframeId;
  
  Sx.doPost(options);
};

Sx.Get.prototype = Sx.Post.prototype = {
  stop: function(){
    this._stopped = true;
  }
};
// -----------------------------------------------------------------------------------------------------------------------------------

Sx.Video = function(container, forceFlash){
  var cls, video = Sx.Element('video');
  
  if(video.play){
    if(video.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2')){
      cls = Sx.Html5Player;
    }
  }
  
  if(!cls || forceFlash){
    cls = Sx.FlvPlayer;
  }
  
  return new cls(container, 'video');
};

Sx.Audio = function(container, forceFlash){
  var cls, audio = Sx.Element('audio');
  
  if(audio.play){
    if(audio.canPlayType('audio/mpeg')){
      cls = Sx.Html5Player;
    }
  }
  
  if(!cls || forceFlash){
    cls = Sx.FlvPlayer;
  }
  
  return new cls(container, 'audio');
}

// -----------------------------------------------------------------------------------------------------------------------------------

Sx.SwfManager = {
  _uid: 0,
  
  getUid: function(){
    return 'swf'+this._uid;
  },
  
  register: function(obj){
    var uid = this.getUid(); this._uid++;
    this[uid] = obj;
    return 'Sx.SwfManager.' + uid;
  }
};

// -----------------------------------------------------------------------------------------------------------------------------------

Sx.FlvPlayer = function(container){
  this._delayedCalls = [];
  
  // listen to myself
  this.addListener(this);
  
  var object = Sx.buildSwfObject('http://static.stupeflix.com/player/1.1/assets/player.swf', {
    id: Sx.SwfManager.getUid(),
    width: '100%',
    height: '100%'
  }, {
    jshandler: Sx.SwfManager.register(this) + '.fire'
  }, {
    allowfullscreen: 'true',
    allowscriptaccess: 'always',
    wmode: 'transparent'
  });
  
  container.innerHTML = object;
  this._player = container.firstChild;
};

Sx.mix(Sx.FlvPlayer.prototype, Sx.Controller);
Sx.mix(Sx.FlvPlayer.prototype, {
    
  _callAS: function(){
    this._delayedCalls.push(arguments);
  },
  
  makeDelayedCalls: function(){
    this._callAS = function(){
      return this._player.callMethod.apply(this._player, arguments);
    }
    
    var args;
    while(args = this._delayedCalls.shift()){
      this._callAS.apply(this, args);
    }
  },
  
  onInit: function(){
    this.makeDelayedCalls();
  },
  
  onMediaPlayerStateChange: function(me, data){
    switch(data.state){
      case "ready":
        if(!this._duration){
          // preload
          setTimeout(Sx.bind(function(){
            this.play(); this.pause();
          }, this), 0);
        }else{
          this.fire('ended');
        }
        break;
        
      case "playing":
        this.fire("play");
        break;
        
      case "paused":
        this.fire("pause")
        break;
    }
  },  
        
  onBytesLoadedChange: function(me, data){
    if(!this._duration){
      this._duration = this._callAS('get', 'duration');
      if(this._duration){
        this._bytesTotal = this._callAS('get', 'bytesTotal');
        this.fire('loadedMetadata');
        this.fire('canPlayThrough');
      }
    }
    this._bytesLoaded = data.bytes;
    this.fire('progress', this.getProgress());
  },
    
  onCurrentTimeChange: function(me, data){
    this.fire('timeUpdate');
  },
    
  getProgress: function(){
    return (this._bytesLoaded / this._bytesTotal) || 0;
  },
  
  getDisplay: function(){
    return this._player;
  },
    
  getDuration: function(){
    return this._duration;
  },
  
  getCurrentTime: function(){
    return this._callAS('get', 'currentTime');
  },
  
  isPaused: function(){
    return this._callAS('get', 'paused');
  },
  
  isMuted: function(){
    return this._callAS('get', 'muted');
  },
    
  load: function(url, mediaType){
    this._duration = 0;
    this._bytesLoaded = this._bytesTotal = 0;
    this._callAS('loadURL', url, mediaType);
  },
  
  play: function(){
    this._callAS('play');
  },
  
  pause: function(){
    this._callAS('pause');
  },
  
  seek: function(time){
    this._callAS('seek', time);
  },
  
  mute: function(value){
    this._callAS('set', 'muted', value!=undefined?value:true);
  }
  
  /*
  ,fire: function(eventName, data){
    console.log(eventName, data);
    Sx.Controller.fire.call(this, eventName, data);
  }
  */
  
});

// -----------------------------------------------------------------------------------------------------------------------------------

Sx.Html5Player = function(container, type){
    this._player = container.appendChild(Sx.Element(type || 'video'));
    
    Sx.addEvent(this._player, 'loadedmetadata', Sx.bind(this.fire, this, 'loadedMetadata'));
    Sx.addEvent(this._player, 'canplaythrough', Sx.bind(this.fire, this, 'canPlayThrough'));
    Sx.addEvent(this._player, 'progress', Sx.bind(this.onProgress, this));

    Sx.addEvent(this._player, 'play', Sx.bind(this.fire, this, 'play'));
    Sx.addEvent(this._player, 'pause', Sx.bind(this.fire ,this, 'pause'));
    Sx.addEvent(this._player, 'timeupdate', Sx.bind(this.fire, this, 'timeUpdate'));
    
    Sx.addEvent(this._player, 'ended', Sx.bind(this.fire, this, 'ended'));
    return this;
};

Sx.mix(Sx.Html5Player.prototype, Sx.Controller);
Sx.mix(Sx.Html5Player.prototype, {
  
  onProgress: function(){
    this.fire('progress', this.getProgress());
  },
  
  getProgress: function(){
    var buffered = this._player.buffered;
    return buffered.length? buffered.end() / this.getDuration() : 0;
  },
  
  getDisplay: function(){
    return this._player;
  },
      
  getCurrentTime: function(){
    return this._player.currentTime;
  },
  
  getDuration: function(){
    return this._player.duration || 0;
  },

  isPaused: function(){
    return this._player.paused;
  },
  
  isMuted: function(value){
    return this._player.muted;
  },
  
  load: function(url){
    this._player.src = url;
    this._player.load();
  },
  
  play: function(){
    this._player.play();
  },
  
  pause: function(){
    this._player.pause();
  },

  seek: function(time){
    this._player.currentTime = time;
  },
    
  mute: function(value){
    this._player.muted = (value!=undefined?value:true);
  }
    
});
Sx.Event = function(event){
  if(event instanceof Sx.Event) return event;

  this.event = event;
  this.type = event.type;
  this.target = event.target || event.srcElement;
  
  if(this.type.match(/(click|mouse|menu)/i)){
    var html = Sx.find('html');
    this.pageX = event.pageX || event.clientX + html.scrollLeft;
    this.pageY = event.pageY || event.clientY + html.scrollTop;
  }
}

Sx.mix(Sx.Event.prototype, {
  stop: function(){
    return this.preventDefault().stopPropagation()
  },
  stopPropagation: function(){
    this.event.stopPropagation ? this.event.stopPropagation() : (this.event.cancelBubble = false);
    return this;
  },
  preventDefault: function(){
    this.event.preventDefault ? this.event.preventDefault() : (this.event.returnValue = false);
    return this;
  }
});

// -----------------------------------------------------------------------------------------------------------------------------------

Sx.Drag = function(handle){
  this.document = window.document;
  this.bound = { 
    dragStart: Sx.bind(this.dragStart, this),
    drag: Sx.bind(this.drag, this),
    dragEnd: Sx.bind(this.dragEnd, this)
  };
  Sx.addEvent(handle, "mousedown", this.bound.dragStart);
}

Sx.mix(Sx.Drag.prototype, Sx.Controller);
Sx.mix(Sx.Drag.prototype, {
    
  dragStart: function(e){
    e = new Sx.Event(e);
    
    Sx.addEvent(this.document, "mousemove", this.bound.drag);
    Sx.addEvent(this.document, "mouseup", this.bound.dragEnd);
    this.deltaX = 0;
    this.deltaY = 0;
    this.event = e;
    e.preventDefault(); // prevent mouse selection
    this.fire("dragStart", this);
  },
  
  drag: function(e){
    e = new Sx.Event(e);

    this.deltaX = e.pageX - this.event.pageX;
    this.deltaY = e.pageY - this.event.pageY;
    this.event = e;
    this.fire("drag", this);
    return false; // prevent mouse selection on ie (image)
  },
  
  dragEnd: function(e){
    Sx.removeEvent(this.document, "mousemove", this.bound.drag);
    Sx.removeEvent(this.document, "mouseup", this.bound.dragEnd);
    this.event = new Sx.Event(e);
    this.fire("dragEnd", this);
  } 
});
