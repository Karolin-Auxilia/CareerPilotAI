"""Common behavior for specialized pipeline agents."""

import json
from typing import Any

from backend.services.gemini_service import generate_json


class AgentOutputError(ValueError):
    """Raised when an agent response does not satisfy its contract."""


class BaseAgent:
    name = "Base Agent"
    role = ""
    instructions = ""
    required_fields: tuple[str, ...] = ()

    def __init__(self) -> None:
        self.memory: dict[str, Any] = {}

    def build_prompt(self, state: dict[str, Any]) -> str:
        return (
            f"You are the {self.name}.\nRole: {self.role}\n"
            f"Instructions:\n{self.instructions}\n\n"
            "Use only evidence in the input. Never invent candidate facts. "
            "Return one JSON object matching the requested output contract.\n"
            f"Input state:\n{json.dumps(state, ensure_ascii=True, default=str)}"
        )

    def validate_output(self, output: dict[str, Any]) -> dict[str, Any]:
        if not isinstance(output, dict):
            raise AgentOutputError(f"{self.name} returned a non-object")
        missing = [field for field in self.required_fields if field not in output]
        if missing:
            raise AgentOutputError(f"{self.name} omitted required fields: {', '.join(missing)}")
        return output

    def run(self, state: dict[str, Any]) -> dict[str, Any]:
        output = self.validate_output(generate_json(self.build_prompt(state)))
        self.memory = output
        return output