// Game object to hold state
const game = {
    state: "start",
    score: 0, // Shitcoins earned this run
    lives: 3,
    wave: 1,
    player: { x: 400, y: 550, speed: 200, cooldown: 500, lastShot: 0 },
    enemies: [],
    bullets: [],
    gridY: 0,
    moveInterval: 2000,
    lastMove: 0,
    lastTime: 0
};

// Load persistent data from localStorage
let totalShitcoins = localStorage.getItem("totalShitcoins") ? parseInt(localStorage.getItem("totalShitcoins")) : 0;
let upgradeLevel = localStorage.getItem("upgradeLevel") ? parseInt(localStorage.getItem("upgradeLevel")) : 1;
let highScore = localStorage.getItem("highScore") ? parseInt(localStorage.getItem("highScore")) : 0;
game.player.cooldown = 500 - (upgradeLevel - 1) * 100; // Adjust cooldown based on upgrade level

// Canvas setup
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Input handling
const keys = {};
window.addEventListener("keydown", (e) => (keys[e.key] = true));
window.addEventListener("keyup", (e) => (keys[e.key] = false));

// Spawn a wave of enemies
function spawnWave(wave) {
    game.enemies = [];
    const numRows = 5;
    const numCols = 10;
    const rowHeight = 50;
    const colWidth = 50;
    for (let row = 0; row < numRows; row++) {
        for (let col = 0; col < numCols; col++) {
            game.enemies.push({
                x: col * colWidth + 50,
                y: row * rowHeight,
                width: 30,
                height: 30,
                wave: wave
            });
        }
    }
    game.gridY = 0;
    game.moveInterval = 2000 / (1 + 0.1 * wave); // Speed up with each wave
    game.lastMove = Date.now();
}

// Main game loop
function gameLoop() {
    const now = Date.now();
    const deltaTime = (now - game.lastTime) / 1000; // Time in seconds
    game.lastTime = now;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
ctx.fillStyle = "black";
ctx.fillRect(0, 0, canvas.width, canvas.height);

    switch (game.state) {
        case "start":
            renderStart();
            handleStartInput();
            break;
        case "playing":
            updatePlaying(deltaTime, now);
            renderPlaying();
            break;
        case "gameover":
            renderGameOver();
            handleGameOverInput();
            break;
        case "shop":
            renderShop();
            handleShopInput();
            break;
    }

    requestAnimationFrame(gameLoop);
}

// Update game logic during "playing" state
function updatePlaying(deltaTime, now) {
    // Player movement
    if (keys["ArrowLeft"] && game.player.x > 15) game.player.x -= game.player.speed * deltaTime;
    if (keys["ArrowRight"] && game.player.x < canvas.width - 15) game.player.x += game.player.speed * deltaTime;

    // Shooting
    if (keys[" "] && now - game.player.lastShot >= game.player.cooldown) {
        game.bullets.push({ x: game.player.x, y: game.player.y - 10, width: 5, height: 10 });
        game.player.lastShot = now;
    }

    // Update bullets
    game.bullets = game.bullets.filter(bullet => {
        bullet.y -= 300 * deltaTime; // Bullet speed
        return bullet.y >= 0;
    });

    // Move enemies
    if (now - game.lastMove >= game.moveInterval) {
        game.gridY += 50;
        game.lastMove = now;

        // Check if enemies reach bottom
        const threshold = canvas.height - 50;
        game.enemies = game.enemies.filter(enemy => {
            if (enemy.y + game.gridY >= threshold) {
                game.lives--;
                return false;
            }
            return true;
        });

        if (game.lives <= 0) {
            totalShitcoins += game.score;
            if (game.score > highScore) highScore = game.score;
            localStorage.setItem("totalShitcoins", totalShitcoins);
            localStorage.setItem("highScore", highScore);
            game.state = "gameover";
        }
    }

    // Collision detection (bullets vs enemies)
    for (let b = game.bullets.length - 1; b >= 0; b--) {
        const bullet = game.bullets[b];
        for (let e = game.enemies.length - 1; e >= 0; e--) {
            const enemy = game.enemies[e];
            const enemyY = enemy.y + game.gridY;
            if (
                bullet.x > enemy.x &&
                bullet.x < enemy.x + enemy.width &&
                bullet.y > enemyY &&
                bullet.y < enemyY + enemy.height
            ) {
                game.bullets.splice(b, 1);
                game.enemies.splice(e, 1);
                game.score += 10 * game.wave; // Score increases with wave
                break; // Bullet can only hit one enemy
            }
        }
    }

    // Next wave
    if (game.enemies.length === 0) {
        game.wave++;
        spawnWave(game.wave);
    }
}

