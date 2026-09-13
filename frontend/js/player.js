// Fase 3: estado, movimiento y dibujo del jugador.
// Movimiento orientado a grilla: posiciones flotantes en píxeles, dirección
// bloqueada a los ejes horizontal/vertical (estilo arcade clásico).

class Player {
  constructor(game) {
    this.game = game;
    this.reset();
  }

  reset() {
    const [c, r] = MAZE.playerStart;
    this.col = c;
    this.row = r;
    this.x = centerX(c);
    this.y = centerY(r);
    this.dir = { x: 0, y: 0 };
    this.nextDir = { x: 0, y: 0 };
    this.speed = SPEEDS.player;
    this.mouth = 0; // fase de animación de la boca
  }

  // Dirección que el jugador desea tomar (flechas / WASD).
  setNext(x, y) {
    this.nextDir = { x, y };
  }

  get tilePos() {
    return { col: this.col, row: this.row };
  }

  update() {
    // Marcha atrás: se permite en cualquier momento, sin esperar a un cruce.
    if (isOpposite(this.nextDir, this.dir)) {
      this.dir = { x: this.nextDir.x, y: this.nextDir.y };
      this.nextDir = { x: 0, y: 0 };
    }
    stepMover(this, this.game);
    this.mouth += 0.35;
    this.collect();
  }

  // En el centro de la casilla se elige la nueva dirección.
  decideDirection(game) {
    const d = this.nextDir;
    this.nextDir = { x: 0, y: 0 };
    if ((d.x !== 0 || d.y !== 0) && game.playerWalkable(this.col + d.x, this.row + d.y)) {
      this.dir = { x: d.x, y: d.y };
      return;
    }
    if ((this.dir.x !== 0 || this.dir.y !== 0) &&
        game.playerWalkable(this.col + this.dir.x, this.row + this.dir.y)) {
      return; // sigue en la misma dirección
    }
    this.dir = { x: 0, y: 0 };
  }

  // Come pellets/poderes en la casilla actual.
  collect() {
    const g = this.game;
    const ch = g.grid[this.row][this.col];
    if (ch === '.') {
      g.grid[this.row][this.col] = ' ';
      g.dotsLeft--;
      g.score += 10;
    } else if (ch === '*') {
      g.grid[this.row][this.col] = ' ';
      g.score += 50;
      g.activateFrightened();
    }
  }

  draw() {
    const { tile } = MAZE;
    const a = directionAngle(this.dir);
    const half = (tile * 0.42);
    // Hincha/cierra la boca según la fase.
    const mouth = (Math.sin(this.mouth) * 0.35 + 0.25) * PI;
    noStroke();
    fill(255, 231, 37);
    // Cuerpo = sector circular que deja un hueco en forma de boca.
    arc(this.x, this.y, tile * 0.9, tile * 0.9, a + mouth / 2, a - mouth / 2 + TWO_PI, PIE);
    // Ojo hacia adelante.
    fill(255);
    ellipse(this.x + Math.cos(a) * half * 0.5, this.y + Math.sin(a) * half * 0.5, 4, 4);
    fill(0);
    ellipse(
      this.x + Math.cos(a) * half * 0.6,
      this.y + Math.sin(a) * half * 0.6,
      2, 2
    );
  }
}