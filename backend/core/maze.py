"""Utilidades de grilla sobre el laberinto cargado desde shared/maze.json.

El laberinto ya no se genera en código: vive como dato estático en
shared/maze.json (única fuente de verdad del proyecto). Este módulo solo
lo carga y ofrece funciones para consultarlo (vecinos válidos, celdas
transitables, puntos pendientes).
"""

import json
from pathlib import Path

_SHARED_DIR = Path(__file__).resolve().parents[2] / "shared"
_MAZE_PATH = _SHARED_DIR / "maze.json"

with open(_MAZE_PATH, encoding="utf-8") as f:
    _DATA = json.load(f)

ROWS = _DATA["rows"]
COLS = _DATA["cols"]
CELL_SIZE = _DATA["cellSize"]
GRID = _DATA["grid"]
PLAYER_SPAWN = _DATA["playerSpawn"]
GHOST_SPAWNS = _DATA["ghostSpawns"]

WALL = 0
PATH = 1

_SPAWN_CELLS = {(PLAYER_SPAWN["row"], PLAYER_SPAWN["col"])} | {
    (g["row"], g["col"]) for g in GHOST_SPAWNS
}

DIRECTIONS = {
    "up": (-1, 0),
    "down": (1, 0),
    "left": (0, -1),
    "right": (0, 1),
}


def in_bounds(row, col):
    return 0 <= row < ROWS and 0 <= col < COLS


def is_wall(row, col):
    if not in_bounds(row, col):
        return True
    return GRID[row][col] == WALL


def is_walkable(row, col):
    return not is_wall(row, col)


def get_neighbors(row, col):
    """Vecinos transitables en las 4 direcciones, como (fila, col, dirección)."""
    neighbors = []
    for direction, (dr, dc) in DIRECTIONS.items():
        nr, nc = row + dr, col + dc
        if is_walkable(nr, nc):
            neighbors.append((nr, nc, direction))
    return neighbors


def pellet_cells():
    """Todas las celdas de camino con punto (todas menos las 5 de spawn)."""
    cells = []
    for r in range(ROWS):
        for c in range(COLS):
            if GRID[r][c] == PATH and (r, c) not in _SPAWN_CELLS:
                cells.append({"row": r, "col": c})
    return cells


def to_json():
    return {
        "rows": ROWS,
        "cols": COLS,
        "cellSize": CELL_SIZE,
        "grid": GRID,
        "pellets": pellet_cells(),
        "playerSpawn": PLAYER_SPAWN,
        "ghostSpawns": GHOST_SPAWNS,
    }
