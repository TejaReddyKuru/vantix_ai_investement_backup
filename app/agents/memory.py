import time
from dataclasses import dataclass
from typing import Any, Dict, Optional


@dataclass
class MemoryEntry:
    value: Any
    expires_at: Optional[float] = None


class AgentMemory:
    """
    Lightweight, pure-Python, in-memory key-value cache for agents with TTL expiration support.
    No Redis or external database required.
    """

    def __init__(self) -> None:
        self._store: Dict[str, MemoryEntry] = {}

    def write(self, key: str, value: Any, ttl: Optional[float] = None) -> None:
        """Write key-value pair to memory with optional TTL in seconds."""
        expires_at = time.time() + ttl if ttl is not None else None
        self._store[key] = MemoryEntry(value=value, expires_at=expires_at)

    def read(self, key: str, default: Any = None) -> Any:
        """Read value for key. Automatically purges expired entries."""
        entry = self._store.get(key)
        if entry is None:
            return default

        if entry.expires_at is not None and time.time() >= entry.expires_at:
            del self._store[key]
            return default

        return entry.value

    def exists(self, key: str) -> bool:
        """Check if non-expired key exists in memory."""
        entry = self._store.get(key)
        if entry is None:
            return False

        if entry.expires_at is not None and time.time() >= entry.expires_at:
            del self._store[key]
            return False

        return True

    def delete(self, key: str) -> bool:
        """Delete key from memory. Returns True if key existed."""
        if key in self._store:
            del self._store[key]
            return True
        return False

    def clear(self) -> None:
        """Clear all entries from memory."""
        self._store.clear()
