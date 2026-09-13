# Pacman-Retro

Pacman clasico implementado 100% en **p5.js** (sin backend, sin build, sin servidor). Todo el juego vive en `frontend/`.

## Como jugar

1. Abrir `frontend/index.html` en el navegador.
2. Controles: **flechas** o **WASD** para moverse. **R** reinicia la partida.

## Como funciona

- `js/maze.js` — unica fuente de verdad del laberinto (grilla de strings, `playerStart`, `ghostStarts`).
- `js/game.js` — estado del juego, colisiones, HUD, motor de movimiento compartido.
- `js/player.js` — movimiento por teclado, comer pellets.
- `js/ghost.js` — 4 fantasmas con IA (BFS/A*), modos scatter/chase/frightened.
- `js/sketch.js` — entrada p5 (`setup`/`draw`).

## Verificacion (sin framework de test)

```bash
node --check frontend/js/*.js    # sintaxis
```

Para cambios de logica se usa un harness headless que simula miles de ticks sin p5 (ver referencia en `AGENTS.md`).