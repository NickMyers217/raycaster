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

function Controls() {
    this.codes  = { 37: 'left', 39: 'right', 38: 'forward', 40: 'backward' };
    this.states = { 'left': false, 'right': false, 'forward': false, 'backward': false };
    document.addEventListener('keydown', this.onKey.bind(this, true), false);
    document.addEventListener('keyup', this.onKey.bind(this, false), false);
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
    this.moveSpeed = 0.025;
    this.rotSpeed = 3;
}

function Projection(canvas, stripWidth, fov) {
    this.canvas = canvas;
    this.width = canvas.width;
    this.height = canvas.height;
    this.stripWidth = stripWidth;
    this.stripCount = this.width / stripWidth;
    this.fov = Util.toRadians(fov);
    this.distance = (this.width / 2) / Math.tan(this.fov / 2);
    this.rays = this.initRays();
}

function Ray(stripIndex, stripCount, stripWidth, distance) {
    this.projPos = (-stripCount / 2 + stripIndex) * stripWidth;
    this.projDist = Math.sqrt(this.projPos * this.projPos + distance * distance);
    this.angle = Math.asin(this.projPos / this.projDist);
}



//Canvas prototype
Canvas.prototype.clear = function() {
    this.ctx.clearRect(0, 0, this.width, this.height);
};

Canvas.prototype.drawLine = function(color, width, x1, y1, x2, y2) {
    var ctx = this.ctx;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
};



//Controls prototype
Controls.prototype.onKey = function(val, e) {
    var state = this.codes[e.keyCode];
    if (typeof state === 'undefined') return;
    this.states[state] = val;
    e.preventDefault && e.preventDefault();
    e.stopPropagation && e.stopPropagation();
};



//Map prototype
Map.prototype.initLevel = function() {
    var level = [];
    for(var y = 0; y < this.height; y++) {
        var row = [];
        for(var x = 0; x < this.width; x++) {
            var num = Math.random();
            if(num < 0.2 || y == 0 || y == this.height - 1 || x == 0 || x == this.width -1) {
                row.push(1);
            } else {
                row.push(0);
            }
        }
        level.push(row);
    }
    return level;
};

Map.prototype.renderMinimap = function(player, projection) {
    var ctx = this.minimap.ctx, scale = this.scale;
    this.minimap.clear();
    for(var y = 0; y < this.height; y++) {
        for(var x = 0; x < this.width; x++) {
            var cell = this.level[y][x];
            if(cell == 1) {
                ctx.fillStyle = 'gray';
                ctx.fillRect(x * scale, y * scale, scale, scale);
            }
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 0.25;
            ctx.strokeRect(x * scale, y * scale, scale, scale);
        }
    }

    ctx.fillStyle = player.color;
    ctx.fillRect(player.x * scale - player.size / 2, player.y * scale - player.size / 2, player.size, player.size);
    this.minimap.drawLine(
        'blue', 2,
        player.x * scale,
        player.y * scale,
        (player.x + Math.cos(player.rot)) * scale,
        (player.y + Math.sin(player.rot)) * scale
    );

    for(var i = 0; i < projection.rays.length; i++) {
        var ray = projection.rays[i];
        this.minimap.drawLine(
            'rgba(200, 200, 0, 0.1)',
            1,
            player.x * scale,
            player.y * scale,
            ray.hitX * scale,
            ray.hitY * scale
        );
    }
};



//Player prototype
Player.prototype.update = function(controls) {
    var moveVec = 0;

    if(controls.forward) moveVec = this.moveSpeed;
    if(controls.backward) moveVec = -1 * this.moveSpeed;
    if(controls.left) this.rot += Util.toRadians(-1 * this.rotSpeed);
    if(controls.right) this.rot += Util.toRadians(this.rotSpeed);

    while(this.rot < 0) this.rot += Util.twoPI;
    while(this.rot >= Math.PI * 2) this.rot -= Util.twoPI;

    this.x += Math.cos(this.rot) * moveVec;
    this.y += Math.sin(this.rot) * moveVec;
};



//Projection prototype
Projection.prototype.initRays = function() {
    var rays = [];
    for(var i = 0; i < this.stripCount; i++) {
        rays.push(new Ray(i, this.stripCount, this.stripWidth, this.distance));
    }
    return rays;
};

