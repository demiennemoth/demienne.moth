
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
document.body.appendChild(canvas);

canvas.style.position = 'fixed';
canvas.style.top = 0;
canvas.style.left = 0;
canvas.style.zIndex = '-1';
canvas.style.pointerEvents = 'none';
canvas.style.opacity = '0.25';
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const words = [
  "REGRET", "VOID", "NUMB", "PAIN", "HOLLOW", "FLESH", "ERROR", "GLITCH", "DROWN", "STATIC",
  "LOST", "BURN", "404", "WAKE", "TRUTH", "WASTE", "LOOP", "SLEEP", "HAUNT", "BITE",
  "OBEY", "COLD", "FEAR", "DEAD", "CONTROL", "NEEDLE", "FRAGILE", "BREAK", "SHADOW"
];

const colors = ["#ffffff", "#ff0000", "#888888"];
const font = "14px 'Pixy Regular', monospace";

let drops = [];

for (let i = 0; i < 150; i++) {
  drops.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    text: words[Math.floor(Math.random() * words.length)],
    speed: 1 + Math.random() * 2,
    opacity: Math.random(),
    color: colors[Math.floor(Math.random() * colors.length)],
    flicker: Math.random() > 0.8
  });
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let drop of drops) {
    ctx.globalAlpha = drop.opacity;
    ctx.fillStyle = drop.color;
    ctx.font = font;

    if (drop.flicker && Math.random() > 0.5) {
      ctx.globalAlpha = 0.1;
    }

    ctx.fillText(drop.text, drop.x, drop.y);

    drop.y += drop.speed;
    drop.opacity -= 0.003;

    if (drop.y > canvas.height || drop.opacity <= 0) {
      drop.y = -20;
      drop.x = Math.random() * canvas.width;
      drop.text = words[Math.floor(Math.random() * words.length)];
      drop.opacity = 0.5 + Math.random() * 0.5;
      drop.color = colors[Math.floor(Math.random() * colors.length)];
    }
  }

  requestAnimationFrame(draw);
}

draw();
