//Constructors
function Canvas(canvasid, width, height) {
	this.canvas = document.getElementById(canvasid);
	this.width = this.canvas.width = width;
	this.height = this.canvas.height = height;
	this.ctx = this.canvas.getContext('2d');
}

function Projection(canvas, stripWidth, fov) {
	this.canvas = canvas;
	this.width = this.canvas.width;
	this.height = this.canvas.height;
	this.stripWidth = stripWidth;
	this.fov = fov;
	this.rayCount = Math.floor(this.width / this.stripWidth);
	this.viewDistance = (this.width / 2) / Math.tan(this.fov / 2);
	this.rays = this.initRays();
}

function Ray() {
	this.angle = 0;
	this.hitX = 0;
	this.hitY = 0;
	this.distance = 0;
}

function Map() {
	this.level = [
		[1,1,1,1,1,1,1,1,1,1],
		[1,0,0,0,0,0,0,0,0,1],
		[1,0,0,0,0,0,0,0,0,1],
		[1,0,0,0,0,0,1,0,0,1],
		[1,0,0,0,0,0,1,0,0,1],
		[1,0,0,0,1,1,1,0,0,1],
		[1,0,0,0,1,1,1,0,0,1],
		[1,0,0,0,0,0,1,0,0,1],
		[1,0,0,0,0,0,0,0,0,1],
		[1,1,1,1,1,1,1,1,1,1]
	];
	this.width = this.level[0].length;
	this.height = this.level.length;
	this.scale = 20;
}

function Player(x, y, rot) {
	this.x = x;
	this.y = y;
	this.size = 10;
	this.color = 'red';
	this.rot = rot;
	this.moveSpeed = 0.05;
	this.rotSpeed = 6;
}

function Controls() {
	this.codes  = { 37: 'left', 39: 'right', 38: 'forward', 40: 'backward' };
	this.states = { 'left': false, 'right': false, 'forward': false, 'backward': false };
	document.addEventListener('keydown', this.onKey.bind(this, true), false);
	document.addEventListener('keyup', this.onKey.bind(this, false), false);
}



//Controls prototype
Controls.prototype.onKey = function(val, e) {
	var state = this.codes[e.keyCode];
	if (typeof state === 'undefined') return;
	this.states[state] = val;
	e.preventDefault && e.preventDefault();
	e.stopPropagation && e.stopPropagation();
};



//Canvas prototype
Canvas.prototype.render = function() {
	this.ctx.fillStyle = 'black';
	this.ctx.fillRect(0, 0, this.width, this.height);
};

Canvas.prototype.renderMiniMap = function(map, player, projection) {
	this.clear();

	for(var y = 0; y < map.height; y++) {
		for(var x = 0; x < map.width; x++) {
			if(map.level[y][x] == 1) {
				this.ctx.fillStyle = 'gray';
				this.ctx.fillRect(x * map.scale, y * map.scale, map.scale, map.scale);

			}

			this.ctx.strokeStyle = 'black';
			this.ctx.strokeRect(x * map.scale, y * map.scale, map.scale, map.scale);
		}
	}

	this.ctx.fillStyle = player.color;
	this.ctx.fillRect(
		(player.x * map.scale) - (player.size / 2),
		(player.y * map.scale) - (player.size / 2),
		player.size, player.size
	);


	this.ctx.strokeStyle = 'black';
	this.ctx.beginPath();
	this.ctx.moveTo(player.x * map.scale, player.y * map.scale);
	this.ctx.lineTo(
		(player.x + Math.cos(player.rot)) * map.scale,
		(player.y + Math.sin(player.rot)) * map.scale
	);
	this.ctx.closePath();
	this.ctx.stroke();

	for(var i = 0; i < projection.rays.length; i++) {
		// this.ctx.strokeStyle = 'rgba(0,100,0,0.3)';
		// this.ctx.lineWidth = 0.5;
		// this.ctx.beginPath();
		// this.ctx.moveTo(player.x * map.scale, player.y * map.scale);
		// this.ctx.lineTo(
		// 	projection.rays[i].hitX * map.scale,
		// 	projection.rays[i].hitY * map.scale
		// );
		// this.ctx.closePath();
		// this.ctx.stroke();
	}
};

Canvas.prototype.clear = function() {
	this.ctx.clearRect(0, 0, this.width, this.height);
};



//Projection prototype
Projection.prototype.initRays = function() {
	var rays = [];
	for(var i = 0; i < this.rayCount; i++) {
		rays.push(new Ray());
	}
	return rays;
};

Projection.prototype.castRays = function(map, player) {
	for(var i = 0; i < this.rays.length; i ++) {
		var ray = this.rays[i];
		ray.angle = ray.getAngle(player, this.rayCount, i, this.stripWidth, this.viewDistance);
	}
};



//Ray Prototype
Ray.prototype.getAngle = function(player, rayCount, i, stripWidth, viewDistance) {
	var rayStripPos = (-rayCount / 2 + i) * stripWidth;
	var rayDiagDist = Math.sqrt(rayStripPos * rayStripPos + viewDistance * viewDistance);
	var rayAngle = player.rot + Math.asin(rayStripPos / rayDiagDist);

	rayAngle %= Math.PI * 2;
	if(rayAngle < 0) rayAngle += Math.PI * 2;

	return rayAngle;
};

Ray.prototype.getRayHit = function(rayAngle, map, player) {

};



//Player prototype
Player.prototype.update = function(controls) {
	var moveVec = 0;

	if(controls.forward) moveVec = this.moveSpeed;
	if(controls.backward) moveVec = -1 * this.moveSpeed;
	if(controls.left) this.rot += -1 * this.rotSpeed * Math.PI / 180;
	if(controls.right) this.rot += this.rotSpeed * Math.PI / 180;

	while(this.rot < 0) this.rot += Math.PI * 2;
	while(this.rot >= Math.PI * 2) this.rot -= Math.PI * 2;

	this.x += Math.cos(this.rot) * moveVec;
	this.y += Math.sin(this.rot) * moveVec;
};



window.onload = function main() {
	var projection = new Projection(new Canvas('screen', 600, 480), 1, 60 * Math.PI / 180);
	var minimap = new Canvas('minimap', 200, 200);
	var map = new Map();
	var player = new Player(2, 2, 0);
	var controls = new Controls();

	loop();

	function loop() {
		player.update(controls.states);
		projection.castRays(map, player);
		projection.canvas.render();
		minimap.renderMiniMap(map, player, projection);

		setTimeout(loop, 1000 / 30);
	}
};