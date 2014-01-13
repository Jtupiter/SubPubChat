var ChatRoom = Backbone.View.extend({
    el: "#chatRoom",
    template: TMJST["public/templates/chatRoom.html"],
    events: {
      "click .switchRooms": "switchRooms",
      "click #sendMessage": "sendMessage"
    },
    switchRooms: function() {
      var roomName = $("#roomName").val();
      if(roomName.replace(/\s/g, '')) {
        this.pushChannel.close();
        var newRoom = new ChatRoom({ name: roomName });
        $.post("/message", { name: "SubPubChat", channel: roomName, message: "User: " + name + " has joined the room!" });
        newRoom.render();
        this.undelegateEvents();
      }
    },
    sendMessage: function() {
      var message = $("#message").val();
      var that = this;
      if(message.replace(/\s/g, '')) {
        $.post("/message", { name: name, channel: this.roomName, message: message});
      }
    },
    initialize: function (data) {
        console.log('Chat Room Initialized');
        this.chatRoomData = data;
        var that = this;
        this.roomName = data.name || "main";
        this.messages = new Backbone.Collection([{ name: "SubPubChat", message: "Welcome " + name + " to the Room: " + this.roomName }]);
        this.messages.on("add", function(message) {
          that.render();
        });
        this.pushChannel = new PushChannel({
          name: this.roomName,
          socketUrl: "http://jtupiter.com:3030/push"
        });
        this.pushChannel.on("message", function(message) {
          that.messages.add([JSON.parse(message)]);
        });
    },
    render: function () {
        var that = this;
        this.$el.empty();
        this.$el.append(this.template({ messageData: this.messages.toJSON(), name: name }));
    },
    close: function() {
      console.log("closing chatroom view")
      this.undelegateEvents();
      this.remove();
    }
});