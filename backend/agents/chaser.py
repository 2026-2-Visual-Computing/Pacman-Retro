"""Fantasma perseguidor: va directo hacia el jugador usando BFS."""

from .base_agent import GhostAgent
from ..core.pathfinding import bfs, first_step_direction


class ChaserGhost(GhostAgent):
    def decide(self, perception):
        path = bfs(perception["self_pos"], perception["player_pos"])
        return first_step_direction(perception["self_pos"], path)
