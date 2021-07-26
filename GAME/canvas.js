// Basic canvas
const canvas = document.querySelector("canvas");
const c = canvas.getContext("2d");

canvas.width = innerWidth;
canvas.height = innerHeight;

// All the style element
const scoreEl = document.querySelector("#scoreEl");
const startGameBtn = document.querySelector("#startGameBtn");
const modelEl = document.querySelector("#modelEl");
const bigScoreEl = document.querySelector("#bigScoreEl");

// MAIN PLAYER
class Player {
  constructor(x, y, radius, color) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
  }

  draw() {
    c.save();
    c.beginPath();
    c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    c.shadowColor = this.color;
    c.shadowBlur = 5;
    c.fillStyle = this.color;
    c.fill();
    c.restore();
  }

  update() {
    this.draw();
  }
}
// Projectile
class Projectile {
  constructor(x, y, radius, color, velocity) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.velocity = velocity;
  }

  draw() {
    c.save();
    c.beginPath();
    c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    c.shadowColor = this.color;
    c.shadowBlur = 15;
    c.fillStyle = this.color;
    c.fill();
    c.restore();
  }

  update() {
    this.draw();

    this.x += this.velocity.x;
    this.y += this.velocity.y;
  }
}

// Enemies
class Enemy {
  constructor(x, y, radius, color, velocity) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.velocity = velocity;
  }

  draw() {
    c.save();
    c.beginPath();
    c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    c.shadowColor = this.color;
    c.shadowBlur = 2;
    c.fillStyle = this.color;
    c.fill();
    c.restore();
  }

  update() {
    this.draw();

    this.x += this.velocity.x;
    this.y += this.velocity.y;
  }
}

// particles friction
const friction = 0.97;

// Particles
class Particle {
  constructor(x, y, radius, color, velocity) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.velocity = velocity;
    this.alpha = 1;
  }

  draw() {
    c.save();
    c.globalAlpha = this.alpha;
    c.beginPath();
    c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    c.fillStyle = this.color;
    c.fill();
    c.restore();
  }

  update() {
    this.draw();

    this.velocity.x *= friction;
    this.velocity.y *= friction;

    this.x += this.velocity.x;
    this.y += this.velocity.y;

    this.alpha -= 0.01;
  }
}

// Player's positioning
const x = canvas.width / 2;
const y = canvas.height / 2;

let player = new Player(x, y, 10, "white");
let enemies = [];
let particles = [];
let projectiles = [];

function init() {
  player = new Player(x, y, 10, "white");
  enemies = [];
  particles = [];
  projectiles = [];
  score = 0;
  scoreEl.innerHTML = score;
  bigScoreEl.innerHTML = score;
}

// All enemies
function spawnEnemies() {
  setInterval(() => {
    const radius = Math.random() * (30 - 5) + 5;
    let x;
    let y;

    // Random Spawning of the enemies
    if (Math.random() < 0.5) {
      x = Math.random() < 0.5 ? 0 - radius : canvas.width + radius;
      y = Math.random() * canvas.height;
    } else {
      x = Math.random() * canvas.width;
      y = Math.random() < 0.5 ? 0 - radius : canvas.height + radius;
    }

    const color = `hsl(${Math.random() * 360}, 80%, 50%)`;

    // Angle from the center to mouse click
    const angle = Math.atan2(canvas.height / 2 - y, canvas.width / 2 - x);

    const power = 1;

    const velocity = {
      x: Math.cos(angle) * power,
      y: Math.sin(angle) * power,
    };

    enemies.push(new Enemy(x, y, radius, color, velocity));
  }, 1000);
}

let animationId;

let score = 0;

// Looping for animation
function animate() {
  animationId = requestAnimationFrame(animate);

  c.fillStyle = "rgba(0, 0, 0, 0.1)";
  c.shadowBlur = 0;
  c.fillRect(0, 0, canvas.width, canvas.height);

  // Drawing the Main Player
  player.update();

  // Drawing the particles
  particles.forEach((particle, index) => {
    if (particle.alpha <= 0) {
      particles.splice(index, 1);
    } else {
      particle.update();
    }
  });

  // Drawing the projectiles
  projectiles.forEach((projectile, index) => {
    projectile.update();

    // remove projectile which go out of the screen
    if (
      projectile.x + projectile.radius < 0 ||
      projectile.x - projectile.radius > canvas.width ||
      projectile.y + projectile.radius < 0 ||
      projectile.y - projectile.radius < 0
    ) {
      setTimeout(() => {
        projectiles.splice(index, 1);
      }, 0);
    }
  });

  // Drawing the enemies
  enemies.forEach((enemy, index) => {
    enemy.update();

    // distance between player and enemy
    const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);

    // End the game
    if (dist - enemy.radius - player.radius < 1) {
      cancelAnimationFrame(animationId);
      modelEl.classList.remove("hide");
      bigScoreEl.innerHTML = score;
    }

    projectiles.forEach((projectile, projectileIndex) => {
      // distance between projectile and enemy
      const dist = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y);

      // particles power
      const power = 5;

      // Enemy remove related all things
      if (dist - enemy.radius - projectile.radius < 1) {
        // create explosions
        for (let i = 0; i < enemy.radius * 2; i++) {
          particles.push(
            new Particle(
              projectile.x,
              projectile.y,
              Math.random() * 2,
              enemy.color,
              {
                x: (Math.random() - 0.5) * (Math.random() * power),
                y: (Math.random() - 0.5) * (Math.random() * power),
              }
            )
          );
        }

        if (enemy.radius - 10 > 5) {
          // increase score
          score += 25;
          scoreEl.innerHTML = score;

          gsap.to(enemy, {
            radius: enemy.radius - 10,
          });
          setTimeout(() => {
            projectiles.splice(projectileIndex, 1);
          }, 0);
        } else {
          // remove from scene altogether
          score += 100;
          scoreEl.innerHTML = score;

          setTimeout(() => {
            enemies.splice(index, 1);
            projectiles.splice(projectileIndex, 1);
          }, 0);
        }
      }
    });
  });
}

// Player shooting work
addEventListener(`click`, (event) => {
  // Angle from the center to mouse click
  const angle = Math.atan2(
    event.clientY - canvas.height / 2,
    event.clientX - canvas.width / 2
  );

  const power = 5;

  const velocity = {
    x: Math.cos(angle) * power,
    y: Math.sin(angle) * power,
  };

  projectiles.push(
    new Projectile(canvas.width / 2, canvas.height / 2, 5, "white", velocity)
  );
});

startGameBtn.addEventListener(`click`, () => {
  init();
  animate();
  spawnEnemies();
  modelEl.classList.add("hide");
});
