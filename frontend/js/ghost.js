// Fase 6/7: estado, movimiento y dibujo de los 4 fantasmas.
// Cada fantasma elige su dirección en las intersecciones siguiendo su
// comportamiento (perseguidor = BFS, interceptor = A*, estratégico = A* con
// emboscada, aleatorio = distancia). Los movimientos viven 100% en el cliente.

const DIRS = [
  { x: 0, y: -1 }, // arriba
  { x: 0, y: 1 },  // abajo
  { x: -1, y: 0 }, // izquierda
  { x: 1, y: 0 },  // derecha
];

const GHOST_SPECS = [
  { name: 'chaser',      color: '#ff0000' }, // Blinky — persistente
  { name: 'interceptor', color: '#ffb8ff' }, // Pinky — adelantado al jugador
  { name: 'strategic',   color: '#00ffff' }, // Inky — emboscada (A*)
  { name: 'random',      color: '#ffb852' }, // Clyde — aleatorio si está lejos
];

const SCATTER_CORNERS = [
  { col: 19, row: 1 },
  { col: 1, row: 1 },
  { col: 19, row: 19 },
  { col: 1, row: 19 },
];

class Ghost {
  constructor(game, index) {
    this.game = game;
    this.index = index;
    const spec = GHOST_SPECS[index];
    this.name = spec.name;
    this.color = spec.color;
    this.reset();
  }

  reset(roundMs) {
    const [c, r] = MAZE.ghostStarts[this.index];
    this.col = c;
    this.row = r;
    this.x = centerX(c);
    this.y = centerY(r);
    this.dir = { x: 0, y: 0 };
    this.nextDir = { x: 0, y: 0 };
    this.speed = SPEEDS.ghost;
    this.state = 'house'; // 'house' | 'active' | 'eyes'
    // Salida escalonada inicial; tras perder una vida se reactiva en `roundMs`.
    this.releaseAt = roundMs !== undefined ? roundMs : RELEASE_MS[this.index];
  }

  get tilePos() {
    return { col: this.col, row: this.row };
  }

  update(tic) {
    const game = this.game;
    // Liberación escalonada desde la casa.
    if (this.state === 'house' && tic >= this.releaseAt) {
      this.state = 'active';
    }
    if (this.state === 'house') return;

    this.speed = this.state === 'eyes'
      ? SPEEDS.eyes
      : (game.frightened ? SPEEDS.frightened : SPEEDS.ghost);

    stepMover(this, game);

    // Con BFS, cuando el fantasma es comido (estado "eyes") busca su casilla de
    // respawn en la casa.
    if (this.state === 'eyes' && this.col === MAZE.ghostStarts[this.index][0] &&
        this.row === MAZE.ghostStarts[this.index][1]) {
      this.state = 'active';
    }
  }

  // Se ejecuta en el centro de cada casilla (ver stepMover).
  decideDirection(game) {
    // Comedido (eyes): elige el tile de la casa, ignorando al jugador.
    const target = this.state === 'eyes'
      ? { col: MAZE.ghostStarts[this.index][0], row: MAZE.ghostStarts[this.index][1] }
      : this.computeTarget(game);

    // Posibles direcciones sin chocar con paredes, evitando revertir su rumbo
    // salvo que sea un callejón sin salida.
    const opts = DIRS.filter((d) => {
      const nc = this.col + d.x;
      const nr = this.row + d.y;
      if (!game.ghostWalkable(nc, nr)) return false;
      if (isOpposite(d, this.dir)) return false;
      return true;
    });
    const all = DIRS.filter((d) => game.ghostWalkable(this.col + d.x, this.row + d.y));

    let choice;
    if (opts.length === 0) {
      // Sin opciones (o todas reversas): girar (en tienda o cruz sin retorno).
      choice = all[0] || this.dir;
    } else if (this.state === 'eyes') {
      choice = bfsNext(this, opts, target);
    } else if (game.frightened) {
      choice = opts[Math.floor(Math.random() * opts.length)];
    } else if (this.name === 'interceptor') {
      choice = bfsNext(this, opts, target);
    } else if (this.name === 'strategic') {
      choice = astarNext(this, opts, target);
    } else if (this.name === 'random') {
      choice = this.randomNext(game, opts);
    } else {
      // chaser: persigue directo con BFS.
      choice = bfsNext(this, opts, target);
    }
    if (choice) this.dir = { x: choice.x, y: choice.y };
  }

  computeTarget(game) {
    // Modo dispersión: cada uno a su esquina.
    if (game.mode === 'scatter') return SCATTER_CORNERS[this.index];
    const p = game.player;
    switch (this.name) {
      case 'interceptor': {
        // Apunta 4 tiles adelante del jugador.
        const a = directionAngle(p.dir);
        const ahead = {
          col: Math.round(p.col + Math.cos(a) * 4),
          row: Math.round(p.row + Math.sin(a) * 4),
        };
        return clampTarget(ahead);
      }
      case 'strategic': {
        // Emboscada: apunta 2 tiles delante del jugador (acercamiento a la pelota).
        const a = directionAngle(p.dir);
        const ambush = {
          col: Math.round(p.col + Math.cos(a) * 2),
          row: Math.round(p.row + Math.sin(a) * 2),
        };
        return clampTarget(ambush);
      }
      case 'random':
        // Lejos → persigue; cerca → se va a su esquina dispersándose.
        if (distTiles(this, p) > 7) return p.tilePos;
        return SCATTER_CORNERS[this.index];
      default:
        // chaser
        return p.tilePos;
    }
  }

