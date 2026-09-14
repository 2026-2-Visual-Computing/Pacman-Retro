"""BFS y A* para calcular rutas sobre la grilla del laberinto.

BFS encuentra el camino más corto en número de pasos y es la opción más
simple de explicar: la usa el fantasma "perseguidor" para ir directo al
jugador. A* añade la distancia Manhattan como heurística (válida en una
grilla donde solo se puede mover en 4 direcciones) para guiar la búsqueda
hacia un objetivo de forma más dirigida; la usan el fantasma "interceptor"
y el "estratégico" para llegar a puntos calculados (no siempre la posición
exacta del jugador).
"""

from collections import deque
import heapq

from .maze import get_neighbors


def manhattan(a, b):
    return abs(a[0] - b[0]) + abs(a[1] - b[1])


def bfs(start, goal):
    """Ruta más corta en número de pasos. Devuelve lista de celdas o None."""
    if start == goal:
        return [start]

    visited = {start}
    queue = deque([[start]])

    while queue:
        path = queue.popleft()
        row, col = path[-1]
        for nr, nc, _direction in get_neighbors(row, col):
            if (nr, nc) in visited:
                continue
            new_path = path + [(nr, nc)]
            if (nr, nc) == goal:
                return new_path
            visited.add((nr, nc))
            queue.append(new_path)

    return None


def astar(start, goal):
    """Ruta más corta usando distancia Manhattan como heurística."""
    if start == goal:
        return [start]

    open_heap = [(manhattan(start, goal), 0, start, [start])]
    best_cost = {start: 0}

    while open_heap:
        _priority, cost, current, path = heapq.heappop(open_heap)
        if current == goal:
            return path

        row, col = current
        for nr, nc, _direction in get_neighbors(row, col):
            new_cost = cost + 1
            neighbor = (nr, nc)
            if neighbor in best_cost and best_cost[neighbor] <= new_cost:
                continue
            best_cost[neighbor] = new_cost
            priority = new_cost + manhattan(neighbor, goal)
            heapq.heappush(open_heap, (priority, new_cost, neighbor, path + [neighbor]))

    return None


def first_step_direction(start, path):
    """Convierte el primer paso de una ruta en una dirección ('up'/'down'/...)."""
    if not path or len(path) < 2:
        return "none"
    (r0, c0), (r1, c1) = path[0], path[1]
    dr, dc = r1 - r0, c1 - c0
    if dr == -1:
        return "up"
    if dr == 1:
        return "down"
    if dc == -1:
        return "left"
    if dc == 1:
        return "right"
    return "none"
