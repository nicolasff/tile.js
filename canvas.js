
var CanvasObject = Class.extend({
	init: function(selector) {
		this.canvas = document.getElementById(selector);
		this.ctx = this.canvas.getContext("2d");
		this.objects = [];

		var self = this;
		this.canvas.addEventListener("click", function(e) {self.onclick(e);}, this);
		this.canvas.addEventListener("mousemove", function(e) {self.onmousemove(e);}, this);
	},

	onclick: function(e) {
		// get coords in the canvas
		var x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft - this.canvas.offsetLeft;
		var y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop - this.canvas.offsetTop;

		this.objects.forEach(function(o) {
			if(o.contains(x,y)) {
				o.onclick(x,y);
			}
		});
	},

	onmousemove: function(e) {
		// get coords in the canvas
		var x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft - this.canvas.offsetLeft;
		var y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop - this.canvas.offsetTop;

		this.objects.forEach(function(o) {
			o.mousemove(x,y);
		});

	},

	add: function(obj) {
		var co = this;
		obj.parent = function() { return co; };
		this.objects.push(obj);
	},

	draw: function() { 
		this.objects.forEach(this.redraw);
	},

	redraw: function(o) {
		var ctx = this.ctx;
		ctx.save();
		o.draw(ctx);
		ctx.restore();
	}
	
});

var CanvasSprite = Class.extend({
	init: function(options) {
		this.containsMouse = false;
		for(k in options) {
			this[k] = options[k];
		}
	},
	invalidate: function() {
		this.parent().redraw(this);
	},
	draw: function(ctx) {},
	onclick: function(x,y) {},
	mouseEnter: function() {},
	mouseLeave: function() {},
	contains: function(x,y) {return false;},

	mousemove: function(x,y) {
		if(this.contains(x,y)) {
			if(this.containsMouse == false) {
				this.containsMouse = true;
				this.mouseEnter();
			}
		} else if(this.containsMouse) {
			this.containsMouse = false;
			this.mouseLeave();
		}
	},
});


var Rectangle = CanvasSprite.extend({
	init: function(x, y, w, h, options) {
		if(options == undefined) {
			options = {};
		}
		this._super(options);
		this.x = x;
		this.y = y;
		this.w = w;
		if(h == undefined) {
			h = w;
		}
		this.h = h;
		if(this.bgColor == undefined) {
			this.bgColor = "#000000";
		}

		this._points = [
			{x: this.x, y: this.y},
			{x: this.x + this.w, y: this.y},
			{x: this.x + this.w, y: this.y + this.h},
			{x: this.x, y: this.y + this.h}];
	},

	points: function() {
		return this._points;
	},

	contains: function(x,y) {
		return (x > this.x && x <= this.x + this.w && y > this.y && y <= this.y + this.h);
	},

	draw: function(ctx) {
		ctx.fillStyle = this.bgColor;
		ctx.beginPath();
		var p0 = this._points[0];
		ctx.moveTo(p0.x, p0.y);
		this._points.forEach(function(p) {
			ctx.lineTo(p.x, p.y);
		});
		ctx.lineTo(p0.x, p0.y);
		ctx.fill();
	}
});

var Cell = CanvasSprite.extend({
	
	init: function(x, y, w, h, options) {
		this.lineStyle = "#000000";
		this.lineWidth = 1;
		this.fillStyle = "#eeeeee";
		this._super(options);
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;

		this._points = [
			{x:this.x + this.w/2,	y: this.y},
			{x:this.x + this.w,	y: this.y + this.h/2},
			{x:this.x + this.w/2,	y: this.y + this.h},
			{x:this.x,		y: this.y + this.h/2}];
	},

	draw: function(ctx) {

		ctx.lineStyle = this.lineStyle;
		ctx.lineWidth = this.lineWidth;
		ctx.fillStyle = this.fillStyle;

		ctx.beginPath();
		var p0 = this._points[0];
		ctx.moveTo(p0.x, p0.y);
		this._points.forEach(function(p) {
			ctx.lineTo(p.x, p.y);
		});
		ctx.lineTo(p0.x, p0.y);
		ctx.fill();
		ctx.stroke();
	},

	contains: function(x,y) {
		
		var ctx = this.parent().ctx;
		ctx.beginPath();
		ctx.moveTo(this._points[0].x, this._points[0].y);
		for(var i = 0; i <= 4; i++) {
			ctx.lineTo(this._points[i % 4].x, this._points[i % 4].y);
		}

		var ret = ctx.isPointInPath(x,y);
		return ret;
	}
});


var Map = CanvasSprite.extend({
	
	cellW: 100,
	cellH: 50,

	init: function(x,y,w,h,options) {
		this.cellOptions = {},
		this._super(options);
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;

		this.cells = [];
		for(var i = 0; i < w; i++) {
			for(var j = 0; j < h; j++) {
				var cellX = this.x + i * (this.cellW / 2) - j * (this.cellW/2) - (this.cellW / 2);
				var cellY = this.y + j * (this.cellH / 2) + i * (this.cellH/2) - (this.cellH / 2);

				var c = new Cell(cellX, cellY, this.cellW, this.cellH, this.cellOptions);
				this.cells.push(c);
			}
		}
	},

	draw: function(ctx) {
		var map = this;
		this.cells.forEach(function(c) {
			c.parent = map.parent;
			c.draw(ctx);
		});
	},

	mousemove: function(x,y) {
		this.cells.forEach(function(c) {
			c.mousemove(x,y);
		});
	},

	contains: function(x,y) {
		for(var i = 0; i < this.cells.length; i++) {
			if(this.cells[i].contains(x,y)) {
				return true;
			}
		}
		return false;
	},

	onclick: function(x,y) {

		this.cells.forEach(function(c) {
			if(c.contains(x,y)) {
				c.onclick(x,y);
			}
		});
	},
});

