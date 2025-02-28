// Global variables
let gameState;
let player;
let enemies = [];
let playerBullets = [];
let enemyBullets = [];
let explosions = [];
let stars = [];
let powerUps = [];
let score;
let lives;
let enemySpawnTimer;
let bossSpawnTimer;
let playerImage;
let smallEnemyImage;
let largeEnemyImage;
let fastEnemyImage;
let bossEnemyImage;
let powerUpImages = {};
let level = 1;
let bossActive = false;

// Player class
class Player {
  constructor() {
    this.x = width / 2;
    this.y = height - 50;
    this.width = 20;
    this.height = 35;
    this.image = playerImage;
    this.lives = 20;
    this.invulnerable = false;
    this.invulnerableTimer = 0;
    this.lastShotTime = 0;
    this.speed = 8;
    this.bulletType = 'normal';
    this.powerUpTimer = 0;
  }

  draw() {
    if (this.invulnerable) {
      tint(255, 128 + 128 * sin(frameCount * 0.1));
    }
    image(this.image, this.x, this.y);
    noTint();
    
    // Mostrar tempo restante do power-up
    if (this.bulletType !== 'normal' && this.powerUpTimer > millis()) {
      let timeLeft = Math.ceil((this.powerUpTimer - millis()) / 1000);
      fill(255, 255, 0);
      textSize(12);
      textAlign(CENTER);
      text(this.bulletType + ": " + timeLeft + "s", this.x, this.y + 30);
    } else if (this.powerUpTimer <= millis() && this.bulletType !== 'normal') {
      this.bulletType = 'normal';
    }
  }

  move() {
    // Movimento com setas - mais preciso
    if (keyIsDown(LEFT_ARROW)) {
      this.x -= this.speed;
    }
    if (keyIsDown(RIGHT_ARROW)) {
      this.x += this.speed;
    }
    
    // Movimento super preciso com Shift + setas
    if (keyIsDown(SHIFT) && keyIsDown(LEFT_ARROW)) {
      this.x -= 1; // Movimento de 1 pixel quando Shift está pressionado
    }
    if (keyIsDown(SHIFT) && keyIsDown(RIGHT_ARROW)) {
      this.x += 1; // Movimento de 1 pixel quando Shift está pressionado
    }
    
    this.x = constrain(this.x, this.width / 2, width - this.width / 2);
  }

  shoot() {
    if (millis() > this.lastShotTime + 250) {
      switch(this.bulletType) {
        case 'normal':
          playerBullets.push(new PlayerBullet(this.x, this.y - 20, 'normal'));
          break;
        case 'duplo':
          playerBullets.push(new PlayerBullet(this.x - 10, this.y - 15, 'normal'));
          playerBullets.push(new PlayerBullet(this.x + 10, this.y - 15, 'normal'));
          break;
        case 'triplo':
          playerBullets.push(new PlayerBullet(this.x, this.y - 20, 'normal'));
          playerBullets.push(new PlayerBullet(this.x - 10, this.y - 15, 'normal', -1));
          playerBullets.push(new PlayerBullet(this.x + 10, this.y - 15, 'normal', 1));
          break;
        case 'laser':
          playerBullets.push(new PlayerBullet(this.x, this.y - 20, 'laser'));
          break;
      }
      this.lastShotTime = millis();
    }
  }
  
  collectPowerUp(type) {
    this.bulletType = type;
    this.powerUpTimer = millis() + 10000; // 10 segundos de duração
  }

  addLife() {
    this.lives++;
  }
}

