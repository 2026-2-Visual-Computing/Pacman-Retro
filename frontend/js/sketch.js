/* Use this only as the p5.js entry point.*/

const GAME_W = 19 * 24;
const GAME_H = 15 * 24 + 32;
const ZOOM = 2;

function preload() {
  game.bonusImages = BONUS_ITEMS_CONFIG.map((item) => loadImage(item.image));
}

function setup() {
  createCanvas(GAME_W * ZOOM, GAME_H * ZOOM);
  initializeGame();
}

function draw() {
  background(0);

  if (game.status === "playing") {
    updateGame();
  }

  push();
  scale(ZOOM);
  drawGame();
  pop();
}

function keyPressed() {
  handlePlayerInput(keyCode, key);
}
