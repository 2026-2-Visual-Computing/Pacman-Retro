const game = {
  maze: null,
  player: null,
  ghosts: [],
  pellets: new Set(),
  powerPellets: new Set(),
  powerUntil: 0,
  score: 0,
  lives: 3,
  status: "loading",
  lastGhostRequest: 0,
  ghostRequestInProgress: false
};

const DIRECTIONS = {
  up: [-1, 0], down: [1, 0], left: [0, -1], right: [0, 1]
};

function cellCenter(index, size) { return index * size + size / 2; }

function isWalkable(row, col, maze) {
  return maze && row >= 0 && row < maze.rows && col >= 0 && col < maze.cols && maze.grid[row][col] === 1;
}
function atCellCenter(entity, size) {
  return Math.abs(entity.x - cellCenter(entity.col, size)) < 0.1 &&
    Math.abs(entity.y - cellCenter(entity.row, size)) < 0.1;
}
function canMove(entity, direction, maze) {
  const delta = DIRECTIONS[direction];
  return delta && isWalkable(entity.row + delta[0], entity.col + delta[1], maze);
}
function moveEntity(entity, maze) {
  const size = maze.cellSize;
  if (atCellCenter(entity, size)) {
    entity.x = cellCenter(entity.col, size);
    entity.y = cellCenter(entity.row, size);
    if (canMove(entity, entity.nextDirection, maze)) entity.direction = entity.nextDirection;
    if (!canMove(entity, entity.direction, maze)) {
      entity.direction = "none";
      return;
    }
  }
  const delta = DIRECTIONS[entity.direction];
  if (!delta) return;
  entity.x += delta[1] * entity.speed;
  entity.y += delta[0] * entity.speed;
  entity.row = constrain(Math.round((entity.y - size / 2) / size), 0, maze.rows - 1);
  entity.col = constrain(Math.round((entity.x - size / 2) / size), 0, maze.cols - 1);
}

async function initializeGame() {
  try {
    game.maze = await fetchMaze();
    game.player = createPlayer(game.maze.playerSpawn);
    game.ghosts = game.maze.ghostSpawns.map(createGhost);
    game.pellets = new Set(game.maze.pellets.map(p => `${p.row},${p.col}`));
    game.powerPellets = new Set((game.maze.powerPellets || []).map(p => `${p.row},${p.col}`));
    game.powerUntil = 0;
    game.status = "playing";
  } catch (error) {
    console.error(error);
    game.status = "error";
  }
}

function updateGame() {
  updatePlayer(game.player, game.maze);
  game.ghosts.forEach(ghost => updateGhost(ghost, game.maze));
  collectPellet();
  checkGhostCollisions();

  if (game.pellets.size === 0 && game.powerPellets.size === 0) game.status = "won";
  const now = millis();
  if (!game.ghostRequestInProgress && now - game.lastGhostRequest > 300) {
    game.lastGhostRequest = now;
    game.ghostRequestInProgress = true;
    requestGhostMoves(game.player, game.ghosts).then(response => {
      applyGhostMoves(game.ghosts, response);
    }).catch(console.error).finally(() => {
      game.ghostRequestInProgress = false;
    });
  }
}

function drawGame() {
  if (!game.maze) {
    fill("white"); textAlign(CENTER, CENTER); text("Cargando...", width / 2, height / 2); return;
  }
  const size = game.maze.cellSize;
  for (let row = 0; row < game.maze.rows; row++) {
    for (let col = 0; col < game.maze.cols; col++) {
      if (game.maze.grid[row][col] === 0) {
        fill("#14258c"); stroke("#294cff"); rect(col * size, row * size, size, size);
      }
    }
  }
  noStroke(); fill("#ffdca8");
  game.pellets.forEach(key => { const [row, col] = key.split(",").map(Number); circle(cellCenter(col, size), cellCenter(row, size), 4); });
  const powerBlink = frameCount % 20 < 10;
  fill(powerBlink ? "white" : "#ff6699");
  game.powerPellets.forEach(key => { const [row, col] = key.split(",").map(Number); circle(cellCenter(col, size), cellCenter(row, size), size * 0.4); });
  if (game.player) drawPlayer(game.player, size);
  game.ghosts.forEach(ghost => drawGhost(ghost, size));
  drawHud();
}

function collectPellet() {
  const key = `${game.player.row},${game.player.col}`;
  if (game.pellets.delete(key)) { game.score += 10; return; }
  if (game.powerPellets.delete(key)) {
    game.score += 50;
    // Gancho para la futura fase: al comer una super bola los fantasmas cambiarán de estado.
    game.powerUntil = millis() + 8000;
  }
}

function checkGhostCollisions() {
  for (const ghost of game.ghosts) {
    if (dist(game.player.x, game.player.y, ghost.x, ghost.y) < game.maze.cellSize * 0.55) {
      loseLife(); return;
    }
  }
}

function loseLife() {
  game.lives--;
  if (game.lives <= 0) { game.status = "gameOver"; return; }
  resetRound();
}

function resetRound() {
  resetPlayer(game.player, game.maze.playerSpawn);
  game.ghosts.forEach((ghost, index) => resetGhost(ghost, game.maze.ghostSpawns[index]));
}

function drawHud() {
  const hudY = game.maze.rows * game.maze.cellSize + 6;
  fill("white"); noStroke(); textAlign(LEFT, TOP); textSize(16);
  text(`Score: ${game.score}   Lives: ${game.lives}`, 8, hudY);
  if (game.status === "won" || game.status === "gameOver" || game.status === "error") {
    textAlign(CENTER, CENTER); textSize(26);
    text(game.status === "won" ? "YOU WIN" : game.status === "gameOver" ? "GAME OVER" : "BACKEND ERROR", width / 2, height / 2);
  }
}
