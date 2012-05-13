var express = require('express')
  , stylus = require('stylus')
  , dateformat = require('dateformat');

var app = module.exports = express.createServer();

// socket io
var io = require('socket.io').listen(app)
  , receiver = require('./public/receiver')
  , paper = require('paper')
  , nicknames = {};

function publishPathsToClient(socket){
    var path = paper.project.activeLayer.firstChild;
    while(path){
      var segments = [];
      for (var segmentIndex = 0; segmentIndex < path.segments.length; ++segmentIndex){
          var segment = path.segments[segmentIndex];
          segments.push({
            x: segment.point.x,
            y: segment.point.y,
            ix: segment.handleIn.x,
            iy: segment.handleIn.y,
            ox: segment.handleOut.x,
            oy: segment.handleOut.y
          });
      }
      var message = {
          id: path.name,
      };
      if (segments.length > 0){
          message.segments = segments;
      }
      message.closed = path.closed;
      socket.emit('add path', message);
      path = path.nextSibling;
    }
}

app.listen(3000, function(){
  console.log("Express server, listening on port %d in %s mode", app.address().port, app.settings.env);
});

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(stylus.middleware({src:__dirname+"/public"}));
  app.use(express.static(__dirname + '/public'));
  app.use(express.errorHandler())
  app.use(express.bodyParser());

});

app.get('/', function(req,res){
    res.render('index', {layout:false});
});

paper.setup();

io.set('log level', 1);

io.sockets.on('connection', function(socket){
  publishPathsToClient(socket);
  receiver.setupReceiver(paper, socket, true);

  socket.on('user message', function(msg){
    socket.broadcast.emit('user message', socket.nickname, msg);
  });

  socket.on('nickname', function(nick, fn){
    if (nicknames[nick]){
      fn(true);
    } else {
      fn(false);
      nicknames[nick] = socket.nickname = nick;
      socket.broadcast.emit('announcement', nick + ' connected');
      io.sockets.emit('nicknames', nicknames);
    }
  });

  socket.on('disconnect', function(){
    if (!socket.nickname) return;

    delete nicknames[socket.nickname];
    socket.broadcast.emit('announcement', socket.nickname + ' disconnected');
    io.sockets.emit('nicknames', nicknames);
  });
});

