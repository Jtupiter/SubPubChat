this["TMJST"] = this["TMJST"] || {};

this["TMJST"]["public/templates/chatRoom.html"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {
__p += '<span style="float:right">\n    <label>Switch Rooms:</label>\n    <input type="text" id="roomName" name="roomName">\n    <button class="btn btn-primary switchRooms">Go</button>\n</span>\n<h2 style="display:inline;">Main Room</h2>\n<div id="chatBox">\n    <ul id="messages">\n      ';
 _.each(messageData, function(data) { ;
__p += '\n        <li><span class="username"><b>' +
((__t = ( data.name )) == null ? '' : __t) +
'</b></span><b> says: </b><span class="message">' +
((__t = ( data.message )) == null ? '' : __t) +
'</span></li>\n      ';
 }); ;
__p += '\n    </ul>\n</div>\n<input type="text" id="message" name="message"><button class="btn btn-primary" id="sendMessage">Send</button>';

}
return __p
};