
var CanvasObject = Class.extend({
	init: function(selector) {
		this.canvas = document.getElementById(selector);
		this.ctx = this.canvas.getContext("2d");
		this.objects = [];

		var self = this;
		this.canvas.addEventListener("click", function(e) {self.onclick(e);}, this);
		this.canvas.addEventListener("mousemove", function(e) {self.onmousemove(e);}, this);
	},

	onmousemove: function(e) {
		// get coords in the canvas
		var x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft - this.canvas.offsetLeft;
		var y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop - this.canvas.offsetTop;

		this.objects.forEach(function(o) {
			o.mousemove(x,y);
		});
	},

	onclick: function(e) {
		// get coords in the canvas
		var x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft - this.canvas.offsetLeft;
		var y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop - this.canvas.offsetTop;

		this.objects.forEach(function(o) {
			o.click(x,y);
		});
	},

	add: function(obj) {
		var co = this;
		obj.parent = this;
		this.objects.push(obj);
	},

	draw: function() { 
		var ctx = this.ctx;
		this.objects.forEach(function(o) {
			ctx.save();
			o.draw(ctx, 0, 0);
			ctx.restore();
		});
	},

	redraw: function() {
		this.ctx.save();
		this.draw(this.ctx, this.deltaX, this.deltaY);
		this.ctx.restore();
	}
});

var CanvasSprite = Class.extend({
	init: function(options) {
		this.containsMouse = false;
		for(k in options) {
			this[k] = options[k];
		}
		this.children = [];
	},
	invalidate: function() {
		this.redraw();
	},
	draw: function(ctx, deltaX, deltaY) {
		this.savePosition(ctx, deltaX, deltaY);
		deltaX += this.x;
		deltaY += this.y;
		this.children.forEach(function(o) {
			o.draw(ctx, deltaX, deltaY);
		});
	},
	redraw: function() {
		this.ctx.save();
		this.draw(this.ctx, this.deltaX, this.deltaY);
		this.ctx.restore();
	},
	savePosition: function(ctx, deltaX, deltaY) { // TODO: find a better way to do this?
		this.ctx = ctx;
		this.deltaX = deltaX;
		this.deltaY = deltaY;
	},

	onclick: function(x,y) {},
	mouseEnter: function() {},
	mouseLeave: function() {},
	contains: function(x,y) {return false;},

	mousemove: function(x,y) {

		// check mousemove in all sub-children.
		var deltaX = this.x, deltaY = this.y;
		this.children.forEach(function(e) {
			e.mousemove(x - deltaX, y - deltaY);
		});

		// and then check myself.
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

	click: function(x,y) {

		// check mousemove in all sub-children.
		var deltaX = this.x, deltaY = this.y;
		this.children.forEach(function(e) {
			e.click(x - deltaX, y - deltaY);
		});

		// and then check myself.
		if(this.contains(x,y)) {
			this.onclick(x - deltaX,y - deltaY);
		}
	},

	appendChild: function(e) {
		e.parent = this;
		this.children.push(e);
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

	draw: function(ctx, deltaX, deltaY) {
		this.savePosition(ctx, deltaX, deltaY);

		// draw my points
		ctx.fillStyle = this.bgColor;
		ctx.beginPath();
		var p0 = this._points[0];
		ctx.moveTo(deltaX + p0.x, deltaY + p0.y);
		this._points.forEach(function(p) {
			ctx.lineTo(deltaX + p.x, deltaY + p.y);
		});
		ctx.lineTo(deltaX + p0.x, deltaY + p0.y);
		ctx.fill();

		// draw my sub-nodes, possibly over myself.
		var self = this;
		this.children.forEach(function(e) {
			e.draw(ctx, self.x + deltaX, self.y + deltaY);
		});
	}
});

var Cell = CanvasSprite.extend({
	
	init: function(x, y, w, h, options) {
		this.strokeStyle = "#000000";
		this.lineWidth = 1;
		this.bgColor = "#eeeeee";
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

	draw: function(ctx, deltaX, deltaY) {
		this.savePosition(ctx, deltaX, deltaY);

		ctx.strokeStyle = this.strokeStyle;
		ctx.lineWidth = this.lineWidth;
		ctx.fillStyle = this.bgColor;

		ctx.beginPath();
		var p0 = this._points[0];
		ctx.moveTo(deltaX + p0.x, deltaY + p0.y);
		this._points.forEach(function(p) {
			ctx.lineTo(deltaX + p.x, deltaY + p.y);
		});
		ctx.lineTo(deltaX + p0.x, deltaY + p0.y);
		ctx.fill();
		ctx.stroke();
	},

	contains: function(x,y) {

		var ctx = this.ctx;
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

		for(var i = 0; i < w; i++) {
			for(var j = 0; j < h; j++) {
				var cellX = i * (this.cellW / 2) - j * (this.cellW/2) - (this.cellW / 2);
				var cellY = j * (this.cellH / 2) + i * (this.cellH/2) - (this.cellH / 2);

				var c = new Cell(cellX, cellY, this.cellW, this.cellH, this.cellOptions);
				c.coords = {x: i, y:j};
				this.appendChild(c);
			}
		}
	},
});

