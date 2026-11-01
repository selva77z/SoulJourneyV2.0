"""
ai_agent.py
===========
Natural-language search for KP charts.

Strategy (why not raw text-to-SQL?)
-----------------------------------
Letting an LLM emit raw SQL against a user database is powerful but risky: it can
hallucinate columns, leak the whole table, or be steered into destructive
statements. For a focused domain like KP astrology we get better safety *and*
accuracy by constraining the model to emit a small, typed JSON "search spec"
whose vocabulary is fixed (planets, houses, lord fields). ``database.Database.search``
then turns that spec into a parameterised, read-only query. The LLM never sees or
writes SQL, so SQL injection is structurally impossible.

The spec shape
--------------
    {
      "match": "all" | "any",
      "conditions": [
        {"kind": "planet", "entity": "Jupiter", "field": "sub_lord", "value": "Saturn"},
        {"kind": "cusp",   "house": 11,         "field": "sub_lord", "value": "Jupiter"}
      ]
    }

Backends
--------
* ``AnthropicParser`` — uses Claude with tool/structured output (recommended).
* ``RuleBasedParser`` — a dependency-free fallback that handles the common
  phrasings, so the app still works offline or without an API key.

Both return the same dataclass, so ``app.py`` does not care which is active.
"""

from __future__ import annotations

import json
import logging
import os
import re
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from database import (
    Database, PLANET_NAMES, LORD_FIELDS, HOUSE_NUMBERS,
)

logger = logging.getLogger(__name__)

# Human synonyms -> canonical field names, shared by both parsers and the prompt.
FIELD_SYNONYMS = {
    "sign lord": "sign_lord", "rasi lord": "sign_lord", "sign-lord": "sign_lord",
    "star lord": "star_lord", "nakshatra lord": "star_lord", "star-lord": "star_lord",
    "sub lord": "sub_lord", "sub-lord": "sub_lord", "sublord": "sub_lord",
    "sub sub lord": "sub_sub_lord", "sub-sub lord": "sub_sub_lord",
    "sub-sub-lord": "sub_sub_lord",
}
PLANET_SYNONYMS = {
    "sun": "Sun", "moon": "Moon", "mars": "Mars", "mercury": "Mercury",
    "jupiter": "Jupiter", "guru": "Jupiter", "venus": "Venus", "sukra": "Venus",
    "saturn": "Saturn", "sani": "Saturn", "rahu": "Rahu", "ketu": "Ketu",
}
ORDINALS = {
    "first": 1, "second": 2, "third": 3, "fourth": 4, "fifth": 5, "sixth": 6,
    "seventh": 7, "eighth": 8, "ninth": 9, "tenth": 10, "eleventh": 11,
    "twelfth": 12,
}


@dataclass
class SearchSpec:
    match: str = "all"
    conditions: List[Dict[str, Any]] = field(default_factory=list)

    def is_empty(self) -> bool:
        return not self.conditions


# --------------------------------------------------------------------------- #
# Validation shared by every backend
# --------------------------------------------------------------------------- #

def validate_spec(raw: Dict[str, Any]) -> SearchSpec:
    """Coerce and validate an arbitrary dict into a safe SearchSpec."""
    match = raw.get("match", "all")
    if match not in ("all", "any"):
        match = "all"
    out: List[Dict[str, Any]] = []
    for cond in raw.get("conditions", []):
        field_name = cond.get("field")
        value = cond.get("value")
        if field_name not in LORD_FIELDS or value not in PLANET_NAMES:
            logger.warning("Dropping invalid condition: %s", cond)
            continue
        kind = cond.get("kind")
        if kind == "planet" and cond.get("entity") in PLANET_NAMES:
            out.append({"kind": "planet", "entity": cond["entity"],
                        "field": field_name, "value": value})
        elif kind == "cusp" and cond.get("house") in HOUSE_NUMBERS:
            out.append({"kind": "cusp", "house": int(cond["house"]),
                        "field": field_name, "value": value})
        else:
            logger.warning("Dropping invalid condition: %s", cond)
    return SearchSpec(match=match, conditions=out)


# --------------------------------------------------------------------------- #
# Backend 1: Anthropic structured output
# --------------------------------------------------------------------------- #

SYSTEM_PROMPT = """You convert a KP (Krishnamurti Paddhati) astrology search \
request into a strict JSON search specification. Output ONLY JSON.

Vocabulary:
- planets: Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu, Ketu
- lord fields: sign_lord, star_lord, sub_lord, sub_sub_lord
- houses: integers 1-12

Each condition is either:
  {"kind":"planet","entity":<planet>,"field":<lord field>,"value":<planet>}
    meaning: that planet's <field> equals <value>
  {"kind":"cusp","house":<1-12>,"field":<lord field>,"value":<planet>}
    meaning: that house cusp's <field> equals <value>

"match" is "all" when every condition must hold, "any" when at least one.
Map natural phrases: "X is the sub-lord of the Nth house" ->
  {"kind":"cusp","house":N,"field":"sub_lord","value":X}.
"Planet P connected to the Nth house" is ambiguous; interpret the most common
KP reading as P's star-lord or sub-lord signifying that house only if the user
is explicit; otherwise omit it and rely on what is stated.

Return: {"match": "...", "conditions": [...]}."""


