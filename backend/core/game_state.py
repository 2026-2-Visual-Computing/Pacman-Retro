"""Parseo y validación del estado del juego recibido desde el frontend."""

from dataclasses import dataclass

from .maze import in_bounds


@dataclass
class EntityState:
    id: str
    row: int
    col: int
    direction: str


class InvalidGameState(Exception):
    pass


def _parse_entity(data, required_id=None):
    try:
        row = int(data["row"])
        col = int(data["col"])
        direction = str(data.get("direction", "none"))
    except (KeyError, TypeError, ValueError) as exc:
        raise InvalidGameState(f"Entidad mal formada: {data}") from exc

    if not in_bounds(row, col):
        raise InvalidGameState(f"Posición fuera del laberinto: ({row}, {col})")

    entity_id = data.get("id", required_id)
    return EntityState(id=entity_id, row=row, col=col, direction=direction)


def parse_move_request(body):
    """body: dict recibido como JSON en POST /ghosts/move.

    Devuelve (player: EntityState, ghosts: list[EntityState]).
    Lanza InvalidGameState si el cuerpo no tiene la forma esperada.
    """
    if not isinstance(body, dict):
        raise InvalidGameState("El cuerpo de la petición debe ser un objeto JSON")

    if "player" not in body or "ghosts" not in body:
        raise InvalidGameState("Faltan las claves 'player' y/o 'ghosts'")

    player = _parse_entity(body["player"], required_id="player")

    ghosts_data = body["ghosts"]
    if not isinstance(ghosts_data, list) or not ghosts_data:
        raise InvalidGameState("'ghosts' debe ser una lista no vacía")

    ghosts = [_parse_entity(g) for g in ghosts_data]
    for g in ghosts:
        if not g.id:
            raise InvalidGameState("Cada fantasma debe traer su 'id'")

    return player, ghosts
