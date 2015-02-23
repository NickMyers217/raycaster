//Static utility object
var Util = {
	toRadians: function(degrees) {
		return degrees * Math.PI / 180;
	},
	twoPI: Math.PI * 2
};


//Class constructors
function Canvas(canvasId, width, height) {
	this.canvas = document.getElementById(canvasId);
	this.width = this.canvas.width = width;
	this.height = this.canvas.height = height;
	this.ctx = this.canvas.getContext('2d');
}

function Projection(canvas, stripWidth, fov) {
	this.canvas = canvas;
	this.width = canvas.width;
	this.height = canvas.height;
	this.ctx = canvas.ctx;
	this.stripWidth = stripWidth;
	this.stripCount = this.width / stripWidth;
	this.fov = Util.toRadians(fov);
	this.distance = (this.width / 2) / Math.tan(this.fov / 2);
	this.rays = this.initRays();
}

function Map(width, height, scale, minimapCanvasId) {
	this.width = width;
	this.height = height;
	this.scale = scale;
	this.minimap = new Canvas(minimapCanvasId, width * scale, height * scale);
	this.level = this.initLevel();
}

function Player(x, y, size, rotation, color) {
	this.x = x;
	this.y = y;
	this.color = color;
	this.size = size;
	this.rot = Util.toRadians(rotation);
	this.moveSpeed = 1;
	this.rotSpeed = 1;
}


//Canvas prototype
Canvas.prototype.clear = function() {
	this.ctx.clearRect(0, 0, this.width, this.height);
};


//Projection prototype
Projection.prototype.initRays = function() {
	var rays = [];
	for(var i = 0; i < this.stripCount; i++) {
		var ray = {};
		ray.projPos = (-this.stripCount / 2 + i) * this.stripWidth;
		ray.projDist = Math.sqrt(ray.projPos * ray.projPos + this.distance * this.distance);
		rays.push(ray);
	}
	return rays;
};

Projection.prototype.castRays = function() {

};


//Map prototype
Map.prototype.initLevel = function() {
	var level = [];
	for(var y = 0; y < this.height; y++) {
		var row = [];
		for(var x = 0; x < this.width; x++) {
			var num = Math.random();
			if(num < 0.2)
				row.push(1);
			else
				row.push(0);
		}
		level.push(row);
	}
	return level;
};

Map.prototype.renderMinimap = function(player) {
	var ctx = this.minimap.ctx, scale = this.scale;
	for(var y = 0; y < this.height; y++) {
		for(var x = 0; x < this.width; x++) {
			var cell = this.level[y][x];
			if(cell == 1) {
				ctx.fillStyle = 'gray';
				ctx.fillRect(x * scale, y * scale, scale, scale);
			}
			// ctx.strokeStyle = 'black';
			// ctx.strokeRect(x * scale, y * scale, scale, scale);
		}
	}

	ctx.fillStyle = player.color;
	ctx.fillRect(player.x * scale - player.size / 2, player.y * scale - player.size / 2, player.size, player.size);
	ctx.strokeStyle = 'green';
	ctx.beginPath();
	ctx.moveTo(player.x * scale, player.y * scale);
	ctx.lineTo((player.x + Math.cos(player.rot)) * scale, (player.y + Math.sin(player.rot)) * scale);
	ctx.stroke();
};


//Main function
window.onload = function main() {
	var map = new Map(10, 10, 40, 'minimap');
	var projection = new Projection(new Canvas('screen', 600, 480), 2, 60);
	var player = new Player(5, 5, 10, 30, 'red');
	
	map.renderMinimap(player);
}