  // Clyde: comportamiento "aleatorio" cuando la distancia supera un umbral.
  randomNext(game, opts) {
    const p = game.player;
    const chase = { ...p.tilePos };
    // Misma lógica que computeTarget pero eligiendo entre las opciones reales:
    // si le toca dispersarse, elige hacia su esquina.
    const target = this.index === 3 ? (distTiles(this, p) > 7 ? chase : SCATTER_CORNERS[this.index]) : chase;
    return bfsNext(this, opts, target);
  }

  draw() {
    const { tile } = MAZE;
    const centerY = this.y - tile * 0.08;
    noStroke();
    const isEaten = this.state === 'eyes';
    const frightened = this.game.frightened && !isEaten;

    if (isEaten) {
      // Solo ojos yendo a la casa.
      this.drawEyes(centerY);
      return;
    }
    const base = frightened ? (Math.floor(this.game.tic / 6) % 2 ? '#2121de' : '#ffffff') : this.color;
    fill(base);
    // Cuerpo: semicírculo superior + base.
    ellipse(this.x, centerY - tile * 0.22, tile * 0.72, tile * 0.72);
    rect(this.x - tile * 0.36, centerY - tile * 0.22, tile * 0.72, tile * 0.3);
    // Faldón ondulado.
    const bottom = centerY + tile * 0.08;
    fill(base);
    for (let i = -1; i <= 1; i++) {
      arc(this.x + i * tile * 0.24, bottom, tile * 0.24, tile * 0.24, 0, PI, CHORD);
    }
    this.drawEyes(centerY);
  }

  drawEyes(cy) {
    const { tile } = MAZE;
    const spread = tile * 0.13;
    const eyeSize = tile * 0.14;
    fill(255);
    ellipse(this.x - spread, cy - tile * 0.18, eyeSize, eyeSize * 1.3);
    ellipse(this.x + spread, cy - tile * 0.18, eyeSize, eyeSize * 1.3);
    fill(0);
    const a = directionAngle(this.dir);
    ellipse(this.x - spread + Math.cos(a) * 2.5, cy - tile * 0.18 + Math.sin(a) * 2.5, eyeSize * 0.55, eyeSize * 0.55);
    ellipse(this.x + spread + Math.cos(a) * 2.5, cy - tile * 0.18 + Math.sin(a) * 2.5, eyeSize * 0.55, eyeSize * 0.55);
  }
}

// ---- Búsquedas ------------------------------------------------------------

// BFS desde el origen; devuelve la dirección del primer paso hacia el target.
function bfsNext(ghost, opts, target) {
  const game = ghost.game;
  const queue = [{ col: target.col, row: target.row }];
  const visited = new Set([target.col + ',' + target.row]);
  let from = { [target.col + ',' + target.row]: null };
  // BFS con heurística simple: encontramos la distancia a cada tile caminable.
  while (queue.length) {
    const cur = queue.shift();
    for (const d of DIRS) {
      const nc = cur.col + d.x;
      const nr = cur.row + d.y;
      const key = nc + ',' + nr;
      if (visited.has(key) || !game.ghostWalkable(nc, nr)) continue;
      visited.add(key);
      from[key] = cur;
      queue.push({ col: nc, row: nr });
    }
  }
  // Elige la opción que deje el menor paso (más cercana al target).
  let best = null;
  let bestDist = Infinity;
  for (const opt of opts) {
    const nc = ghost.col + opt.x;
    const nr = ghost.row + opt.y;
    const key = nc + ',' + nr;
    if (!visited.has(key)) continue;
    let dist = 0;
    let c = { col: nc, row: nr };
    while (from[c.col + ',' + c.row]) {
      c = from[c.col + ',' + c.row];
      dist++;
    }
    if (dist < bestDist) {
      bestDist = dist;
      best = opt;
    }
  }
  return best || opts[0];
}

// A* desde el origen; devuelve la dirección del primer paso hacia el target.
function astarNext(ghost, opts, target) {
  const game = ghost.game;
  const start = { col: ghost.col, row: ghost.row };
  const open = [start];
  const gScore = { [keyOf(start)]: 0 };
  const came = {};
  const closed = new Set();
  const h = (a) => Math.abs(a.col - target.col) + Math.abs(a.row - target.row);

  while (open.length) {
    open.sort((a, b) => (gScore[keyOf(a)] + h(a)) - (gScore[keyOf(b)] + h(b)));
    const cur = open.shift();
    const ck = keyOf(cur);
    if (cur.col === target.col && cur.row === target.row) break;
    if (closed.has(ck)) continue;
    closed.add(ck);
    for (const d of DIRS) {
      const nc = cur.col + d.x;
      const nr = cur.row + d.y;
      if (!game.ghostWalkable(nc, nr)) continue;
      const nk = nc + ',' + nr;
      if (closed.has(nk)) continue;
      const tentative = gScore[ck] + 1;
      if (tentative < (gScore[nk] ?? Infinity)) {
        gScore[nk] = tentative;
        came[nk] = { col: cur.col, row: cur.row };
        open.push({ col: nc, row: nr });
      }
    }
  }

  // Reconstruye el primer paso desde el origen.
  let step = { col: target.col, row: target.row };
  let cur = target;
  while (keyOf(cur) !== keyOf(start)) {
    step = cur;
    cur = came[keyOf(cur)];
    if (!cur) return opts[0];
  }
  const d = { x: step.col - start.col, y: step.row - start.row };
  return opts.find((o) => o.x === d.x && o.y === d.y) || opts[0];
}

function keyOf(p) { return p.col + ',' + p.row; }
function distTiles(a, b) { return Math.abs(a.col - b.col) + Math.abs(a.row - b.row); }

function clampTarget(t) {
  return {
    col: Math.max(0, Math.min(MAZE.cols - 1, t.col)),
    row: Math.max(0, Math.min(MAZE.rows - 1, t.row)),
  };
}