//Utility stuff
var Util = {
    twoPI: Math.PI * 2,
    toRadians: function(degrees) {
        return degrees * Math.PI / 180;
    },
    drawAngle: function(color, angle, x, y) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x * map.scale, y * map.scale);
        ctx.lineTo(
            (x + Math.cos(angle)) * map.scale,
            (y + Math.sin(angle)) * map.scale
        );
        ctx.closePath();
        ctx.stroke();            
    },
    drawLine: function(color, x1, y1, x2, y2) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x1 * map.scale, y1 * map.scale);
        ctx.lineTo(x2 * map.scale, y2 * map.scale);
        ctx.closePath();
        ctx.stroke();            
    }
};


//Minimap canvas stuff
var canvas = document.getElementById('minimap');
var ctx = canvas.getContext('2d');
var width = canvas.width = 500;
var height = canvas.height = 500;


//Map stuff
var map = {
    level: [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 1, 0, 1],
        [1, 0, 0, 0, 0, 1, 0, 0, 0, 1],
        [1, 0, 0, 1, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 1, 0, 0, 1, 0, 0, 1],
        [1, 0, 0, 0, 0, 1, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 1, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    ],
    scale: 50,
    width: 10,
    height: 10
};


//Player stuff
var player = {
    x: 3,
    y: 7.5,
    size: 10,
    color: 'red',
    rot: Util.toRadians(-30)
};


//Setup a projection
document.getElementById('screen').width = 600;
document.getElementById('screen').height = 480;
var projection = {
    ctx: document.getElementById('screen').getContext('2d'), //A drawing context
    width: 600, //Width in px
    height: 480, //Height in px
    stripCount: 300, //Divide the screen into strips
    stripWidth: 2, //The width of a strip
    fov: Util.toRadians(60), //The fov the projection will use in radians
    distance: (600 / 2) / Math.tan(Util.toRadians(60) / 2), //The distance the proj is from the player
    rays: [] //An array of rays
};
projection.ctx.fillStyle = 'gray';
projection.ctx.fillRect(0, 0, projection.width, projection.height / 2);
projection.ctx.fillStyle = 'darkgray';
projection.ctx.fillRect(0, projection.height / 2, projection.width, projection.height / 2);


//Draw the minimap and player
for (var i = 0; i < map.height; i++) {
    for (var j = 0; j < map.width; j++) {
        //Draw walls
        if (map.level[i][j] == 1) {
            ctx.fillStyle = 'grey';
            ctx.fillRect(j * map.scale, i * map.scale, map.scale, map.scale);
        }

        //Draw black grid
        ctx.lineWidth = 0.25;
        ctx.strokeStyle = 'black';
        ctx.strokeRect(j * map.scale, i * map.scale, map.scale, map.scale);

        //Draw layer
        ctx.fillStyle = player.color;
        ctx.fillRect(player.x * map.scale - player.size / 2, player.y * map.scale - player.size / 2, player.size, player.size);
        Util.drawAngle('blue', player.rot, player.x, player.y);

        //Draw rays from player to projection
        for(var k = 0; k < projection.rays.length; k++) {
            var ray = projection.rays[k];
            // Util.drawAngle('rgba(0,200,0,0.5)', ray.angle, player.x, player.y);
        }
    }
}


//Initialize all the rays in our projection
for(var i = 0; i < projection.stripCount; i++) {
    var ray = {};
    ray.screenPos = (-projection.stripCount / 2 + i) * projection.stripWidth;
    ray.diagDist = Math.sqrt(ray.screenPos * ray.screenPos + projection.distance * projection.distance);
    projection.rays.push(ray);
}


//Get the angle of each ray
for(var i = 0; i < projection.stripCount; i++) {
    var ray = projection.rays[i];
    ray.angle = player.rot + Math.asin(ray.screenPos / ray.diagDist);
    ray.angle %= Util.twoPI;
    if(ray.angle < 0) ray.angle += Util.twoPI;
}


//Raycasting algorithm development
for(var i = 0; i < projection.rays.length; i++) {
    var ray = projection.rays[i]; //The ray we want to test

    /* Vertical Intersection Test */
        var right = (ray.angle > Util.twoPI * 0.75 || ray.angle < Util.twoPI * 0.25); //Is the ray going right or left?
        var slope = Math.sin(ray.angle) / Math.cos(ray.angle); //The slope of the ray
        var x = right ? Math.ceil(player.x) : Math.floor(player.x); //First x intersection
        var y = player.y + (x - player.x) * slope; //First y intersection
        var deltaX = right ? 1 : -1; //Incerment for every x intersection afterwards
        var deltaY = deltaX * slope; //Increment for every y intersection afterwards
        
        //Test while we are in the boundaries of the map
        while(x >= 0 && x < map.width && y >= 0 && y < map.height) {
            //Get the coordinates on the map the ray is touching
            var mapX = right ? Math.floor(x) : Math.floor(x) - 1;
            var mapY = Math.floor(y);

            if(map.level[mapY][mapX] == 1) {
                var distX = player.x - x;
                var distY = player.y - y;
                ray.distance = distX * distX + distY * distY
                ray.hitX = x;
                ray.hitY = y;
                break;
            }

            x += deltaX;
            y += deltaY;
        }
    /* End vertical test */

    /* Horizontal Intersection Test */
        var up = (ray.angle < 0 || ray.angle > Math.PI); //Is the ray going up or left?
        var slope = Math.cos(ray.angle) / Math.sin(ray.angle);
        var y = up ? Math.floor(player.y) : Math.ceil(player.y);
        var x = player.x + (y - player.y) * slope;
        var deltaY = up ? -1 : 1;
        var deltaX = deltaY * slope;

        //Test while we are in the boundaries of the map
        while(x >= 0 && x < map.width && y >= 0 && y < map.height) {
            //Get the coordinates on the map the ray is touching
            var mapY = up ? Math.floor(y) - 1 : Math.floor(y);
            var mapX = Math.floor(x);

            if(map.level[mapY][mapX] == 1) {
                var distX = player.x - x;
                var distY = player.y - y;
                var rayDistance = distX * distX + distY * distY;

                if(!ray.distance || rayDistance < ray.distance) {
                    ray.distance = rayDistance;
                    ray.hitX = x;
                    ray.hitY = y;
                }

                break;
            }

            x += deltaX;
            y += deltaY;
        }
    /* End horizontal test */

    //Draw the ray on the minimap
    Util.drawLine('rgba(200,200,0,0.25)', player.x, player.y, ray.hitX, ray.hitY);

    //Correct the ray distance for the fisheye effect
    ray.distance = Math.sqrt(ray.distance);
    ray.distance *= Math.cos(player.rot - ray.angle);

    //Get the height of the wall that the ray is touching
    ray.wallHeight = (1 / ray.distance) * projection.distance;

    //Draw the slice on the projection
    projection.ctx.fillStyle = 'green';
    projection.ctx.fillRect(
        (projection.width / 2) + ray.screenPos,
        (projection.height / 2) - (ray.wallHeight / 2),
        projection.stripWidth,
        ray.wallHeight
    );
}
