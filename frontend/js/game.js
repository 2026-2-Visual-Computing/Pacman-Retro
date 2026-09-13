// Fase 8: orquesta el estado del juego, el "tick", el HUD y las colisiones.
// Game es el único dueño del estado compartido: no queda nada en el backend.

const TILE = MAZE.tile;

const SPEEDS = {
  player: 3.4,      // px por frame
  ghost: 2.9,
  frightened: 1.6,
  eyes: 4.2,
};

const MODE_DURATION = {
  scatter: 7 * 60,
  chase: 20 * 60,
};
const FRIGHTENED_DURATION = 6 * 60;
const RELEASE_MS = [3 * 60, 6 * 60, 9 * 60, 12 * 60];
const RESPAWN_EAT_BONUS = 200;

function centerX(c) { return (c + 0.5) * TILE; }
function centerY(r) { return (r + 0.5) * TILE; }

function directionAngle(dir) {
  if (dir.x === 0 && dir.y === -1) return -HALF_PI;
  if (dir.x === 0 && dir.y === 1) return HALF_PI;
  if (dir.x === -1) return PI;
  return 0;
}

function isOpposite(a, b) {
  return a.x === -b.x && a.y === -b.y;
}

// Avanza un "mover" (jugador o fantasma) un frame dentro de la grilla:
// mueve su posición en píxeles y, al cruzar el centro de una casilla, decide
// la próxima dirección. Así el movimiento queda atado a los ejes de la grilla.
function stepMover(mover, game) {
  // Detenido: intenta decidir (p. ej. arrancar tras una esquina o un respawn).
  if (mover.dir.x === 0 && mover.dir.y === 0) {
    mover.decideDirection(game);
  }
  const { col, row } = mover;
  // Bloquea el eje perpendicular: al moverse en X la Y queda alineada al tile.
  mover.x += mover.dir.x * mover.speed;
  mover.y += mover.dir.y * mover.speed;
  const dx = mover.dir.x;
  const dy = mover.dir.y;
  const targetCol = col + dx;
  const targetRow = row + dy;
  const ok = mover instanceof Player
    ? game.playerWalkable(targetCol, targetRow)
    : game.ghostWalkable(targetCol, targetRow);

  // ¿Llegamos al centro de la casilla destino?
  const reachedX = (dx !== 0) && ((dx > 0 && mover.x >= centerX(targetCol)) || (dx < 0 && mover.x <= centerX(targetCol)));
  const reachedY = (dy !== 0) && ((dy > 0 && mover.y >= centerY(targetRow)) || (dy < 0 && mover.y <= centerY(targetRow)));

  if ((reachedX || reachedY) && ok) {
    mover.col += dx;
    mover.row += dy;
    mover.x = centerX(mover.col);
    mover.y = centerY(mover.row);
    mover.decideDirection(game);
  } else if (reachedX || reachedY) {
    // Pared: frena contra el borde de la casilla sin entrar.
    mover.x = dx > 0 ? (col + 1) * TILE : dx < 0 ? col * TILE : mover.x;
    mover.y = dy > 0 ? (row + 1) * TILE : dy < 0 ? row * TILE : mover.y;
    mover.dir = { x: 0, y: 0 };
  }
}

class Game {
  constructor() {
    this.reset();
  }

  reset() {
    this.grid = MAZE.grid.map((r) => r.split(''));
    this.player = new Player(this);
    this.ghosts = [];
    for (let i = 0; i < GHOST_SPECS.length; i++) {
      this.ghosts.push(new Ghost(this, i));
    }
    this.score = 0;
    this.lives = 3;
    this.mode = 'scatter';
    this.modeTic = 0;
    this.frightened = false;
    this.frightenedTic = 0;
    this.tic = 0;
    this.gameOver = false;
    this.win = false;
    this.dotsLeft = this.countDots();
  }

  countDots() {
    let n = 0;
    for (const row of this.grid) for (const ch of row) if (ch === '.' || ch === '*') n++;
    return n;
  }

  // Transición ciclo scatter -> chase -> ...
  updateMode() {
    this.modeTic++;
    const dur = MODE_DURATION[this.mode];
    if (this.modeTic >= dur) {
      this.mode = this.mode === 'scatter' ? 'chase' : 'scatter';
      this.modeTic = 0;
    }
    if (this.frightened) {
      this.frightenedTic++;
      if (this.frightenedTic >= FRIGHTENED_DURATION) {
        this.frightened = false;
      }
    }
  }

