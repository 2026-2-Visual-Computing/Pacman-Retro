function createPlayer(spawn) {
  return {
    row: spawn.row,
    col: spawn.col,
    x: cellCenter(spawn.col, game.maze.cellSize),
    y: cellCenter(spawn.row, game.maze.cellSize),
    direction: "none",
    nextDirection: "none",
    speed: 2
  };
}

function handlePlayerInput(keyCode, key) {
  const directions = {};
  directions[UP_ARROW]    = "up";
  directions[DOWN_ARROW]  = "down";
  directions[LEFT_ARROW]  = "left";
  directions[RIGHT_ARROW]  = "right";
  directions["w"] = "up";
  directions["s"] = "down";
  directions["a"] = "left";
  directions["d"] = "right";
  const value = directions[keyCode] ?? (key ? directions[key.toLowerCase()] : undefined);
  if (game.player && value) game.player.nextDirection = value;
}

function updatePlayer(player, maze) {
  moveEntity(player, maze);
}

function drawPlayer(player, cellSize) {
  push();
  fill("#ffe600");
  noStroke();
  circle(player.x, player.y, cellSize * 0.72);
  pop();
}

function resetPlayer(player, spawn) {
  player.row = spawn.row;
  player.col = spawn.col;
  player.x = cellCenter(spawn.col, game.maze.cellSize);
  player.y = cellCenter(spawn.row, game.maze.cellSize);
  player.direction = "none";
  player.nextDirection = "none";
}
