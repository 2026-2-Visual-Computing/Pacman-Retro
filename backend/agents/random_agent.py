"""Fantasma aleatorio: elige una dirección válida al azar, evitando
revertirse sobre sus pasos si tiene otra opción disponible."""

import random

from .base_agent import GhostAgent


class RandomGhost(GhostAgent):
    def decide(self, perception):
        options = perception["valid_neighbors"]
        if not options:
            return "none"
        forward = [
            (r, c, d) for r, c, d in options if d != self._OPPOSITE.get(self.direction)
        ]
        pool = forward if forward else options
        _r, _c, direction = random.choice(pool)
        return direction
