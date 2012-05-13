modules['tools'] = (function(exports, ui, socket){
    var hitOptions = {
        segments: true,
        stroke: true,
        fill: true,
        tolerance: 5
    };

    function switchTool(tool){
      if (paper.tool && paper.tool.deactivate) paper.tool.deactivate();
      if (tool.init) tool.init();
      else tool.activate();
    }

    function getPathUniqueId(path){
        return socket.socket.sessionId + '-' + path.id;
    }

    function publishNewPath(path){
      path.name = getPathUniqueId(path);
      var segments = [];
      for (var segmentIndex = 0; segmentIndex < path.segments.length; segmentIndex++){
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
      socket.emit('add path', {id: path.name, segments: segments, closed: path.closed});
    }

    var paintTool = new paper.Tool();
    paintTool.onMouseDown = function(event){
        this.path = new paper.Path();
        this.path.strokeColor = 'black';
        publishNewPath(this.path);
    }
    paintTool.onMouseDrag = function(event){
        this.path.add(event.point);
        socket.emit('add path point', {id: this.path.name, x: event.point.x, y: event.point.y});
    }
    paintTool.onMouseUp = function(event){
        this.path.simplify();
        socket.emit('end path', {id: this.path.name})
    }

    var rectTool = new paper.Tool();
    rectTool.onMouseDown = function(event){
        this.angle = 0;
        this.origin = event.point;
        this.path = new paper.Path.Rectangle(event.point, new paper.Size(1,1));
        this.path.strokeColor = 'black';
        //this.path.fillColor = '#FEFBEB';
        //this.path.opacity = 0.5;
        publishNewPath(this.path);
    }
    rectTool.onMouseDrag = function(event){
        var size = event.point.subtract(this.origin);
        var angle = size.angle - 45;
        var angleDelta = angle - this.angle;
        this.angle = angle;
        this.path.rotate(angleDelta);
        var w = Math.abs(size.x) > Math.abs(size.y) ? size.x : size.y;
        var r = new paper.Rectangle(this.origin.x - w, this.origin.y - w, 2*w, 2*w);
        this.path.fitBounds(r);
        socket.emit('fit path', {id: this.path.name, rect: r, angle: angleDelta});
    }

    var textTool = new paper.Tool();
    textTool.onMouseDown = function(event){
        this.origin = event.point;
        //var r = new paper.Rectangle(event.point, new paper.Point(event.point.x+200,event.point.y+100));
        //this.path = paper.Path.Rectangle(r)
        //this.path.fillColor = '#e9e9ff';
        //this.path.selected = true;

        $.modal("<div><form id=math><input/><button>Send</button></form></div>", {
            overlayClose:true,
            opacity:70,
            overlayCss:{backgroundColor:"#000"},
            onShow: function(event){
              $('#math').submit(function(){
                  var input = new paper.PointText(event.point);
                  var div = MathJax.Hub.getAllJax("MathDiv")[0];
                  var math = $('input', '#simplemodal-data').val();
                  if (math.length>0){
                    MathJax.Hub.Queue(["Text", div, math])
                    socket.emit('text math', math)
                  }
                  $.modal.close();
                  return false;
              });
            }
        });
    }
    textTool.onKeyDown = function(event){
      // derp
    }

    var clearTool = new paper.Tool();
    clearTool.onMouseDown = function(event){
      var path = paper.project.activeLayer.firstChild;
      while(path){
        path.removeSegments();
        path = path.nextSibling;
      }
      paper.view.draw();
      socket.emit('clear paper');
    }

    ui.addButton('tools', 'tools', 'images/paintbrush.png', function(){switchTool(paintTool);});
    ui.addButton('tools', 'tools', 'images/rect.png', function(){switchTool(rectTool);});
    ui.addButton('tools', 'tools', 'images/text.png', function(){switchTool(textTool);});
    ui.addButton('tools', 'tools', 'images/clear.png', function(){ switchTool(clearTool);});
});
