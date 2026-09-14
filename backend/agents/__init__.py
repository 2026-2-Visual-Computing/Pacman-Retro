"""Registro de los 4 comportamientos de fantasma disponibles."""

from .base_agent import GhostAgent
from .chaser import ChaserGhost
from .interceptor import InterceptorGhost
from .strategic import StrategicGhost
from .random_agent import RandomGhost

GHOST_CLASSES = {
    "chaser": ChaserGhost,
    "interceptor": InterceptorGhost,
    "strategic": StrategicGhost,
    "random": RandomGhost,
}
