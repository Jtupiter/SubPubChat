var redis = require('redis'),
    EventEmitter = require('events').EventEmitter,
    _ = require('underscore'),
    sockjs = require('sockjs'),
    util = require('util');

var Channel = function (name, redisSub) {
  var thisChannel = this;
  this.name = name;
  console.log("Creating new channel: " + this.name);
  var clients = [];
  this.updateRedisSubscription = function(resubscribe) {
    if (clients.length === 1 || clients.length > 0 && resubscribe) {
      console.log("Subscribing to redis channel: " + thisChannel.name);
      redisSub.subscribe(thisChannel.name);
    } else if (clients.length === 0) {
      console.log("Channel " + thisChannel.name + " is empty - closing...");
      redisSub.unsubscribe(thisChannel.name);
      thisChannel.emit('close');
    }
  };
  this.updateRedisSubscription();
  this.removeClient = function (client) {
    try {
      client.close();
    } catch (e) {
      // ignorzo!
    }
    var index = clients.indexOf(client);
    clients.splice(index, 1);
    thisChannel.updateRedisSubscription();
  };
  this.addClient = function (client) {
    if (_.contains(clients, client)) {
      return;
    }
    client.on('close', function () {
      console.log("Channel " + thisChannel.name + " dropped a client");
      thisChannel.removeClient(client);
      this.emit('remove-client');
    });
    client.channel = this;
    clients.push(client);
    this.updateRedisSubscription();
  };
  this.send = function (message) {
    console.log("Redis message received. Pushing to " + clients.length + " clients! ");
    _.each(clients, function (client) {
      client.write(JSON.stringify({
        type: "message",
        data: message }));
    });
  };
  this.close = function () {
    _.each(clients, this.removeClient);
  };
  this.toString = function () {
    return "Channel: " + this.name + " (" + clients.length + " clients)";
  };
};
util.inherits(Channel, EventEmitter);

var PushServer = function (options) {
  this.channels = {};
  this.redisSub = redis.createClient()

  var that = this;
  sockServer = sockjs.createServer();
  sockServer.installHandlers(options.server, {prefix:'/push'});

  this.subscribeToRedis = function (channelName, client) {
    var then = this;
    var channel = this.channels[channelName];
    if (!channel) {
      channel = new Channel(channelName, that.redisSub);
      channel.on('close', function () {
        delete then.channels[channelName];
      });
      this.channels[channelName] = channel;
    }
    channel.addClient(client);
    return channel;
  };

  sockServer.on('connection', function (client) {
    console.log("Connected to Websocket: " + client);
    client.on('data', function (message) {
      var data = JSON.parse(message);
      if (data.action === "subscribe") {
        var channel = data.channel;
        if (!channel) {
          console.log("Subscribe action with no channel - closing socket!");
          client.close();
        } else {
          console.log("Subscribing to channel: " + channel)
          that.subscribeToRedis(channel, client);
        }
      }
      else if (data.action === "ping") {
        client.write(JSON.stringify({
          type: "pong",
          data: data.id
        }));
      }
    });
  });

  this.redisSub.on('message', function (channel, data) {
    console.log("Message Received, Send to Client");
    console.log("Message: " + data);
    that.channels[channel].send(data);
  });
};
util.inherits(PushServer, EventEmitter);

module.exports = PushServer;