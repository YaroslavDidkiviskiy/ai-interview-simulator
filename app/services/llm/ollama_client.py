import httpx

from app.config import get_settings


class OllamaClient:
    def __init__(self) -> None:
        settings = get_settings()
        self.base_url = str(settings.ollama_base_url).rstrip("/")
        self.model = settings.ollama_model

    def generate(self, prompt: str) -> str:
        response = httpx.post(
            f"{self.base_url}/api/chat",
            json={
                "model": self.model,
                "messages": [{"role": "user", "content": prompt}],
                "stream": False,
                "format": "json",
            },
            timeout=120,
        )
        response.raise_for_status()

        data = response.json()
        msg = data.get("message") or {}
        content = msg.get("content")
        if not content:
            raise ValueError(f"Unexpected Ollama response: {data!r}")
        return content
