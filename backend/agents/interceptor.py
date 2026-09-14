"""Fantasma interceptor: apunta unas celdas por delante del jugador (A*),
para cortarle el paso en vez de perseguirlo por detrás."""

from .base_agent import GhostAgent
from ..core.maze import DIRECTIONS, is_walkable
from ..core.pathfinding import astar, bfs, first_step_direction

LOOKAHEAD_CELLS = 4  # a cuántas celdas por delante del jugador apunta


class InterceptorGhost(GhostAgent):
    def decide(self, perception):
        target = self._project_target(perception)
        path = astar(perception["self_pos"], target) or bfs(
            perception["self_pos"], perception["player_pos"]
        )
        return first_step_direction(perception["self_pos"], path)

    def _project_target(self, perception):
        dr, dc = DIRECTIONS.get(self.player.direction, (0, 0))
        pr, pc = perception["player_pos"]
        candidate = (pr + dr * LOOKAHEAD_CELLS, pc + dc * LOOKAHEAD_CELLS)
        if is_walkable(*candidate):
            return candidate

        # El punto proyectado cayó en una pared o fuera del laberinto:
        # se retrocede por la ruta hacia él hasta la última celda transitable.
        path = bfs(perception["player_pos"], candidate)
        if path:
            for cell in reversed(path):
                if is_walkable(*cell):
                    return cell
        return perception["player_pos"]
