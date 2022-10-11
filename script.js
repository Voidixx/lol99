
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

c.font = "30px Arial";
c.fillStyle = "white";
c.fillText("Loading...", 10, 50);

function random(number1, number2){
  return Math.round(Math.random() * (number2 - number1)) + number1;
}

function remove(arr, str){
  if(arr.includes(str)) arr.splice(arr.indexOf(str), 1);
}

const loadingImages = [
  {
    url: "images/grass.png",
    name: "grass",
    size: undefined
  },
  {
    url: "images/player.png",
    name: "player",
    size: undefined
  }
];



var e = 0;
const player = {
  x: 300,
  y: 300,
  left: false,
  right: false,
  up: false,
  down: false,
  radius: 50,
  speed: 0,
  moving: false,
  // keyspressed: 0,
  slowing: false,
  directions: []
};
player.x = random(player.radius, 2000 - player.radius);
player.y = random(player.radius, 2000 - player.radius);

function speeding(from, to){
  return new Promise((resolve, reject) => {
    var num = 0.5;
    if(from > to) num = -num;
    var startTime = Date.now();
    var int = setInterval(() => {
      player.speed += num;
      if((player.speed >= to && from < to) || ((player.speed <= to || player.moving) && from > to) || Date.now() - startTime >= Math.abs(from - to) * 15 / Math.abs(num) || player.directions.length > 1){
        clearInterval(int);
        player.speed = to;
        resolve();
      }
    }, 15);
  })
}

var time = Date.now();
var fps = 0;
var FPS = 60;

function animate(){
  if(Date.now() - time >= 1000){
    time = Date.now();
    FPS = fps;
    // console.log(fps);
    fps = 0;
  }
  if(player.x - player.radius <= 0) player.left = false;
  if(player.x + player.radius >= 2000) player.right = false;
  if(player.y - player.radius <= 0) player.up = false;
  if(player.y + player.radius >= 2000) player.down = false;
  if(player.left) player.x -= player.speed;
  if(player.right) player.x += player.speed;
  if(player.up) player.y -= player.speed;
  if(player.down) player.y += player.speed;
  c.clearRect(0, 0, canvas.width, canvas.height);
  for(let i = canvas.width / 2; i <= canvas.width / 2 + 1500; i += 500){
    for(let j = canvas.height / 2; j <= canvas.height / 2 + 1500; j += 500){
      addImage("grass", i - player.x, j - player.y);
    }
  }
  addImage("player", canvas.width / 2 - player.radius, canvas.height / 2 - player.radius);
  
  requestAnimationFrame(animate);
  fps++;
  c.fillText("FPS: " + FPS, canvas.width - 200, 50);
}
loadImages(loadingImages).then(() => {
  animate();
});


document.addEventListener("keydown", e => {
  e.preventDefault();
  if(player.slowing) return;
  
  if(e.key == "w" && !player.up){
    player.up = true;
    if(!player.directions.length) speeding(0, 5);
    player.directions.push("up");
    player.moving = true;
    player.down = false;
    remove(player.directions, "down");
  } if(e.key == "a" && !player.left){
    player.left = true;
    if(!player.directions.length) speeding(0, 5);
    player.directions.push("left");
    player.moving = true;
    player.right = false;
    remove(player.directions, "right");
  } if(e.key == "s" && !player.down){
    player.down = true;
    if(!player.directions.length) speeding(0, 5);
    player.directions.push("down");
    player.moving = true;
    player.up = false;
    remove(player.directions, "up");
  } if(e.key == "d" && !player.right){
    player.right = true;
    if(!player.directions.length) speeding(0, 5);
    player.directions.push("right");
    player.moving = true;
    player.left = false;
    remove(player.directions, "left");
  }
  console.log(player.directions)
});

document.addEventListener("keyup", e => {
  if(e.key == "w" && player.up){
    remove(player.directions, "up");
    if(!player.directions.length){
      player.slowing = true;
      player.moving = false;
      speeding(5, 0).then(() => {
        player.up = false;
        player.slowing = false;
      });
    } else {
      player.up = false;
    }
  } if(e.key == "a" && player.left){
    remove(player.directions, "left");
    if(!player.directions.length){
      player.slowing = true;
      player.moving = false;
      speeding(5, 0).then(() => {
        player.left = false;
        player.slowing = false;
      });
    } else {
      player.left = false;
    }
    player.moving = false;
  } if(e.key == "s" && player.down){
    remove(player.directions, "down");
    if(!player.directions.length){
      player.slowing = true;
      player.moving = false;
      speeding(5, 0).then(() => {
        player.down = false;
        player.slowing = false;
      });
    } else {
      player.down = false;
    }
  } if(e.key == "d" && player.right){
    remove(player.directions, "right");
    if(!player.directions.length){
      player.slowing = true;
      player.moving = false;
      speeding(5, 0).then(() => {
        player.right = false;
        player.slowing = false;
      });
    } else {
      player.right = false;
    }
  }
});

window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
})