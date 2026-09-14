// TODO (Fase 2 / Fase 7): toda la comunicación HTTP con el backend (GET /maze, POST /ghosts/move).
async function fetchMaze() {
  const response = await fetch("http://localhost:5000/maze");
  if (!response.ok) throw new Error("No se pudo cargar el maze");
  return response.json();
}
async function requestGhostMoves(player, ghosts) {
    const response = await fetch("http://localhost:5000/ghosts/move", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ player, ghosts })
    });

    if (!response.ok) throw new Error("No se pudieron actualizar los ghosts");
    return response.json();
  }
