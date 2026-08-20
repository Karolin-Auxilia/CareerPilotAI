"""Shared Gemini client and structured response handling."""

import json
import os
import re
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from google import genai
from google.genai import types

PROJECT_ROOT = Path(__file__).resolve().parents[2]
load_dotenv(PROJECT_ROOT.parent / ".env")
load_dotenv(PROJECT_ROOT / ".env")
load_dotenv(PROJECT_ROOT / "backend" / ".env")

_client: genai.Client | None = None
MODEL_FALLBACKS = ["gemini-3.7-flash", "gemini-3.1-pro-preview", "gemini-3.1-flash-lite"]


class GeminiServiceError(RuntimeError):
    """Raised when Gemini cannot produce a valid structured response."""


def get_ai_client() -> genai.Client:
    """Return the one lazily-created Gemini client shared by every agent."""
    global _client
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("AI_API_KEY")
    if not api_key:
        raise GeminiServiceError("GEMINI_API_KEY is not configured")
    if _client is None:
        _client = genai.Client(api_key=api_key)
    return _client


def parse_json_response(text: str) -> dict[str, Any]:
    if not text or not text.strip():
        raise GeminiServiceError("Gemini returned an empty response")
    cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", text.strip(), flags=re.IGNORECASE)
    try:
        parsed = json.loads(cleaned)
    except json.JSONDecodeError as error:
        raise GeminiServiceError(f"Gemini returned invalid JSON: {error.msg}") from error
    if not isinstance(parsed, dict):
        raise GeminiServiceError("Gemini response must be a JSON object")
    return parsed


def generate_json(prompt: str, temperature: float = 0.3) -> dict[str, Any]:
    """Generate JSON, trying the configured model fallbacks without fake output."""
    client = get_ai_client()
    errors: list[str] = []
    for model in MODEL_FALLBACKS:
        try:
            response = client.models.generate_content(
                model=model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=temperature,
                ),
            )
            return parse_json_response(response.text or "")
        except Exception as error:
            errors.append(f"{model}: {error}")
    raise GeminiServiceError("All Gemini models failed: " + " | ".join(errors))


def generate_text(
    system_prompt: str,
    messages: list[dict[str, str]],
    temperature: float = 0.7,
) -> str:
    """Generate a conversational response with a separate system instruction."""
    client = get_ai_client()
    contents = [
        types.Content(
            role="model" if message.get("role") == "assistant" else "user",
            parts=[types.Part.from_text(text=message.get("content", ""))],
        )
        for message in messages
        if message.get("content", "").strip()
    ]
    if not contents:
        raise GeminiServiceError("At least one user message is required")

    errors: list[str] = []
    for model in MODEL_FALLBACKS:
        try:
            response = client.models.generate_content(
                model=model,
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    temperature=temperature,
                ),
            )
            text = response.text or ""
            if not text.strip():
                raise GeminiServiceError("Gemini returned an empty response")
            return text.strip()
        except Exception as error:
            errors.append(f"{model}: {error}")
    raise GeminiServiceError("All Gemini models failed: " + " | ".join(errors))