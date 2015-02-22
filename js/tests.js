var Util = {
    twoPI: Math.PI * 2,
    toRadians: function(degrees) {
        return degrees * Math.PI / 180;
    }
};
var canvas = document.getElementById('minimap');
var ctx = canvas.getContext('2d');
var width = canvas.width = 200;
var height = canvas.height = 200;
var scale = 20;
var map = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 1, 0, 0, 0, 1],
    [1, 0, 0, 1, 0, 1, 0, 0, 0, 1],
    [1, 0, 0, 1, 0, 1, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 1, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 1, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
];
var mapWidth = map[0].length;
var mapHeight = map.length;
var player = {
    x: 2,
    y: 3,
    size: 10,
    color: 'red',
    rot: Util.toRadians(0)
};
var projection = {
    width: 600,
    height: 480,
    stripCount: 300,
    stripWidth: 2,
    fov: Util.toRadians(60),
    distance: (600 / 2) / Math.tan(Util.toRadians(60) / 2),
    rays: []
};

for(var i = 0; i < projection.stripCount; i++) {
    var ray = {};
    ray.screenPos = (-projection.stripCount / 2 + i) * projection.stripWidth;
    ray.diagDist = Math.sqrt(ray.screenPos * ray.screenPos + projection.distance * projection.distance);
    ray.angle = player.rot + Math.asin(ray.screenPos / ray.diagDist);

    ray.angle %= Util.twoPI;
    if(ray.angle < 0) ray.angle += Util.twoPI;

    projection.rays.push(ray);
}

for (var i = 0; i < mapHeight; i++) {
    for (var j = 0; j < mapWidth; j++) {
        if (map[i][j] == 1) {
            ctx.fillStyle = 'grey';
            ctx.fillRect(j * scale, i * scale, scale, scale);
        }
        ctx.lineWidth = 0.25;
        ctx.strokeStyle = 'black';
        ctx.strokeRect(j * scale, i * scale, scale, scale);

        ctx.fillStyle = player.color;
        ctx.fillRect(player.x * scale - player.size / 2, player.y * scale - player.size / 2, player.size, player.size);

        ctx.strokeStyle = 'blue';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(player.x * scale, player.y * scale);
        ctx.lineTo(
        (player.x + Math.cos(player.rot)) * scale, (player.y + Math.sin(player.rot)) * scale);
        ctx.closePath();
        ctx.stroke();

        for(var k = 0; k < projection.rays.length; k++) {
            var ray = projection.rays[k];

            ctx.strokeStyle = 'rgba(0, 250, 0, 0.5)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(player.x * scale, player.y * scale);
            ctx.lineTo(
                (player.x + Math.cos(ray.angle)) * scale,
                (player.y + Math.sin(ray.angle)) * scale
            );
            ctx.closePath();
            ctx.stroke();            
        }
    }
}