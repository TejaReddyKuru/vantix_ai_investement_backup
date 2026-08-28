from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        # Maps community_id (str) to list of active WebSockets
        self.active_connections: dict[str, list[WebSocket]] = {}

    async def connect(self, community_id: str, websocket: WebSocket):
        await websocket.accept()
        if community_id not in self.active_connections:
            self.active_connections[community_id] = []
        self.active_connections[community_id].append(websocket)

    def disconnect(self, community_id: str, websocket: WebSocket):
        if community_id in self.active_connections:
            if websocket in self.active_connections[community_id]:
                self.active_connections[community_id].remove(websocket)
            if not self.active_connections[community_id]:
                del self.active_connections[community_id]

    async def broadcast(self, community_id: str, message: dict):
        if community_id in self.active_connections:
            # Create a copy of the list to prevent modification during iteration
            for connection in list(self.active_connections[community_id]):
                try:
                    await connection.send_json(message)
                except Exception:
                    self.disconnect(community_id, connection)

manager = ConnectionManager()
