(function(exports){
    exports.setupReceiver = function(paper, socket, isServer){
        socket.on('add path', function(message){
            var path;
            if (typeof message.segments !== 'undefined' && message.segments.length > 0){
                var segments = [];
                for (var i = 0; i < message.segments.length; i++){
                    var segment = message.segments[i];
                    segments.push(new paper.Segment(
                        new paper.Point(segment.x, segment.y),
                        new paper.Point(segment.ix, segment.iy),
                        new paper.Point(segment.ox, segment.oy)));
                }
                path = new paper.Path(segments);
                path.closed = message.closed;
            }
            else path = new paper.Path();
            path.name = message.id;
            path.strokeColor = 'black';
            if (isServer) socket.broadcast.emit('add path', message);
            else paper.view.draw();
        });

        socket.on('add path point', function(message){
            if (typeof message == 'undefined' || typeof message.id == 'undefined') return;
            var path = paper.project.activeLayer.children[message.id];
            if (typeof path !== 'undefined'){
                path.add(new paper.Point(message.x, message.y));
                if (isServer) socket.broadcast.emit('add path point', message);
                else paper.view.draw();
            }
        });

        socket.on('end path', function(message){
            if (typeof message == 'undefined' || typeof message.id == 'undefined') return;
            var path = paper.project.activeLayer.children[message.id];
            if (typeof path !== 'undefined'){
                path.simplify();
                if (isServer) socket.broadcast.emit('end path', message);
                else paper.view.draw();
            }
        });

        socket.on('fit path', function(message){
            if (typeof message == 'undefined' || typeof message.id == 'undefined') return;
            var path = paper.project.activeLayer.children[message.id];
            if (typeof path !== 'undefined'){
                path.fitBounds(message.rect);
                path.rotate(message.angle);
                if (isServer) socket.broadcast.emit('fit path', message);
                else paper.view.draw();
            }
        });

        socket.on('text math', function(message){
          if (typeof message == 'undefined') return;
          if (isServer) socket.broadcast.emit('text math', message);
          else{
            var div = MathJax.Hub.getAllJax("MathDiv")[0];
            MathJax.Hub.Queue(["Text", div, message])
          }
        });

        socket.on('clear paper', function(){
          var path = paper.project.activeLayer.firstChild;
          while(path){
            path.removeSegments();
            path = path.nextSibling;
          }
          if (isServer) socket.broadcast.emit('clear paper');
          else paper.view.draw();
        });

    }
})(typeof window != 'undefined' ? window : module.exports);
