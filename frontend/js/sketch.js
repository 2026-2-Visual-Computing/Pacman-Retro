/* Use this only as the p5.js entry point.*/

function setup() {
  createCanvas(19 * 24, 15 * 24 + 32);
  initializeGame();
}

function draw() {
  background(0);

  if (game.status === "playing") {
    updateGame();
  }

  drawGame();
}

function keyPressed() {
  handlePlayerInput(keyCode, key);
}
