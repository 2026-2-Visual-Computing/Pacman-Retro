"""Fantasma estratégico: flanquea usando al perseguidor como referencia;
ataca directo si el jugador está cerca."""

from .base_agent import GhostAgent
from ..core.maze import is_walkable
from ..core.pathfinding import astar, bfs, first_step_direction, manhattan

DISTANCE_THRESHOLD = 6  # a esta distancia (Manhattan) deja de flanquear y ataca


class StrategicGhost(GhostAgent):
    def decide(self, perception):
        self_pos = perception["self_pos"]
        player_pos = perception["player_pos"]

        if manhattan(self_pos, player_pos) <= DISTANCE_THRESHOLD:
            target = player_pos
        else:
            target = self._flank_point(player_pos)

        path = astar(self_pos, target) or bfs(self_pos, player_pos)
        return first_step_direction(self_pos, path)

    def _flank_point(self, player_pos):
        chaser = self.ghosts_by_id.get("chaser")
        if chaser is None:
            return player_pos
        pr, pc = player_pos
        # Refleja la posición del perseguidor a través del jugador: el
        # punto queda "del otro lado" del jugador respecto al perseguidor.
        candidate = (pr + (pr - chaser.row), pc + (pc - chaser.col))
        return candidate if is_walkable(*candidate) else player_pos
