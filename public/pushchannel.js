var PushChannel = (function() {
  /**
   *  Minivents
   */
  function Minivents(target){
    var events = {}, i, list, args, A = Array;
    if (!target) target = this;
    /**
     *  On: listen to events
     */
    target.on = function(type, func, ctx){
      events[type] || (events[type] = []);
      events[type].push({f:func, c:ctx})
    };
    /**
     *  Off: stop listening to event / specific callback
     */
    target.off = function(type, func){
      list = events[type] || [];
      !func && (list.length = 0);
      i = list.length;
      while(~--i<0) func == list[i].f && list.splice(i,1)
    };
    /**
     * Emit: send event, callbacks will be triggered
     */
    target.emit = function(){
      args = A.apply([], arguments);
      list = events[args.shift()] || [];
      args = args[0] instanceof A && args[0] || args ;
      i = list.length;
      while(~--i<0) list[i].f.apply(list[i].c, args)
    };
  };

  var PushChannel = function (options) {
    if (!options.name || !options.socketUrl) {
      throw "Need to enter both a name and a socket url!";
    }

    // mixin events
    Minivents(this);

    // Implement Logging for dev environment later
    /*var Log = {
      debug: function(message) {
        var d = new Date();
        console.log("[" + d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds() + ":" + d.getMilliseconds() + "] " + message);
      },
      dump: function(obj) {
        console.log("---------------------------------------------------------------------------------");
        console.log(obj);
        console.log("---------------------------------------------------------------------------------");
      }
    };*/

    var that = this;
    var reconnectInterval;
    var heartBeatTimeout;
    this.name = options.name;
    this.reconnect = true;
    var socket;
    options.heartBeatTime = options.heartBeatTime || 5000;
    var heartbeatCallbacks = {};

    var scheduleReconnect = function () {
      if (navigator.onLine) {
        reconnectInterval = setInterval(function () {
          openSocket(options.socketUrl);
        }, 5000);
      }
    };

    var openSocket = function (url) {
      if (!socket){
        socket = new SockJS(url);
        socket.onopen = function () {
          clearInterval(reconnectInterval);
          socket.send(JSON.stringify({
              action: "subscribe",
              channel: options.name
          }));
          that.emit("open");
          heartBeatTimeout = setTimeout(doHeartbeat, options.heartBeatTime);
        };
        socket.onmessage = function (e) {
          var message = JSON.parse(e.data);
          if (message.type === 'pong') {
            var callback = heartbeatCallbacks[message.data];
            callback && callback();
          }
          if (message.type === 'message') {
            that.emit("message", message.data);
          }
        };
        socket.onclose = function () {
          socket = false;
          clearTimeout(heartBeatTimeout);
          if (that.reconnect) {
            scheduleReconnect();
          }
          that.emit("close");
        };
      }
    };

    var online = function (e) {
      //Log.debug('online');
      // seem to need a slight delay here before reconnecting
      setTimeout(openSocket(options.socketUrl), 100);
    };

    var offline = function (e) {
      //Log.debug('offline');
      that.emit('close');
    };

    var monitorOnline = function () {
      window.addEventListener('online', online);
      window.addEventListener('offline', offline);
    };

    this.close = function () {
      //Log.debug('Closing Socket Connection...');
      window.removeEventListener('online', online);
      window.removeEventListener('offline', offline);
      this.reconnect = false;
      socket.close();
      socket = false;
    };

    function pingServer() {
      var dfd = new jQuery.Deferred();
      var id = Math.floor(Math.random() * 999999999);
      var timeout = setTimeout(function() {
        dfd.reject();
      }, 5000);

      heartbeatCallbacks[id] = function() {
        clearTimeout(timeout);
        dfd.resolve();
      };
      socket.send(JSON.stringify({
        action: "ping",
        id: id
      }));
      return dfd.promise();
    }

    function doHeartbeat() {
      pingServer().then(function() {
        heartBeatTimeout = setTimeout(doHeartbeat, options.heartBeatTime);
      }).fail(function() {
        socket.close();
        socket = false;
        if (that.reconnect) {
          openSocket(options.socketUrl);
        }
      });
    }

    monitorOnline();
    openSocket(options.socketUrl);
  };

  return PushChannel;
}());
