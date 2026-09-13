// Fase 2/8: wiring del frontend. Entrada p5: setup y draw (sin backend).
// El laberinto llega embebido (js/maze.js), así abrir index.html directo funciona.

let game;

function setup() {
  createCanvas(MAZE.cols * MAZE.tile, MAZE.rows * MAZE.tile);
  frameRate(60);
  textFont('monospace');
  game = new Game();
}

function draw() {
  game.tick();
  game.draw();
  game.drawOverlay();
}

// Captura de teclado (flechas y WASD) → dirección deseada del jugador.
function keyPressed() {
  const p = game.player;
  switch (keyCode) {
    case UP_ARROW:
    case 87: // W
      p.setNext(0, -1);
      break;
    case DOWN_ARROW:
    case 83: // S
      p.setNext(0, 1);
      break;
    case LEFT_ARROW:
    case 65: // A
      p.setNext(-1, 0);
      break;
    case RIGHT_ARROW:
    case 68: // D
      p.setNext(1, 0);
      break;
    case 82: // R: reiniciar partida completa
      game = new Game();
      break;
    default:
      break;
  }
  return false; // evita scroll con flechas
}