// Enemy class
class Enemy {
  constructor(type) {
    this.type = type;
    this.toRemove = false;
    
    switch(type) {
      case 'small':
        this.width = 10;
        this.height = 15;
        this.speed = 3;
        this.points = 10;
        this.health = 1;
        this.image = smallEnemyImage;
        break;
      case 'large':
        this.width = 20;
        this.height = 20;
        this.speed = 2;
        this.points = 20;
        this.health = 2;
        this.image = largeEnemyImage;
        break;
      case 'fast':
        this.width = 15;
        this.height = 15;
        this.speed = 5;
        this.points = 30;
        this.health = 1;
        this.image = fastEnemyImage;
        break;
      case 'boss':
        this.width = 60;
        this.height = 60;
        this.speed = 1;
        this.points = 200;
        this.health = 20;
        this.maxHealth = 20;
        this.image = bossEnemyImage;
        this.shootPattern = 'multi';
        break;
    }
    
    this.x = random(width);
    this.y = -this.height / 2;
    
    // Posicionar o chefe no centro
    if (type === 'boss') {
      this.x = width / 2;
      this.y = 50;
      bossActive = true;
    }
  }

  draw() {
    image(this.image, this.x, this.y);
    
    // Mostrar barra de vida para o chefe
    if (this.type === 'boss') {
      let healthPercentage = this.health / this.maxHealth;
      fill(255, 0, 0);
      rect(this.x - 30, this.y - 40, 60, 5);
      fill(0, 255, 0);
      rect(this.x - 30, this.y - 40, 60 * healthPercentage, 5);
    }
  }

  update() {
    // Movimento diferente para cada tipo
    if (this.type === 'boss') {
      // O chefe se move de um lado para o outro
      this.x += sin(frameCount * 0.02) * 2;
      
      // Padrões de tiro diferentes
      if (frameCount % 60 === 0) { // A cada segundo
        if (this.shootPattern === 'multi') {
          for (let i = -2; i <= 2; i++) {
            enemyBullets.push(new EnemyBullet(this.x + (i * 10), this.y + this.height / 2, 'normal', i * 0.5));
          }
        } else {
          // Tiro direcionado ao jogador
          let angle = atan2(player.y - this.y, player.x - this.x);
          enemyBullets.push(new EnemyBullet(this.x, this.y + this.height / 2, 'aimed', 0, angle));
        }
        
        // Alternar padrão de tiro
        if (random() < 0.3) {
          this.shootPattern = this.shootPattern === 'multi' ? 'aimed' : 'multi';
        }
      }
    } else {
      this.y += this.speed;
      
      // Chance de atirar baseada no tipo
      let shootChance = 0.005; // Base
      if (this.type === 'large') shootChance = 0.01;
      if (this.type === 'fast') shootChance = 0.008;
      
      if (random() < shootChance) {
        this.shoot();
      }
      
      if (this.y > height + this.height / 2) {
        this.toRemove = true;
      }
    }
  }

  shoot() {
    enemyBullets.push(new EnemyBullet(this.x, this.y + this.height / 2));
  }
  
  takeDamage() {
    this.health--;
    if (this.health <= 0) {
      this.toRemove = true;
      
      // Chance de soltar power-up
      let dropChance = 0.1; // 10% base
      if (this.type === 'large') dropChance = 0.15;
      if (this.type === 'fast') dropChance = 0.2;
      if (this.type === 'boss') dropChance = 1.0; // Sempre solta
      
      if (random() < dropChance) {
        let powerTypes = ['duplo', 'triplo', 'laser'];
        let type = random(powerTypes);
        powerUps.push(new PowerUp(this.x, this.y, type));
      }
      
      if (this.type === 'boss') {
        bossActive = false;
        level++;
      }
    }
  }
}

// PlayerBullet class
class PlayerBullet {
  constructor(x, y, type = 'normal', xDirection = 0) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.xDirection = xDirection; // Para tiros diagonais
    this.speed = -15;
    this.width = 2;
    this.height = 5;
    
    if (type === 'laser') {
      this.width = 4;
      this.height = 15;
      this.speed = -20;
    }
  }

  draw() {
    if (this.type === 'normal') {
      fill(255);
      rect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
    } else if (this.type === 'laser') {
      fill(0, 255, 255);
      rect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
    }
  }

  update() {
    this.y += this.speed;
    this.x += this.xDirection; // Movimento diagonal
    
    if (this.y < 0) {
      this.toRemove = true;
    }
  }
}

