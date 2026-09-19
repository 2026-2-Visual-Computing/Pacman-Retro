// Configuración de ítems de bonus: agrega un objeto por cada ítem futuro.
// El ítem aparece en el centro del laberinto (spawn del jugador) cuando el
// puntaje alcanza su "threshold"; al pasar Pac-Man por él se consume y suma
// "points", entonces se habilita el siguiente ítem de la lista.
const BONUS_ITEMS_CONFIG = [
  { image: "images/cereza.png", threshold: 1500, points: 100 },
  { image: "images/fresa.png", threshold: 2500, points: 200 },
  // futuro: { image: "images/cereza.png", threshold: 2000, points: 200 },
];

class BonusItems {
  constructor(config, spawn, images) {
    this.items = config;
    this.spawn = spawn;
    this.images = images;
    this.index = 0;
    this.active = false;
  }

  get current() {
    return this.items[this.index];
  }

  update(player, score) {
    const item = this.current;
    if (!item) return 0;

    if (!this.active) {
      if (score >= item.threshold) this.active = true;
      return 0;
    }

    if (player.row === this.spawn.row && player.col === this.spawn.col) {
      this.active = false;
      this.index++;
      return item.points;
    }
    return 0;
  }

  draw(cellSize) {
    if (!this.active) return;
    const item = this.current;
    const img = this.images[this.index];
    if (!img) return;

    const height = cellSize * 0.8;
    const width = height * (img.width / img.height);
    const x = cellCenter(this.spawn.col, cellSize) - width / 2;
    const y = cellCenter(this.spawn.row, cellSize) - height / 2;
    image(img, x, y, width, height);
  }
}