  activateFrightened() {
    if (this.frightened) return;
    this.frightened = true;
    this.frightenedTic = 0;
    // Invierte el rumbo de los fantasmas activos (efecto clásico).
    for (const g of this.ghosts) {
      if (g.state === 'active') g.dir = { x: -g.dir.x, y: -g.dir.y };
    }
  }

  playerWalkable(c, r) {
    if (c < 0 || r < 0 || c >= MAZE.cols || r >= MAZE.rows) return false;
    const ch = this.grid[r][c];
    return ch !== 'W' && ch !== 'D';
  }

  ghostWalkable(c, r) {
    if (c < 0 || r < 0 || c >= MAZE.cols || r >= MAZE.rows) return false;
    // Los fantasmas sí cruzan la puerta de la casa ("D").
    return this.grid[r][c] !== 'W';
  }

  tick() {
    if (this.gameOver || this.win) return;
    this.tic++;
    this.updateMode();

    this.player.update();

    // Colisiones (solo cuando compartimos el mismo tile).
    const p = this.player;
    for (const g of this.ghosts) {
      if (g.state === 'house' || g.state === 'eyes') continue;
      if (g.col === p.col && g.row === p.row) {
        if (this.frightened) {
          g.state = 'eyes'; // el ojo camina de vuelta a la casa
          this.score += RESPAWN_EAT_BONUS;
        } else {
          this.loseLife();
          break;
        }
      }
    }

    for (const g of this.ghosts) g.update(this.tic);

    if (this.dotsLeft <= 0) this.win = true;
  }

  loseLife() {
    this.lives--;
    if (this.lives < 0) {
      this.gameOver = true;
      return;
    }
    // Reinicia posiciones sin tocar el marcador.
    this.player.reset();
    this.ghosts.forEach((g) => g.reset(this.tic));
    this.frightened = false;
    this.frightenedTic = 0;
    this.mode = 'scatter';
    this.modeTic = 0;
  }

  draw() {
    background(0);
    this.drawMaze();
    for (const g of this.ghosts) g.draw();
    this.player.draw();
    this.drawHUD();
  }

  drawMaze() {
    const { cols, rows, tile } = MAZE;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const ch = this.grid[r][c];
        const x = c * tile;
        const y = r * tile;
        if (ch === 'W') {
          fill(25, 25, 220);
          noStroke();
          rect(x, y, tile, tile);
        } else if (ch === 'D') {
          fill(200, 160, 255);
          rect(x, y, tile, tile);
        } else if (ch === '.') {
          fill(255, 174, 201);
          noStroke();
          ellipse(x + tile / 2, y + tile / 2, 4, 4);
        } else if (ch === '*') {
          const blink = (Math.floor(this.tic / 20) % 2 === 0);
          noStroke();
          if (blink) {
            fill(255, 174, 255);
            ellipse(x + tile / 2, y + tile / 2, tile * 0.7, tile * 0.7);
          }
        }
      }
    }
  }

  drawHUD() {
    const { tile } = MAZE;
    fill(255);
    noStroke();
    textSize(14);
    textStyle(BOLD);
    textAlign(LEFT, TOP);
    text(`PUNTOS ${this.score}`, 6, 2);
    textAlign(RIGHT, TOP);
    text(`VIDAS ${this.lives}`, MAZE.cols * tile - 6, 2);

    // Modo actual (debug simple).
    noStroke();
    if (this.frightened) {
      fill(30, 30, 200);
      textAlign(CENTER, TOP);
      text('MODO ASUSTADO', MAZE.cols * tile / 2, 2);
    }
  }

  drawOverlay() {
    noStroke();
    textStyle(BOLD);
    textAlign(CENTER, CENTER);
    if (this.gameOver) {
      fill(255, 60, 60);
      textSize(26);
      text('GAME OVER', width / 2, height / 2 - 30);
      fill(255);
      textSize(17);
      text('R para reiniciar', width / 2, height / 2 + 6);
    } else if (this.win) {
      fill(40, 255, 40);
      textSize(26);
      text('¡GANASTE!', width / 2, height / 2 - 30);
      fill(255);
      textSize(17);
      text('R para jugar de nuevo', width / 2, height / 2 + 6);
    }
  }
}