// EnemyBullet class
class EnemyBullet {
  constructor(x, y, type = 'normal', xDirection = 0, angle = 0) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.speed = 5;
    this.xDirection = xDirection;
    this.angle = angle;
  }

  draw() {
    fill(255, 0, 0);
    ellipse(this.x, this.y, 5, 5);
  }

  update() {
    if (this.type === 'aimed') {
      // Movimento baseado no ângulo
      this.x += cos(this.angle) * this.speed;
      this.y += sin(this.angle) * this.speed;
    } else {
      this.y += this.speed;
      this.x += this.xDirection;
    }
    
    if (this.y > height || this.x < 0 || this.x > width) {
      this.toRemove = true;
    }
  }
}

// PowerUp class
class PowerUp {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.speed = 2;
    this.width = 20;
    this.height = 20;
  }
  
  draw() {
    image(powerUpImages[this.type], this.x, this.y);
  }
  
  update() {
    this.y += this.speed;
    
    if (this.y > height) {
      this.toRemove = true;
    }
    
    // Verificar colisão com o jogador
    if (dist(this.x, this.y, player.x, player.y) < 30) {
      if (this.type === 'vida') {
        player.addLife();
      } else {
        player.collectPowerUp(this.type);
      }
      this.toRemove = true;
    }
  }
}

// Explosion class
class Explosion {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 0;
    this.alpha = 255;
  }

  draw() {
    noStroke();
    fill(255, 0, 0, this.alpha);
    ellipse(this.x, this.y, this.radius);
  }

  update() {
    this.radius += 2;
    this.alpha -= 5;
    if (this.alpha <= 0) {
      this.toRemove = true;
    }
  }
}

// Preload function
function preload() {
  // Podemos carregar imagens aqui se necessário
}

// Setup function
function setup() {
  createCanvas(800, 600);
  imageMode(CENTER);

  // Initialize starfield
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: random(width),
      y: random(height),
      speed: random(1, 3)
    });
  }

  // Create player sprite
  let pg = createGraphics(40, 40);
  pg.translate(20, 20);
  pg.fill(255);
  pg.triangle(-10, 15, 10, 15, 0, -15);
  pg.rect(-5, 15, 2, 5);
  pg.rect(3, 15, 2, 5);
  pg.ellipse(0, 0, 5, 5);
  playerImage = pg.get();

  // Create small enemy sprite
  pg = createGraphics(20, 20);
  pg.translate(10, 10);
  pg.fill(255);
  pg.triangle(-5, 7.5, 5, 7.5, 0, -7.5);
  smallEnemyImage = pg.get();

  // Create large enemy sprite
  pg = createGraphics(30, 30);
  pg.translate(15, 15);
  pg.fill(255);
  pg.ellipse(0, 0, 20, 20);
  largeEnemyImage = pg.get();
  
  // Create fast enemy sprite
  pg = createGraphics(20, 20);
  pg.translate(10, 10);
  pg.fill(255, 255, 0);
  pg.triangle(-7, 7, 7, 7, 0, -7);
  fastEnemyImage = pg.get();
  
  // Create boss enemy sprite
  pg = createGraphics(80, 80);
  pg.translate(40, 40);
  pg.fill(255, 0, 0);
  pg.ellipse(0, 0, 60, 60);
  pg.fill(255);
  pg.rect(-25, -10, 50, 20);
  pg.rect(-30, -30, 60, 10);
  bossEnemyImage = pg.get();
  
  // Create power-up sprites
  pg = createGraphics(20, 20);
  pg.translate(10, 10);
  pg.fill(0, 255, 0);
  pg.ellipse(0, 0, 15, 15);
  pg.fill(255);
  pg.textSize(10);
  pg.textAlign(CENTER, CENTER);
  pg.text("D", 0, 0);
  powerUpImages['duplo'] = pg.get();
  
  pg = createGraphics(20, 20);
  pg.translate(10, 10);
  pg.fill(0, 0, 255);
  pg.ellipse(0, 0, 15, 15);
  pg.fill(255);
  pg.textSize(10);
  pg.textAlign(CENTER, CENTER);
  pg.text("T", 0, 0);
  powerUpImages['triplo'] = pg.get();
  
  pg = createGraphics(20, 20);
  pg.translate(10, 10);
  pg.fill(255, 0, 255);
  pg.ellipse(0, 0, 15, 15);
  pg.fill(255);
  pg.textSize(10);
  pg.textAlign(CENTER, CENTER);
  pg.text("L", 0, 0);
  powerUpImages['laser'] = pg.get();
  
  // Novo power-up de vida
  pg = createGraphics(20, 20);
  pg.translate(10, 10);
  pg.fill(255, 0, 0);
  pg.ellipse(0, 0, 15, 15);
  pg.fill(255);
  pg.textSize(10);
  pg.textAlign(CENTER, CENTER);
  pg.text("♥", 0, 0);
  powerUpImages['vida'] = pg.get();

  gameState = 'start';
}

