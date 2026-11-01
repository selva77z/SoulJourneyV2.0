"""
database.py
===========
SQLite persistence layer for the KP desktop app.

Design goals
------------
* One self-contained local file (``kp_charts.db``) — no server, portable.
* A normalised but query-friendly schema: one row per profile, one row per
  (profile, planet) and one row per (profile, house). This lets the AI search
  layer express questions like "Jupiter is the sub-lord of the 11th cusp" as
  simple, indexed WHERE clauses.
* A strict **read-only** execution path for AI-generated queries, with a
  parameterised builder so natural-language search never concatenates user
  text into SQL (no injection surface).

All lord fields are stored as full planet names ("Jupiter", "Mars", ...) so the
AI layer and the UI share one vocabulary.
"""

from __future__ import annotations

import logging
import re
import sqlite3
from contextlib import contextmanager
from typing import Any, Dict, Iterable, List, Optional, Tuple

from engine import KPChart

logger = logging.getLogger(__name__)

DEFAULT_DB_PATH = "kp_charts.db"

# Columns the AI layer is allowed to filter on, mapped to real table columns.
# Anything not in these allow-lists is rejected before a query is ever built.
PLANET_NAMES = {
    "Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn",
    "Rahu", "Ketu",
}
LORD_FIELDS = {
    "sign_lord", "star_lord", "sub_lord", "sub_sub_lord",
}
HOUSE_NUMBERS = set(range(1, 13))


