# AGENTS.md

## Decision de arquitectura (importante)

La arquitectura se planteo originalmente como dos stacks (backend Flask + frontend p5.js), pero se decidio implementar **todo en p5.js** (un arcade local no necesita ida y vuelta HTTP): el juego completo vive en `frontend/`. No hay endpoints, no hay `fetch`, y **no intentar** introducir una API nueva en este proyecto sin preguntar antes.

- `backend/` (Flask), `tests/` (pytest), `shared/maze.json` y `jsconfig.json` fueron **eliminados** por ser obsoletos.
- La unica fuente del laberinto es `frontend/js/maze.js`.

## Estado actual de `frontend/`

Juego jugable terminado. Punto de entrada: abrir `frontend/index.html` directo en el navegador (sin build, sin servidor). Archivos y su rol:

- `js/maze.js` — `MAZE` (datos): `grid` de strings, `cols/rows`, `tile`, `playerStart`, `ghostStarts`. **Unica fuente de verdad** del laberinto. Leyenda de celdas: `W` pared, `.` pellet, `*` poder, ` ` corredor, `D` puerta de la casa (solo fantasmas).
- `js/game.js` — `Game`: dueño del estado (grid mutable, score, vidas, `frightened`, modo scatter/chase), colisiones, HUD, y el motor compartido `stepMover` + helpers (`centerX/Y`, `TILE`, `SPEEDS`).
- `js/player.js` — `Player`: movimiento por teclado, comer pellets, dibujo.
- `js/ghost.js` — `Ghost` (x4, `GHOST_SPECS`): IA por fantasma (`bfsNext`/`astarNext`), scatter/chase/frightened/eyes. Estados: `house`/`active`/`eyes`.
- `js/sketch.js` — p5 entry: `setup`/`draw`, teclado (flechas + WASD, `R` reinicia).

Convenios del codigo:
- **Coordenadas `(columna, fila)`** = (x, y); el centro de una celda es `(col+0.5)*tile`, `(row+0.5)*tile`.
- El movimiento es rapido en píxeles pero **atado a la grilla**: cada entidad avanza por frame y, al cruzar el centro de una celda, `decideDirection()` elige la proxima direccion (ver `stepMover` en `game.js`).
- Comentarios/TODOs de este repo se escriben en **espanol**.

## Verificacion

No hay framework de test. Se valida con Node en sintaxis y, para cambios de logica, con un harness headless (ver ejemplo en `C:\Users\juanp\AppData\Local\Temp\opencode\smoke_game.js`):

```bash
node --check frontend/js/*.js    # sintaxis
node <harness>                    # simula 18000+ ticks sin p5 y busca NaN/errores
```

Cambios de maze: mantener el grid **simetrico** (filas palindromas) y que todo quede conectado; validar con el generador `C:\Users\juanp\AppData\Local\Temp\opencode\gen_maze.py`.

## Pautas para no romper

- `index.html` carga los scripts en **este orden**: `maze.js`, `ghost.js`, `player.js`, `game.js`, `sketch.js`. Los modulos se referencian por globales (no hay import/export).
- Si agregas un archivo JS nuevo, agregalo como `<script>` en `index.html`; no hay bundler.
- No renombrar metodos usados por otros modulos (`stepMover`, `decideDirection`, `tilePos`, `tick`) sin actualizar todos los llamadores.