// Render functions
function renderPlaying() {
    // Draw player (triangle)
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.moveTo(game.player.x, game.player.y);
    ctx.lineTo(game.player.x - 15, game.player.y + 20);
    ctx.lineTo(game.player.x + 15, game.player.y + 20);
    ctx.closePath();
    ctx.fill();

    // Draw enemies (squares)
    ctx.fillStyle = "red";
    game.enemies.forEach(enemy => {
        ctx.fillRect(enemy.x, enemy.y + game.gridY, enemy.width, enemy.height);
    });

    // Draw bullets (rectangles)
    ctx.fillStyle = "yellow";
    game.bullets.forEach(bullet => {
        ctx.fillRect(bullet.x - 2.5, bullet.y, bullet.width, bullet.height);
    });

    // Draw UI
    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.fillText(`Shitcoins: ${game.score}`, 10, 20);
    ctx.fillText(`Lives: ${game.lives}`, 10, 50);
    ctx.fillText(`Wave: ${game.wave}`, 10, 80);
}

function renderStart() {
    ctx.fillStyle = "white";
    ctx.font = "40px Arial";
    ctx.fillText("Shitcoin Shooter", 250, 200);
    ctx.font = "20px Arial";
    ctx.fillText("Earn Shitcoins by blasting enemies!", 280, 250);
    ctx.fillText(`Total Shitcoins: ${totalShitcoins}`, 320, 300);
    ctx.fillText(`High Score: ${highScore}`, 340, 330);
    ctx.fillText(`Shooting Level: ${upgradeLevel}`, 330, 360);
    ctx.fillText("Press Enter to Start", 320, 400);
    ctx.fillText("Press S for Shop", 330, 430);
}

function renderGameOver() {
    ctx.fillStyle = "white";
    ctx.font = "40px Arial";
    ctx.fillText("Game Over", 300, 200);
    ctx.font = "20px Arial";
    ctx.fillText(`You earned ${game.score} Shitcoins`, 310, 250);
    ctx.fillText(`Total Shitcoins: ${totalShitcoins}`, 310, 280);
    ctx.fillText(`High Score: ${highScore}`, 330, 310);
    ctx.fillText("Press Enter to Play Again", 300, 400);
    ctx.fillText("Press S for Shop", 330, 430);
}

function renderShop() {
    const nextLevel = upgradeLevel + 1;
    const cost = 100 * upgradeLevel;
    const nextCooldown = game.player.cooldown - 100;
    ctx.fillStyle = "white";
    ctx.font = "40px Arial";
    ctx.fillText("Shop", 350, 200);
    ctx.font = "20px Arial";
    ctx.fillText(`Total Shitcoins: ${totalShitcoins}`, 320, 250);
    ctx.fillText(`Current Shooting Level: ${upgradeLevel}`, 300, 280);
    ctx.fillText(`Cooldown: ${game.player.cooldown}ms`, 320, 310);
    if (nextCooldown >= 100) {
        ctx.fillText(`Upgrade to Level ${nextLevel} (${nextCooldown}ms): ${cost} Shitcoins`, 250, 340);
        ctx.fillText("Press U to Upgrade", 320, 370);
    } else {
        ctx.fillText("Max Level Reached!", 320, 340);
    }
    ctx.fillText("Press Enter to Return", 310, 400);
}

// Input handling for each state
function handleStartInput() {
    if (keys["Enter"]) {
        game.score = 0;
        game.lives = 3;
        game.wave = 1;
        spawnWave(game.wave);
        game.state = "playing";
    } else if (keys["s"]) {
        game.state = "shop";
    }
}

function handleGameOverInput() {
    if (keys["Enter"]) {
        game.score = 0;
        game.lives = 3;
        game.wave = 1;
        spawnWave(game.wave);
        game.state = "playing";
    } else if (keys["s"]) {
        game.state = "shop";
    }
}

function handleShopInput() {
    const cost = 100 * upgradeLevel;
    if (keys["u"] && totalShitcoins >= cost && game.player.cooldown > 100) {
        totalShitcoins -= cost;
        upgradeLevel++;
        game.player.cooldown -= 100;
        localStorage.setItem("totalShitcoins", totalShitcoins);
        localStorage.setItem("upgradeLevel", upgradeLevel);
    } else if (keys["Enter"]) {
        game.state = "start";
    }
}

// Start the game
game.lastTime = Date.now();
requestAnimationFrame(gameLoop);