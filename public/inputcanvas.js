/*
 * InputCanvas is a Javascript library to add input support to the canvas element
 *
 * @package     InputCanvas
 * @author      Zoli Issam <jawbfl@gmail.com><http://twitter.com/JawBfl>
 * @copyright   (c) 2011 Zoli Issam
 * @license     Licenced under the GPLv3
 * @version     InputCanvas v 1.1
 * @diary
   09/11/2011 -> write essential functions , define proprieties
   10/11/2011 -> events handling , the loop
   11/11/2011 -> drawing , border radius , shadow/light , create form class and support for multiple inputs ,
                 modify event handlers to catch events for all inputs.
   12/11/2011 -> cursor onfocus , defining text zone , writing and deleting , cursor movement
   xx/11/2011 -> move cursor on right & left , onclick set cursor position
   xx/11/2011 -> handling switching between inputs.
*/

function InputCanvas(x,y,width,height)
{
    this.x          = x;                                           // Top left corner X
    this.y          = y;                                           // Top left corner Y
    this.width      = width;                                       // Width
    this.height     = height;                                      // Height
    this.bg         = '#FFFFFF';                                   // Background color
    this.padding    = [2, 2, 2, 2];                                // Padding {top right,bottom,left}
    this.border     = {size:2, color:'#000000', radius:[0,0,0,0]}; // Border {size in px, color, radius}
    this.font       = {size:16, color:'#000000', family:'Arial'};  // Font {size in pt, color, family}
    this.shadow     = {color:'#FFFFFF',x:0,y:0,blur:0};            // Shadow {Color,offsetX,offsetY,Blur}
    this.value      = '';                                          // Value
    this.valuep     = '';                                          // Previous value
    this.mousein    = false;                                       // Mouse Status
    this.mouseinp   = false;                                       // Mouse Previous Status
    this.focus      = false;                                       // Focus status
    this.dir        = 'ltr';                                       // Direction ltr or rtl
    this.id         = '';                                          // Identifier
    
    // Default event hundlers.
    this.onMouseMove = function (){};
    this.onMouseOver = function (){};
    this.onMouseOut  = function (){};
    this.onMouseDown = function (){};
    this.onMouseUp   = function (){};
    this.onKeyDown   = function (){};
    this.onKeyUp     = function (){};
    this.onKeyPress  = function (){};
    this.onBlur      = function (){};
    this.onFocus     = function (){};
    this.onClick     = function (){};
    //this.onChange  = function (){};
    //this.onHover   = function (){};

    /**
        * Set border proprieties.
        *
        * @param int size	  : Size of border in pixel.
        * @param string color : Color of border (Hex).
        * @param array radius : Border radius [top right,bottom,left].
        * @return void
        * @access public
    */
    this.Border = function (size, color, radius) {
        this.border.size   = size;
        this.border.color  = color || '#000000';
        this.border.radius = radius || [0, 0, 0, 0];
    };

    /**
        * Set padding.
        *
        * @param array padding : [top right,bottom,left].
        * @return void
        * @access public
    */  
    this.Padding = function (padding) {
        this.padding = padding;
    };

    /**
        * Set font proprieties.
        *
        * @param int size	   : Size of border in pixel.
        * @param string color  : Color of border (Hex).
        * @param string family : Font family.
        * @return void
        * @access public
    */
    this.Font = function (size, color, family) {
        this.font.size   = size;
        this.font.color  = color  || '#000000';
        this.font.family = family || 'Arial';
    };

    /**
        * Set shadow/light proprieties.
        *
        * @param string color : Color of border (Hex).
        * @param int x	      : Offset x in pixel.
        * @param int y	      : Offset y in pixel.
        * @param int blur     : Blur.
        * @return void
        * @access public
    */
    this.Shadow = function (color, x, y, blur) {
        this.shadow.color  = color;
        this.shadow.x   = x;
        this.shadow.y   = y;
        this.shadow.blur   = blur;
    };
}

