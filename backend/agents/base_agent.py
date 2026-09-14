"""Clase base GhostAgent: ciclo percepción -> decisión -> acción.

Cualquier fantasma, sin importar su personalidad, sigue el mismo ciclo:

1. perceive(): extrae del estado global del juego lo que le interesa y lo
   guarda en el propio agente (posición del jugador, vecinos válidos, etc.).
2. decide(): con lo percibido, elige una dirección. Las subclases de
   comportamiento de la Fase 6 (en chaser.py, interceptor.py, strategic.py,
   random_agent.py) sobrescriben SOLO este método.
3. act(): valida que la dirección decidida sea legal (no choque contra una
   pared) y actualiza la posición/dirección del propio agente.

En esta fase todavía no existen las subclases de comportamiento (llegan en
la Fase 6): la propia clase base actúa como fantasma de prueba que se
mueve al azar, para validar el ciclo completo end-to-end primero.
"""

import random

from ..core.maze import get_neighbors, DIRECTIONS


class GhostAgent:
    def __init__(self, ghost_id, row, col):
        self.id = ghost_id
        self.row = row
        self.col = col
        self.direction = "none"

    def perceive(self, player, ghosts):
        """Guarda en el propio agente lo que necesita para decidir.

        player: EntityState del jugador.
        ghosts: lista de EntityState de TODOS los fantasmas (incluido este).
        """
        self.player = player
        self.ghosts_by_id = {g.id: g for g in ghosts}
        self.valid_neighbors = get_neighbors(self.row, self.col)
        return {
            "self_pos": (self.row, self.col),
            "player_pos": (player.row, player.col),
            "valid_neighbors": self.valid_neighbors,
        }

    def decide(self, perception):
        """Comportamiento por defecto: elegir un vecino válido al azar.

        Las subclases de comportamiento (Fase 6) sobrescriben este método.
        """
        if not perception["valid_neighbors"]:
            return "none"
        _r, _c, direction = random.choice(perception["valid_neighbors"])
        return direction

    def act(self, direction):
        """Valida la dirección decidida y actualiza la posición del agente."""
        if direction == "none" or direction not in DIRECTIONS:
            self.direction = "none"
            return "none"

        dr, dc = DIRECTIONS[direction]
        new_row, new_col = self.row + dr, self.col + dc

        is_legal = any(
            (nr, nc) == (new_row, new_col) for nr, nc, _d in self.valid_neighbors
        )
        if not is_legal:
            self.direction = "none"
            return "none"

        self.row, self.col = new_row, new_col
        self.direction = direction
        return direction

    def step(self, player, ghosts):
        """El ciclo completo: percepción -> decisión -> acción."""
        perception = self.perceive(player, ghosts)
        direction = self.decide(perception)
        return self.act(direction)