Projection.prototype.castAllRays = function(origin, map) {
    for(var i = 0; i < this.rays.length; i++) {
        var ray = this.rays[i];
        ray.cast(origin, map);
        ray.hitDist *= Math.cos(ray.angle);
        ray.wallHeight = (1 / ray.hitDist) * this.distance;
    }
};

Projection.prototype.render = function() {
    var canvas = this.canvas;
    canvas.clear();
    canvas.ctx.fillStyle = 'darkgray';
    canvas.ctx.fillRect(0, 0, this.width, this.height / 2);
    canvas.ctx.fillStyle = 'gray';
    canvas.ctx.fillRect(0, this.height / 2, this.width, this.height / 2);

    for(var i = 0; i < this.rays.length; i++) {
        var ray = this.rays[i];
        canvas.ctx.fillStyle = 'green';
        canvas.ctx.fillRect(
            (this.width / 2) + ray.projPos,
            (this.height / 2) - (ray.wallHeight / 2),
            this.stripWidth,
            ray.wallHeight
        );
    }
};



//Ray prototype
Ray.prototype.getWorldAngle = function(origin) {
    var angle = origin.rot + this.angle;
    angle %= Util.twoPI;
    if(angle < 0) angle += Util.twoPI;
    return angle;
};

Ray.prototype.cast = function(origin, map) {
    this.worldAngle = this.getWorldAngle(origin);
    this.hit = false;

    /* Vertical Intersection Test */
        var right = (this.worldAngle > Util.twoPI * 0.75 || this.worldAngle < Util.twoPI * 0.25);
        var slope = Math.sin(this.worldAngle) / Math.cos(this.worldAngle);
        var x = right ? Math.ceil(origin.x) : Math.floor(origin.x);
        var y = origin.y + (x - origin.x) * slope;
        var deltaX = right ? 1 : -1;
        var deltaY = deltaX * slope;
        
        while(x >= 0 && x < map.width && y >= 0 && y < map.height) {
            var mapX = right ? Math.floor(x) : Math.floor(x) - 1;
            var mapY = Math.floor(y);

            if(map.level[mapY][mapX] == 1) {
                var distX = origin.x - x;
                var distY = origin.y - y;
                var dist = Math.sqrt(distX * distX + distY * distY);
                this.hitDist = dist;
                this.hitX = x;
                this.hitY = y;
                this.hit = true;
                break;
            }

            x += deltaX;
            y += deltaY;
        }
    /* End vertical test */

    /* Horizontal Intersection Test */
        var up = (this.worldAngle < 0 || this.worldAngle > Math.PI);
        var slope = Math.cos(this.worldAngle) / Math.sin(this.worldAngle);
        var y = up ? Math.floor(origin.y) : Math.ceil(origin.y);
        var x = origin.x + (y - origin.y) * slope;
        var deltaY = up ? -1 : 1;
        var deltaX = deltaY * slope;

        while(x >= 0 && x < map.width && y >= 0 && y < map.height) {
            var mapY = up ? Math.floor(y) - 1 : Math.floor(y);
            var mapX = Math.floor(x);

            if(map.level[mapY][mapX] == 1) {
                var distX = origin.x - x;
                var distY = origin.y - y;
                var dist = Math.sqrt(distX * distX + distY * distY);

                if(!this.hit || dist < this.hitDist) {
                    this.hitDist = dist;
                    this.hitX = x;
                    this.hitY = y;
                    this.hit = true;
                }

                break;
            }

            x += deltaX;
            y += deltaY;
        }
    /* End horizontal test */
};



//Main function
window.onload = function main() {
    var player = new Player(5.5, 5.5, 10, 45, 'red');
    var controls = new Controls();
    var map = new Map(20, 20, 20, 'minimap');
    var projection = new Projection(new Canvas('screen', 600, 480), 1, 60);
    
    requestAnimationFrame(loop);

    function loop() {
        player.update(controls.states);
        projection.castAllRays(player, map);
        map.renderMinimap(player, projection);
        projection.render();

        requestAnimationFrame(loop);
    }
}

