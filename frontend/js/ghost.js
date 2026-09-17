const GHOST_COLORS = {
  chaser: "#ff3030",
  interceptor: "#ff9de2",
  strategic: "#25d9ff",
  random: "#ff9d2e"
};

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
    color: GHOST_COLORS[spawn.id] || "white"
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
  push();
  fill(ghost.color);
  noStroke();
  circle(ghost.x, ghost.y, cellSize * 0.7);
  rectMode(CENTER);
  rect(ghost.x, ghost.y + cellSize * 0.14, cellSize * 0.7, cellSize * 0.28);
  fill("white");
  circle(ghost.x - cellSize * 0.13, ghost.y - cellSize * 0.08, cellSize * 0.16);
  circle(ghost.x + cellSize * 0.13, ghost.y - cellSize * 0.08, cellSize * 0.16);
  fill("#111");
  circle(ghost.x - cellSize * 0.13, ghost.y - cellSize * 0.08, cellSize * 0.07);
  circle(ghost.x + cellSize * 0.13, ghost.y - cellSize * 0.08, cellSize * 0.07);
  pop();
}

function resetGhost(ghost, spawn) {
  ghost.row = spawn.row;
  ghost.col = spawn.col;
  ghost.x = cellCenter(spawn.col, game.maze.cellSize);
  ghost.y = cellCenter(spawn.row, game.maze.cellSize);
  ghost.direction = "none";
  ghost.nextDirection = "none";
}

  