// Draw function
function draw() {
  if (gameState === 'start') {
    background(0);
    textAlign(CENTER);
    textSize(32);
    fill(255);
    text('Space Shooter', width / 2, height / 2 - 40);
    textSize(16);
    text('Press any key to start', width / 2, height / 2 + 20);
    
    // Instruções simplificadas
    textSize(14);
    text('Controles:', width / 2, height / 2 + 60);
    text('Setas: Movimento rápido', width / 2, height / 2 + 80);
    text('Shift + Setas: Movimento preciso', width / 2, height / 2 + 100);
    text('Espaço: Atirar', width / 2, height / 2 + 120);
  } else if (gameState === 'playing') {
    background(0);

    // Draw and update starfield
    stroke(255);
    for (let star of stars) {
      point(star.x, star.y);
      star.x -= star.speed;
      if (star.x < 0) {
        star.x = width;
        star.y = random(height);
      }
    }

    // Draw and update player
    player.draw();
    player.move();

    // Draw and update enemies
    for (let enemy of enemies) {
      enemy.draw();
      enemy.update();
    }

    // Draw and update player bullets
    for (let bullet of playerBullets) {
      bullet.draw();
      bullet.update();
    }

    // Draw and update enemy bullets
    for (let bullet of enemyBullets) {
      bullet.draw();
      bullet.update();
    }
    
    // Draw and update power-ups
    for (let powerUp of powerUps) {
      powerUp.draw();
      powerUp.update();
    }

    // Draw and update explosions
    for (let explosion of explosions) {
      explosion.draw();
      explosion.update();
    }

    // Collision detection: player bullets vs enemies
    for (let i = playerBullets.length - 1; i >= 0; i--) {
      let bullet = playerBullets[i];
      for (let j = enemies.length - 1; j >= 0; j--) {
        let enemy = enemies[j];
        if (dist(bullet.x, bullet.y, enemy.x, enemy.y) < enemy.width / 2) {
          // Laser penetra múltiplos inimigos
          if (bullet.type !== 'laser') {
            bullet.toRemove = true;
          }
          
          // Aplicar dano ao inimigo
          enemy.health--;
          
          // Verificar se o inimigo foi derrotado
          if (enemy.health <= 0) {
            enemy.toRemove = true;
            score += enemy.points;
            explosions.push(new Explosion(enemy.x, enemy.y));
            
            // Chance de soltar power-up
            let dropChance = 0.1; // 10% base
            if (enemy.type === 'large') dropChance = 0.15;
            if (enemy.type === 'fast') dropChance = 0.2;
            if (enemy.type === 'boss') dropChance = 1.0; // Sempre solta
            
            if (random() < dropChance) {
              let powerTypes = ['duplo', 'triplo', 'laser', 'vida'];
              let type = random(powerTypes);
              powerUps.push(new PowerUp(enemy.x, enemy.y, type));
            }
            
            if (enemy.type === 'boss') {
              bossActive = false;
              level++;
            }
          }
        }
      }
    }

    // Collision detection: enemy bullets vs player
    for (let bullet of enemyBullets) {
      if (!player.invulnerable && dist(bullet.x, bullet.y, player.x, player.y) < player.width / 2) {
        bullet.toRemove = true;
        lives--;
        if (lives <= 0) {
          gameState = 'gameOver';
        } else {
          player.invulnerable = true;
          player.invulnerableTimer = millis() + 2000;
        }
        explosions.push(new Explosion(player.x, player.y));
      }
    }
    
    // Collision detection: enemies vs player
    for (let enemy of enemies) {
      if (!player.invulnerable && dist(enemy.x, enemy.y, player.x, player.y) < (enemy.width + player.width) / 2) {
        lives--;
        if (lives <= 0) {
          gameState = 'gameOver';
        } else {
          player.invulnerable = true;
          player.invulnerableTimer = millis() + 2000;
        }
        explosions.push(new Explosion(player.x, player.y));
        
        // Não destruir o chefe na colisão
        if (enemy.type !== 'boss') {
          enemy.toRemove = true;
        }
      }
    }

    // Remove objects marked for deletion
    playerBullets = playerBullets.filter(b => !b.toRemove);
    enemies = enemies.filter(e => !e.toRemove);
    enemyBullets = enemyBullets.filter(b => !b.toRemove);
    explosions = explosions.filter(ex => !ex.toRemove);
    powerUps = powerUps.filter(p => !p.toRemove);

    // Spawn new enemies
    if (millis() > enemySpawnTimer && !bossActive) {
      let typeChance = random();
      let type;
      
      if (typeChance < 0.6) {
        type = 'small';
      } else if (typeChance < 0.9) {
        type = 'large';
      } else {
        type = 'fast';
      }
      
      enemies.push(new Enemy(type));
      enemySpawnTimer = millis() + (2000 / level); // Spawn mais rápido conforme o nível aumenta
    }
    
    // Spawn boss a cada 50 pontos
    if (score > 0 && score % 50 === 0 && !bossActive && millis() > bossSpawnTimer) {
      enemies.push(new Enemy('boss'));
      bossSpawnTimer = millis() + 60000; // Evitar spawn de múltiplos chefes
    }

    // Display UI
    fill(255);
    textAlign(LEFT);
    textSize(16);
    text('Score: ' + score, 10, 20);
    textAlign(RIGHT);
    text('Lives: ' + lives, width - 10, 20);
    textAlign(CENTER);
    text('Level: ' + level, width / 2, 20);

    // Check invulnerability timer
    if (player.invulnerable && millis() > player.invulnerableTimer) {
      player.invulnerable = false;
    }
  } else if (gameState === 'gameOver') {
    background(0);
    textAlign(CENTER);
    textSize(32);
    fill(255);
    text('Game Over', width / 2, height / 2 - 40);
    text('Your score: ' + score, width / 2, height / 2);
    textSize(16);
    text('Press any key to restart', width / 2, height / 2 + 40);
  }
}

// Handle key presses
function keyPressed() {
  if (gameState === 'start') {
    initializeGame();
    gameState = 'playing';
  } else if (gameState === 'playing') {
    if (key === ' ') {
      player.shoot();
    }
  } else if (gameState === 'gameOver') {
    gameState = 'start';
  }
}

// Initialize or reset game variables
function initializeGame() {
  player = new Player();
  enemies = [];
  playerBullets = [];
  enemyBullets = [];
  explosions = [];
  powerUps = [];
  score = 0;
  lives = 20;
  level = 1;
  bossActive = false;
  enemySpawnTimer = millis() + 2000;
  bossSpawnTimer = millis() + 30000;
}