function FormCanvas(canvas)
{
    var  object     = this;
    this.canvas     = canvas;                  // HTML canvas element
    this.context    = canvas.getContext("2d"); // Context of canvas
    this.inputs     = [];                      // Array of inputs
    this.fps        = 30;                      // Frame per second
    this.customDraw = function (){};           // Custom drawing other things that you want to draw on the canvas
    this.curpos     = 0;                       // Cursor position
    this.curview    = false;                   // Cursor Display
    this.curdelay   = 600;                     // Cursor flash time

    /**
        * Initiate drawing.
        *
        * @return void
        * @access public
    */
    this.Init = function () {
        this.Draw();
        setInterval(function(){object.Draw();},1000/this.fps);
        setInterval(function(){object.curview = !object.curview;},object.curdelay);
    };
    
    this.addInput = function (x,y,width,height) {
        var ni = new InputCanvas(x,y,width,height); 
        this.inputs.push(ni);
        return ni;
    };
    
    // Events catching and handling
    // * Mouse events
    canvas.onmousemove = function(e){
        posx = e.offsetX?(e.offsetX):e.pageX - canvas.offsetLeft;
        posy = e.offsetY?(e.offsetY):e.pageY - canvas.offsetTop;
        for(var i=0; i<object.inputs.length; i++)
        {
            xw   = object.inputs[i].x + object.inputs[i].width;
            yh   = object.inputs[i].y + object.inputs[i].height;
            object.inputs[i].mouseinp = object.inputs[i].mousein;
            if(posx > object.inputs[i].x && posx < xw && posy > object.inputs[i].y && posy < yh) {
                object.inputs[i].mousein = true;
                if(!object.inputs[i].mouseinp) object.inputs[i].onMouseOver();
                object.inputs[i].onMouseMove();
            }
            else {
                object.inputs[i].mousein = false;
                if(object.inputs[i].mouseinp) object.inputs[i].onMouseOut();
            }
        }
    };

    canvas.onmousedown = function(){
        for(var i=0; i<object.inputs.length; i++)
        {
            if(object.inputs[i].mousein) {
                object.inputs[i].onMouseDown();
            }
        }
    };

    canvas.onmouseup = function(){
        for(var i=0; i<object.inputs.length; i++)
        {
            if(object.inputs[i].mousein) {
                object.inputs[i].onMouseUp();
            }
        }
    };

    // * Keybord events
    document.onkeypress = function(e){
        for(var i=0; i<object.inputs.length; i++)
        {
            if(object.inputs[i].focus) {
                if(e.charCode != 0){
                    object.inputs[i].value = object.inputs[i].value+String.fromCharCode(e.charCode);
                }
                if(e.keyCode == 8){
                    object.inputs[i].value = object.inputs[i].value.substring(0,object.inputs[i].value.length-1);
                }
                object.context.font = object.inputs[i].font.size + 'px ' + object.inputs[i].font.family;
                var d = object.inputs[i].width - object.inputs[i].border.size - object.inputs[i].padding[3] - object.inputs[i].padding[1];
                var space = object.context.measureText(object.inputs[i].value).width;
                if(space > d) object.curpos = d;
                else object.curpos = object.context.measureText(object.inputs[i].value).width;
                object.inputs[i].onKeyPress();
            }
        }
    };

    document.onkeydown = function(){
        for(var i=0; i<object.inputs.length; i++)
        {
            if(object.inputs[i].focus) {
                object.inputs[i].onKeyDown();
            }
        }
    };

    document.onkeyup = function(){
        for(var i=0; i<object.inputs.length; i++)
        {
            if(object.inputs[i].focus) {
                object.inputs[i].onKeyUp();
            }
        }
    };

    // * Click events
    canvas.onclick = function(){
        for(var i=0; i<object.inputs.length; i++)
        {
            if(object.inputs[i].mousein) {
                object.inputs[i].onClick();
                if(!object.inputs[i].focus){
                    object.inputs[i].focus = true;
                    object.context.font = object.inputs[i].font.size + 'px ' + object.inputs[i].font.family;
                    var d = object.inputs[i].width - object.inputs[i].border.size - object.inputs[i].padding[3] - object.inputs[i].padding[1];
                    var space = object.context.measureText(object.inputs[i].value).width;
                    if(space > d) object.curpos = d;
                    else object.curpos = object.context.measureText(object.inputs[i].value).width;
                    object.inputs[i].onFocus();
                }
            }
            else {
                object.inputs[i].focus = false;
                object.inputs[i].onBlur();
            }
        }
    };

    /**
        * Draw shapes.
        *
        * @return void
        * @access public
    */
    this.Draw = function () {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.customDraw();
        for(var i=0; i < object.inputs.length; i++)
        {
            xw = object.inputs[i].x + object.inputs[i].width;
            yh = object.inputs[i].y + object.inputs[i].height;
        
            // Setting some coordinates
            var controls  = [];
            controls[0]   = {x : object.inputs[i].x , y : object.inputs[i].y};
            controls[1]   = {x : xw , y : object.inputs[i].y};
            controls[2]   = {x : xw , y : yh};
            controls[3]   = {x : object.inputs[i].x , y : yh};
            var linestart = [];
            linestart[0]  = {x : object.inputs[i].x + object.inputs[i].border.radius[0] , y : object.inputs[i].y};
            linestart[1]  = {x : xw , y : object.inputs[i].y + object.inputs[i].border.radius[1]};
            linestart[2]  = {x : xw - object.inputs[i].border.radius[2], y : yh};
            linestart[3]  = {x : object.inputs[i].x, y : yh - object.inputs[i].border.radius[3]};
            var lineend   = [];
            lineend[0]    = {x : xw - object.inputs[i].border.radius[1] , y : object.inputs[i].y};
            lineend[1]    = {x : xw , y : yh - object.inputs[i].border.radius[2]};
            lineend[2]    = {x : object.inputs[i].x + object.inputs[i].border.radius[3], y : yh};
            lineend[3]    = {x : object.inputs[i].x , y : object.inputs[i].y + object.inputs[i].border.radius[0]};
            var b         = object.inputs[i].border.size / 2;
            var textzone  = [];
            textzone[0]   = {x : object.inputs[i].x + object.inputs[i].padding[3] + b , y : object.inputs[i].y + object.inputs[i].padding[0] + b};
            textzone[1]   = {x : xw - object.inputs[i].padding[1] - b , y : object.inputs[i].y + object.inputs[i].padding[0] + b};
            textzone[2]   = {x : xw - object.inputs[i].padding[1] - b , y : yh - object.inputs[i].padding[2] - b};
            textzone[3]   = {x : object.inputs[i].x + object.inputs[i].padding[3] + b , y : yh - object.inputs[i].padding[2] - b};

            // Drawing Shapes
            this.context.beginPath();
            this.context.moveTo(linestart[0].x, linestart[0].y);
            this.context.lineTo(lineend[0].x, lineend[0].y);
            this.context.arcTo(controls[1].x,controls[1].y,linestart[1].x, linestart[1].y,object.inputs[i].border.radius[1]);
            this.context.lineTo(lineend[1].x, lineend[1].y);
            this.context.arcTo(controls[2].x,controls[2].y,linestart[2].x, linestart[2].y,object.inputs[i].border.radius[2]);
            this.context.lineTo(lineend[2].x, lineend[2].y);
            this.context.arcTo(controls[3].x,controls[3].y,linestart[3].x, linestart[3].y,object.inputs[i].border.radius[3]);
            this.context.lineTo(lineend[3].x, lineend[3].y);
            this.context.arcTo(controls[0].x,controls[0].y,linestart[0].x, linestart[0].y,object.inputs[i].border.radius[0]);
            this.context.shadowColor   = object.inputs[i].shadow.color;
            this.context.shadowBlur    = object.inputs[i].shadow.blur;
            this.context.shadowOffsetX = object.inputs[i].shadow.x;
            this.context.shadowOffsetY = object.inputs[i].shadow.y;
            this.context.fillStyle     = object.inputs[i].bg;
            this.context.fill();
            this.context.lineWidth     = object.inputs[i].border.size;
            this.context.strokeStyle   = object.inputs[i].border.color;
            this.context.stroke();
            this.context.closePath();
            
            // Clipping region
            this.context.save();
            this.context.beginPath();
            this.context.rect(textzone[0].x, textzone[0].y, textzone[1].x - textzone[0].x, textzone[3].y - textzone[0].y);
            this.context.closePath();
            this.context.clip();
            
            // Drawing Text
            this.context.font = object.inputs[i].font.size+'px '+object.inputs[i].font.family;
            this.context.fillStyle = object.inputs[i].font.color;
            this.context.textBaseline = 'bottom';
            var d = textzone[1].x - textzone[0].x;
            var space = this.context.measureText(object.inputs[i].value).width;
            if(space > d) var start = textzone[1].x - space;
            else start = textzone[0].x;
            this.context.fillText(object.inputs[i].value, start, textzone[3].y);
            this.context.restore();
            
            //Draw the cursor
            if(object.inputs[i].focus && object.curview) {
                len = object.inputs[i].font.size;
                this.context.beginPath();
                this.context.moveTo(textzone[3].x + object.curpos, textzone[3].y);
                this.context.lineTo(textzone[3].x + object.curpos, textzone[3].y - len);
                this.context.fillStyle = object.inputs[i].bg;
                this.context.fill();
                this.context.lineWidth = 2;
                this.context.lineCap = "butt";
                this.context.strokeStyle = object.inputs[i].font.color;
                this.context.stroke();
                this.context.closePath();
            }
        }
    };
}
