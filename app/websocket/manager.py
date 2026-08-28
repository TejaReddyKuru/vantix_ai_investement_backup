from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        # Maps community_id (str) to dict[user_id (str), set[WebSocket]]
        self.active_connections: dict[str, dict[str, set[WebSocket]]] = {}

    async def connect(self, community_id: str, user_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.setdefault(community_id, {})
        self.active_connections[community_id].setdefault(user_id, set())
        self.active_connections[community_id][user_id].add(websocket)

    def disconnect(self, community_id: str, user_id: str, websocket: WebSocket):
        connections = self.active_connections.get(community_id, {})
        user_sockets = connections.get(user_id, set())
        
        if websocket in user_sockets:
            user_sockets.remove(websocket)
            
        if not user_sockets and user_id in connections:
            del connections[user_id]
            
        if not connections and community_id in self.active_connections:
            del self.active_connections[community_id]

    async def broadcast(self, community_id: str, message: dict):
        connections = self.active_connections.get(community_id, {})
        
        dead_sockets = []
        
        for user_id, user_sockets in list(connections.items()):
            for websocket in list(user_sockets):
                try:
                    await websocket.send_json(message)
                except Exception:
                    dead_sockets.append((user_id, websocket))
                    
        for uid, ws in dead_sockets:
            self.disconnect(community_id, uid, ws)

manager = ConnectionManager()