class AnthropicParser:
    """Uses Claude to produce the search spec. Requires ANTHROPIC_API_KEY."""

    def __init__(self, model: str = "claude-opus-4-8") -> None:
        try:
            import anthropic  # noqa: F401
        except ImportError as exc:
            raise ImportError(
                "The 'anthropic' package is required for AI search. "
                "Install it with: pip install anthropic"
            ) from exc
        import anthropic
        self._client = anthropic.Anthropic()  # reads ANTHROPIC_API_KEY
        self._model = model

    def parse(self, query: str) -> SearchSpec:
        import anthropic
        try:
            msg = self._client.messages.create(
                model=self._model,
                max_tokens=1024,
                system=SYSTEM_PROMPT,
                messages=[{"role": "user", "content": query}],
            )
            text = "".join(
                block.text for block in msg.content if block.type == "text"
            )
            data = _extract_json(text)
            return validate_spec(data)
        except anthropic.APIError as exc:
            logger.error("Anthropic API error: %s", exc)
            raise RuntimeError(f"AI service error: {exc}") from exc


def _extract_json(text: str) -> Dict[str, Any]:
    """Pull the first JSON object out of a model response."""
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if not match:
        raise ValueError("No JSON found in model output.")
    return json.loads(match.group(0))


# --------------------------------------------------------------------------- #
# Backend 2: offline rule-based parser
# --------------------------------------------------------------------------- #

class RuleBasedParser:
    """
    Dependency-free fallback. Recognises patterns such as:
      "Jupiter as the 11th house sub lord"
      "Mars is the star lord of the 6th cusp"
      "Saturn is the sub-lord of Jupiter"
    Good enough to keep the app useful with no API key; the LLM backend handles
    the long tail of free-form phrasing.
    """

    _HOUSE_RE = re.compile(r"(\d{1,2})(?:st|nd|rd|th)?\s*(?:house|cusp|bhava)", re.I)

    def parse(self, query: str) -> SearchSpec:
        q = query.lower()
        match = "any" if (" or " in q and " and " not in q) else "all"
        conditions: List[Dict[str, Any]] = []

        # Split on "and"/"or"/comma into clauses and parse each independently.
        for clause in re.split(r"\band\b|\bor\b|,", q):
            cond = self._parse_clause(clause)
            if cond:
                conditions.append(cond)
        return SearchSpec(match=match, conditions=conditions)

    def _parse_clause(self, clause: str) -> Optional[Dict[str, Any]]:
        field_name = self._find_field(clause)
        if not field_name:
            return None
        planets = self._find_planets(clause)
        if not planets:
            return None
        value = planets[0]  # the planet that *is* the lord

        house = self._find_house(clause)
        if house is not None:
            return {"kind": "cusp", "house": house, "field": field_name, "value": value}
        if len(planets) >= 2:
            # "<value> is the <field> of <entity>"
            return {"kind": "planet", "entity": planets[1],
                    "field": field_name, "value": value}
        return None

    @staticmethod
    def _find_field(text: str) -> Optional[str]:
        for phrase, canonical in FIELD_SYNONYMS.items():
            if phrase in text:
                return canonical
        return None

    @staticmethod
    def _find_planets(text: str) -> List[str]:
        found = []
        for word, canonical in PLANET_SYNONYMS.items():
            if re.search(rf"\b{word}\b", text):
                found.append((text.index(word), canonical))
        return [p for _, p in sorted(found)]

    def _find_house(self, text: str) -> Optional[int]:
        m = self._HOUSE_RE.search(text)
        if m:
            n = int(m.group(1))
            return n if n in HOUSE_NUMBERS else None
        for word, n in ORDINALS.items():
            if re.search(rf"\b{word}\b\s*(?:house|cusp|bhava)", text):
                return n
        return None


# --------------------------------------------------------------------------- #
# Facade used by the GUI
# --------------------------------------------------------------------------- #

class AIChartSearch:
    """Chooses the best available backend and runs the end-to-end search."""

    def __init__(self, db: Database, prefer_llm: bool = True) -> None:
        self.db = db
        self.backend_name = "rule-based"
        self._parser: Any = RuleBasedParser()
        if prefer_llm and os.getenv("ANTHROPIC_API_KEY"):
            try:
                self._parser = AnthropicParser()
                self.backend_name = "anthropic"
            except ImportError as exc:
                logger.warning("Falling back to rule-based search: %s", exc)

    def run(self, query: str) -> Dict[str, Any]:
        """
        Returns a dict with the parsed spec and matching profile rows:
            {"spec": SearchSpec, "results": [sqlite3.Row, ...], "backend": str}
        """
        if not query or not query.strip():
            raise ValueError("Enter a search query.")
        spec = self._parser.parse(query)
        if spec.is_empty():
            return {"spec": spec, "results": [], "backend": self.backend_name,
                    "message": "Could not identify any KP conditions in the query."}
        results = self.db.search(spec.conditions, match=spec.match)
        return {"spec": spec, "results": results, "backend": self.backend_name}


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    parser = RuleBasedParser()
    for q in [
        "Find clients who have Jupiter as the 11th house sub lord",
        "Saturn is the star lord of the 6th cusp and Mars is the sub lord of Jupiter",
    ]:
        print(q, "->", parser.parse(q))