class Database:
    """Thin, well-guarded wrapper around a local SQLite database."""

    def __init__(self, path: str = DEFAULT_DB_PATH) -> None:
        self.path = path
        self._init_schema()

    # ---- connection management ------------------------------------------- #

    @contextmanager
    def _connect(self, readonly: bool = False):
        """Yield a connection. Read-only mode opens the file via URI so even a
        malformed query physically cannot write."""
        if readonly:
            uri = f"file:{self.path}?mode=ro"
            conn = sqlite3.connect(uri, uri=True)
        else:
            conn = sqlite3.connect(self.path)
        conn.row_factory = sqlite3.Row
        try:
            conn.execute("PRAGMA foreign_keys = ON;")
            yield conn
            if not readonly:
                conn.commit()
        except Exception:
            if not readonly:
                conn.rollback()
            raise
        finally:
            conn.close()

    # ---- schema ----------------------------------------------------------- #

    def _init_schema(self) -> None:
        with self._connect() as conn:
            conn.executescript(
                """
                CREATE TABLE IF NOT EXISTS profiles (
                    id            INTEGER PRIMARY KEY AUTOINCREMENT,
                    name          TEXT    NOT NULL,
                    dob           TEXT    NOT NULL,   -- YYYY-MM-DD
                    tob           TEXT    NOT NULL,   -- HH:MM:SS (local)
                    place         TEXT,
                    latitude      REAL    NOT NULL,
                    longitude     REAL    NOT NULL,
                    timezone      REAL    NOT NULL,   -- hours east of UTC
                    ayanamsa_name TEXT,
                    created_at    TEXT    DEFAULT (datetime('now'))
                );

                CREATE TABLE IF NOT EXISTS planet_positions (
                    profile_id    INTEGER NOT NULL,
                    planet        TEXT    NOT NULL,   -- Sun..Ketu
                    longitude     REAL    NOT NULL,
                    dms           TEXT,
                    sign          TEXT    NOT NULL,
                    sign_lord     TEXT    NOT NULL,
                    nakshatra     TEXT    NOT NULL,
                    pada          INTEGER,
                    star_lord     TEXT    NOT NULL,
                    sub_lord      TEXT    NOT NULL,
                    sub_sub_lord  TEXT    NOT NULL,
                    PRIMARY KEY (profile_id, planet),
                    FOREIGN KEY (profile_id) REFERENCES profiles(id)
                        ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS cusp_positions (
                    profile_id    INTEGER NOT NULL,
                    house         INTEGER NOT NULL,   -- 1..12
                    longitude     REAL    NOT NULL,
                    dms           TEXT,
                    sign          TEXT    NOT NULL,
                    sign_lord     TEXT    NOT NULL,
                    nakshatra     TEXT    NOT NULL,
                    pada          INTEGER,
                    star_lord     TEXT    NOT NULL,
                    sub_lord      TEXT    NOT NULL,
                    sub_sub_lord  TEXT    NOT NULL,
                    PRIMARY KEY (profile_id, house),
                    FOREIGN KEY (profile_id) REFERENCES profiles(id)
                        ON DELETE CASCADE
                );

                -- Indexes that make the common KP searches fast.
                CREATE INDEX IF NOT EXISTS idx_planet_sub
                    ON planet_positions(planet, sub_lord);
                CREATE INDEX IF NOT EXISTS idx_planet_star
                    ON planet_positions(planet, star_lord);
                CREATE INDEX IF NOT EXISTS idx_cusp_sub
                    ON cusp_positions(house, sub_lord);
                CREATE INDEX IF NOT EXISTS idx_cusp_star
                    ON cusp_positions(house, star_lord);
                """
            )
        logger.debug("Schema ready at %s", self.path)

    # ---- writes ----------------------------------------------------------- #

    def save_chart(self, chart: KPChart) -> int:
        """Persist a computed chart and return the new profile id."""
        with self._connect() as conn:
            cur = conn.execute(
                """INSERT INTO profiles
                   (name, dob, tob, place, latitude, longitude, timezone, ayanamsa_name)
                   VALUES (?,?,?,?,?,?,?,?)""",
                (chart.name, chart.dob, chart.tob, chart.place, chart.latitude,
                 chart.longitude, chart.timezone, chart.ayanamsa_name),
            )
            pid = cur.lastrowid

            conn.executemany(
                """INSERT INTO planet_positions
                   (profile_id, planet, longitude, dms, sign, sign_lord,
                    nakshatra, pada, star_lord, sub_lord, sub_sub_lord)
                   VALUES (?,?,?,?,?,?,?,?,?,?,?)""",
                [
                    (pid, planet, lc.longitude, lc.dms, lc.sign, lc.sign_lord,
                     lc.nakshatra, lc.pada, lc.star_lord, lc.sub_lord,
                     lc.sub_sub_lord)
                    for planet, lc in chart.planets.items()
                ],
            )
            conn.executemany(
                """INSERT INTO cusp_positions
                   (profile_id, house, longitude, dms, sign, sign_lord,
                    nakshatra, pada, star_lord, sub_lord, sub_sub_lord)
                   VALUES (?,?,?,?,?,?,?,?,?,?,?)""",
                [
                    (pid, house, lc.longitude, lc.dms, lc.sign, lc.sign_lord,
                     lc.nakshatra, lc.pada, lc.star_lord, lc.sub_lord,
                     lc.sub_sub_lord)
                    for house, lc in chart.cusps.items()
                ],
            )
        logger.info("Saved profile %s (id=%d)", chart.name, pid)
        return pid

    def delete_profile(self, profile_id: int) -> None:
        with self._connect() as conn:
            conn.execute("DELETE FROM profiles WHERE id = ?", (profile_id,))

    # ---- reads ------------------------------------------------------------ #

    def list_profiles(self) -> List[sqlite3.Row]:
        with self._connect(readonly=True) as conn:
            return conn.execute(
                "SELECT * FROM profiles ORDER BY created_at DESC"
            ).fetchall()

    def get_chart_rows(self, profile_id: int) -> Dict[str, List[sqlite3.Row]]:
        with self._connect(readonly=True) as conn:
            prof = conn.execute(
                "SELECT * FROM profiles WHERE id = ?", (profile_id,)
            ).fetchone()
            planets = conn.execute(
                "SELECT * FROM planet_positions WHERE profile_id = ?", (profile_id,)
            ).fetchall()
            cusps = conn.execute(
                "SELECT * FROM cusp_positions WHERE profile_id = ? ORDER BY house",
                (profile_id,),
            ).fetchall()
        return {"profile": prof, "planets": planets, "cusps": cusps}

    # ---- structured, injection-proof search ------------------------------ #

    def search(self, conditions: List[Dict[str, Any]], match: str = "all"
               ) -> List[sqlite3.Row]:
        """
        Execute a structured search built from validated conditions.

        Each condition is a dict produced by the AI layer, e.g.::

            {"kind": "planet", "entity": "Jupiter", "field": "sub_lord",
             "value": "Saturn"}
            {"kind": "cusp", "house": 11, "field": "sub_lord",
             "value": "Jupiter"}

        ``match`` is "all" (AND / INTERSECT) or "any" (OR / UNION).

        No value supplied by the user is ever concatenated into SQL: entities
        and fields are checked against allow-lists and values are bound as
        parameters. This is the only path the AI agent uses.
        """
        if not conditions:
            return []
        if match not in ("all", "any"):
            raise ValueError("match must be 'all' or 'any'")

        subqueries: List[str] = []
        params: List[Any] = []

        for cond in conditions:
            field = cond.get("field")
            value = cond.get("value")
            if field not in LORD_FIELDS:
                raise ValueError(f"Illegal field: {field!r}")
            if not isinstance(value, str) or value not in PLANET_NAMES:
                raise ValueError(f"Illegal value: {value!r}")

            kind = cond.get("kind")
            if kind == "planet":
                entity = cond.get("entity")
                if entity not in PLANET_NAMES:
                    raise ValueError(f"Illegal planet: {entity!r}")
                # field is validated against LORD_FIELDS, so it is safe to inline.
                subqueries.append(
                    f"SELECT profile_id FROM planet_positions "
                    f"WHERE planet = ? AND {field} = ?"
                )
                params.extend([entity, value])
            elif kind == "cusp":
                house = cond.get("house")
                if house not in HOUSE_NUMBERS:
                    raise ValueError(f"Illegal house: {house!r}")
                subqueries.append(
                    f"SELECT profile_id FROM cusp_positions "
                    f"WHERE house = ? AND {field} = ?"
                )
                params.extend([house, value])
            else:
                raise ValueError(f"Illegal condition kind: {kind!r}")

        connector = " INTERSECT " if match == "all" else " UNION "
        inner = connector.join(subqueries)
        sql = (
            "SELECT * FROM profiles "
            f"WHERE id IN ({inner}) ORDER BY name"
        )
        logger.debug("search SQL: %s params=%s", sql, params)
        with self._connect(readonly=True) as conn:
            return conn.execute(sql, params).fetchall()

    # ---- last-resort raw read (guarded) ---------------------------------- #

    _FORBIDDEN = re.compile(
        r"\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|REPLACE|ATTACH|PRAGMA|VACUUM)\b",
        re.IGNORECASE,
    )

    def execute_select(self, sql: str, params: Iterable[Any] = ()) -> List[sqlite3.Row]:
        """Run a single read-only SELECT. Used only if you deliberately enable a
        text-to-SQL path; the structured ``search`` above is preferred."""
        stripped = sql.strip().rstrip(";")
        if ";" in stripped:
            raise ValueError("Only a single statement is allowed.")
        if not stripped.lower().startswith("select"):
            raise ValueError("Only SELECT statements are allowed.")
        if self._FORBIDDEN.search(stripped):
            raise ValueError("Query contains a forbidden keyword.")
        with self._connect(readonly=True) as conn:
            return conn.execute(stripped, tuple(params)).fetchall()
