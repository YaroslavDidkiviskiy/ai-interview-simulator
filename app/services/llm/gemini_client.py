import asyncio
import json

from google import genai
from google.genai import types
from google.genai.errors import APIError

from app.config import get_settings

EVALUATION_SCHEMA = types.Schema(
    type=types.Type.OBJECT,
    required=[
        "score", "clarity_score", "correctness_score",
        "confidence_score", "feedback_text", "missing_points", "better_answer"
    ],
    properties={
        "score":             types.Schema(type=types.Type.INTEGER),
        "clarity_score":     types.Schema(type=types.Type.INTEGER),
        "correctness_score": types.Schema(type=types.Type.INTEGER),
        "confidence_score":  types.Schema(type=types.Type.INTEGER),
        "feedback_text":     types.Schema(type=types.Type.STRING),
        "missing_points":    types.Schema(type=types.Type.ARRAY, items=types.Schema(type=types.Type.STRING)),
        "better_answer":     types.Schema(type=types.Type.ARRAY, items=types.Schema(type=types.Type.STRING)),
    },
)


class GeminiClient:
    def __init__(self) -> None:
        settings = get_settings()
        self._client = genai.Client(api_key=settings.gemini_api_key)
        self.model = "gemini-2.5-flash"

    async def generate(self, prompt: str, retries: int = 3) -> str:
        for attempt in range(retries):
            try:
                response = await self._client.aio.models.generate_content(
                    model=self.model,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        response_schema=EVALUATION_SCHEMA,
                        temperature=0.2,
                        max_output_tokens=8192,
                    ),
                )
                return response.text or "{}"

            except APIError as e:
                if e.code == 429 and attempt < retries - 1:
                    await asyncio.sleep(10 * (attempt + 1))
                else:
                    raise

        raise RuntimeError("Gemini rate limit exceeded after retries")