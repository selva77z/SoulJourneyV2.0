"""
dasa.py
=======
Vimshottari Dasa calculator (KP / Parasara standard).

Given the Moon's sidereal longitude at birth, this produces the full
Dasa -> Bukthi -> Antara timeline with calendar dates, matching the tables a
professional KP report prints (e.g. A. Devaraj ref 41291, pages 9-11).

Method (validated against that report)
--------------------------------------
* Year length = 365.25 days ("Dasa Days: 365.25" on the report).
* The running Mahadasha at birth is ruled by the lord of the Moon's nakshatra.
* Balance of that Dasa = (1 - fraction_of_nakshatra_elapsed) x lord_years.
  fraction = (Moon longitude within the nakshatra) / (13 deg 20').
* Every boundary is computed as birth + cumulative *fractional* days (not by
  stepping whole days), so rounding never accumulates.
* Each level subdivides its parent in Vimshottari proportions, in the standard
  sequence starting from the parent's own lord.

The engine (engine.py) computes the Moon longitude with Swiss Ephemeris; this
module is pure arithmetic so it can be unit-tested on its own.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, timedelta
from typing import List, Optional

YEAR_DAYS = 365.25
NAK_SPAN = 360.0 / 27.0  # 13 deg 20'

# Vimshottari order and the years each lord rules (total 120).
SEQUENCE: List[str] = [
    "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn",
    "Mercury",
]
YEARS = {
    "Ketu": 7, "Venus": 20, "Sun": 6, "Moon": 10, "Mars": 7, "Rahu": 18,
    "Jupiter": 16, "Saturn": 19, "Mercury": 17,
}
TOTAL_YEARS = 120


@dataclass
class DasaPeriod:
    lord: str
    start: date
    end: date
    level: int               # 1=Dasa, 2=Bukthi, 3=Antara
    children: List["DasaPeriod"]

    def label(self) -> str:
        return {1: "Dasa", 2: "Bukthi", 3: "Antara"}[self.level]


def _seq_from(lord: str) -> List[str]:
    """Vimshottari sequence rotated to start at ``lord``."""
    i = SEQUENCE.index(lord)
    return [SEQUENCE[(i + k) % 9] for k in range(9)]


def _subperiods(parent_lord: str, start: datetime, parent_days: float,
                level: int, max_level: int) -> List[DasaPeriod]:
    """Recursively build sub-periods that fill [start, start+parent_days]."""
    periods: List[DasaPeriod] = []
    cursor = start
    for lord in _seq_from(parent_lord):
        span = YEARS[lord] / TOTAL_YEARS * parent_days
        child_end = cursor + timedelta(days=span)
        children: List[DasaPeriod] = []
        if level < max_level:
            children = _subperiods(lord, cursor, span, level + 1, max_level)
        periods.append(DasaPeriod(
            lord=lord, start=cursor.date(), end=child_end.date(),
            level=level, children=children,
        ))
        cursor = child_end
    return periods


def compute_dasa(moon_longitude: float, birth: date,
                 levels: int = 3, span_years: float = 120.0
                 ) -> List[DasaPeriod]:
    """
    Build the Dasa timeline.

    Parameters
    ----------
    moon_longitude : sidereal Moon longitude at birth (0-360).
    birth          : birth date.
    levels         : 1=Dasa only, 2=+Bukthi, 3=+Antara (report shows 3).
    span_years     : how far forward to generate (one full cycle = 120y).
    """
    lon = moon_longitude % 360.0
    nak_index = int(lon // NAK_SPAN)
    moon_lord = SEQUENCE[nak_index % 9]
    fraction_elapsed = (lon - nak_index * NAK_SPAN) / NAK_SPAN

    # Anchor: the running Dasa began this many days before birth.
    elapsed_days = fraction_elapsed * YEARS[moon_lord] * YEAR_DAYS
    birth_dt = datetime(birth.year, birth.month, birth.day)
    dasa_start = birth_dt - timedelta(days=elapsed_days)

    periods: List[DasaPeriod] = []
    cursor = dasa_start
    generated = 0.0
    k = 0
    start_index = SEQUENCE.index(moon_lord)
    # Generate enough Mahadasas to cover span_years beyond birth.
    while generated < span_years + YEARS[moon_lord]:
        lord = SEQUENCE[(start_index + k) % 9]
        dur = YEARS[lord] * YEAR_DAYS
        end = cursor + timedelta(days=dur)
        children = _subperiods(lord, cursor, dur, 2, levels) if levels >= 2 else []
        periods.append(DasaPeriod(
            lord=lord, start=cursor.date(), end=end.date(), level=1,
            children=children,
        ))
        cursor = end
        generated += YEARS[lord]
        k += 1
    return periods


def current_period(timeline: List[DasaPeriod], on: Optional[date] = None
                   ) -> List[str]:
    """Return the active [Dasa, Bukthi, Antara] lords on a given date."""
    on = on or date.today()
    chain: List[str] = []

    def descend(periods: List[DasaPeriod]) -> None:
        for p in periods:
            if p.start <= on < p.end:
                chain.append(p.lord)
                descend(p.children)
                return

    descend(timeline)
    return chain


if __name__ == "__main__":
    # Validate against the report (Selvapriyan R): Moon 301.1567 deg sidereal.
    timeline = compute_dasa(301.1567, date(1990, 11, 25), levels=2)
    print("MAHADASHA           computed            report")
    ref = {
        "Mars": "16-10-1993", "Rahu": "16-10-2011", "Jupiter": "16-10-2027",
        "Saturn": "16-10-2046", "Mercury": "16-10-2063", "Ketu": "16-10-2070",
        "Venus": "16-10-2090", "Sun": "16-10-2096", "Moon": "16-10-2106",
    }
    for p in timeline[:9]:
        print(f"  {p.lord:8} ends {p.end.strftime('%d-%m-%Y')}   report ends {ref.get(p.lord,'')}")
    print("\nActive on 21-10-2024:", " > ".join(current_period(timeline, date(2024, 10, 21))))
