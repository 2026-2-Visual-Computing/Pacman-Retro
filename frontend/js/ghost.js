const GHOST_COLORS = {
  chaser: "#ff3030",
  interceptor: "#ff9de2",
  strategic: "#25d9ff",
  random: "#ff9d2e"
};

const FRIGHTENED_BLINK_MS = 2000;

function createGhost(spawn) {
  return {
    id: spawn.id,
    row: spawn.row,
    col: spawn.col,
    x: cellCenter(spawn.col, game.maze.cellSize),
    y: cellCenter(spawn.row, game.maze.cellSize),
    direction: "none",
    nextDirection: "none",
    speed: 1.5,
    color: GHOST_COLORS[spawn.id] || "white",
    stateMachine: new GhostStateMachine()
  };
}

function updateGhost(ghost, maze) {
  moveEntity(ghost, maze);
}

function applyGhostMoves(ghosts, response) {
  (response.moves || []).forEach(move => {
    const ghost = ghosts.find(item => item.id === move.id);
    if (ghost && DIRECTIONS[move.direction]) ghost.nextDirection = move.direction;
  });
}

function drawGhost(ghost, cellSize) {
  const machine = ghost.stateMachine;

  if (machine.isEyes()) {
    drawGhostEyesOnly(ghost, cellSize);
    return;
  }

  push();
  noStroke();
  if (machine.isFrightened()) {
    const remaining = game.powerUntil - millis();
    const whiteFlash = remaining < FRIGHTENED_BLINK_MS && Math.floor(millis() / 200) % 2 === 0;
    drawFrightenedGhostBody(ghost, cellSize, whiteFlash);
    drawGhostEyes(ghost, cellSize, whiteFlash ? "#2631f7" : "white");
  } else {
    drawNormalGhostBody(ghost, cellSize);
    drawGhostEyes(ghost, cellSize, "#111");
  }
  pop();
}

function drawNormalGhostBody(ghost, cellSize) {
  fill(ghost.color);
  circle(ghost.x, ghost.y, cellSize * 0.7);
  rectMode(CENTER);
  rect(ghost.x, ghost.y + cellSize * 0.14, cellSize * 0.7, cellSize * 0.28);
}

function drawFrightenedGhostBody(ghost, cellSize, whiteFlash) {
  fill(whiteFlash ? "white" : "#2631f7");
  circle(ghost.x, ghost.y, cellSize * 0.7);
  fill(whiteFlash ? "#2631f7" : "white");
  for (let i = 0; i < 4; i++) {
    circle(ghost.x - cellSize * 0.21 + i * cellSize * 0.14, ghost.y + cellSize * 0.31, cellSize * 0.13);
  }
  fill(whiteFlash ? "#2631f7" : "white");
  for (let i = 0; i < 3; i++) {
    circle(ghost.x - cellSize * 0.14 + i * cellSize * 0.14, ghost.y + cellSize * 0.29, cellSize * 0.08);
  }
}

function drawGhostEyes(ghost, cellSize, pupilColor) {
  fill("white");
  circle(ghost.x - cellSize * 0.13, ghost.y - cellSize * 0.08, cellSize * 0.16);
  circle(ghost.x + cellSize * 0.13, ghost.y - cellSize * 0.08, cellSize * 0.16);
  fill(pupilColor);
  circle(ghost.x - cellSize * 0.13, ghost.y - cellSize * 0.08, cellSize * 0.07);
  circle(ghost.x + cellSize * 0.13, ghost.y - cellSize * 0.08, cellSize * 0.07);
}

function drawGhostEyesOnly(ghost, cellSize) {
  push();
  noStroke();
  fill("white");
  circle(ghost.x - cellSize * 0.12, ghost.y, cellSize * 0.32);
  circle(ghost.x + cellSize * 0.12, ghost.y, cellSize * 0.32);
  fill("#2631f7");
  circle(ghost.x - cellSize * 0.12, ghost.y, cellSize * 0.16);
  circle(ghost.x + cellSize * 0.12, ghost.y, cellSize * 0.16);
  pop();
}

function resetGhost(ghost, spawn) {
  ghost.row = spawn.row;
  ghost.col = spawn.col;
  ghost.x = cellCenter(spawn.col, game.maze.cellSize);
  ghost.y = cellCenter(spawn.row, game.maze.cellSize);
  ghost.direction = "none";
  ghost.nextDirection = "none";
  ghost.stateMachine.reset();
}

  
