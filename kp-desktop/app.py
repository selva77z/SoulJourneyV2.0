"""
app.py
======
CustomTkinter desktop GUI that ties the KP engine, database, and AI search
together into a single local application for Windows and macOS.

Tabs
----
* Add Profile  — a birth-detail form that computes and saves a chart.
* Chart View   — pick a saved profile and see its planet & cusp lord tables.
* AI Search    — type a natural-language KP query and get matching profiles.

Run with:  python app.py
(Requires: pip install customtkinter pyswisseph ;  optional: anthropic)
"""

from __future__ import annotations

import logging
import threading
import tkinter as tk
from tkinter import ttk, messagebox
from typing import Optional

import customtkinter as ctk

from engine import KPEngine, ABBR
from database import Database
from ai_agent import AIChartSearch

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("kp.app")

ctk.set_appearance_mode("dark")
ctk.set_default_color_theme("blue")

PLANET_ORDER = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn",
                "Rahu", "Ketu"]


class KPApp(ctk.CTk):
    def __init__(self) -> None:
        super().__init__()
        self.title("KP Stellar — Desktop")
        self.geometry("1040x720")
        self.minsize(900, 600)

        # Core services. A failure here (e.g. missing pyswisseph) is fatal but
        # must be reported cleanly rather than crashing on launch.
        try:
            self.engine = KPEngine()
        except ImportError as exc:
            messagebox.showerror("Missing dependency", str(exc))
            raise
        self.db = Database()
        self.ai = AIChartSearch(self.db)

        self.tabs = ctk.CTkTabview(self)
        self.tabs.pack(fill="both", expand=True, padx=12, pady=12)
        self.tabs.add("Add Profile")
        self.tabs.add("Chart View")
        self.tabs.add("AI Search")

        self._build_add_profile(self.tabs.tab("Add Profile"))
        self._build_chart_view(self.tabs.tab("Chart View"))
        self._build_ai_search(self.tabs.tab("AI Search"))

    # ------------------------------------------------------------------ #
    # Tab 1: Add Profile
    # ------------------------------------------------------------------ #
    def _build_add_profile(self, parent) -> None:
        frame = ctk.CTkFrame(parent)
        frame.pack(fill="both", expand=True, padx=16, pady=16)
        ctk.CTkLabel(frame, text="Add Profile",
                     font=("", 22, "bold")).grid(row=0, column=0, columnspan=4,
                                                  sticky="w", pady=(0, 12))

        self.inputs: dict[str, ctk.CTkEntry] = {}
        fields = [
            ("name", "Name", "Selvapriyan R"),
            ("dob", "Date (YYYY-MM-DD)", "1990-11-25"),
            ("tob", "Time (HH:MM:SS)", "03:17:25"),
            ("place", "Place", "Pudukkottai"),
            ("latitude", "Latitude (°N)", "10.381389"),
            ("longitude", "Longitude (°E)", "78.821389"),
            ("timezone", "Timezone (hrs from UTC)", "5.5"),
        ]
        for i, (key, label, default) in enumerate(fields):
            r = 1 + i // 2
            c = (i % 2) * 2
            ctk.CTkLabel(frame, text=label).grid(row=r, column=c, sticky="w",
                                                 padx=6, pady=6)
            entry = ctk.CTkEntry(frame, width=240)
            entry.insert(0, default)
            entry.grid(row=r, column=c + 1, sticky="w", padx=6, pady=6)
            self.inputs[key] = entry

        ctk.CTkLabel(frame, text="Ayanamsa").grid(row=5, column=0, sticky="w",
                                                  padx=6, pady=6)
        self.ayan_var = ctk.StringVar(value=KPEngine.AYANAMSA_KP_NEWCOMB)
        ctk.CTkOptionMenu(
            frame, variable=self.ayan_var,
            values=[KPEngine.AYANAMSA_KP_NEWCOMB, KPEngine.AYANAMSA_KP_OLD],
        ).grid(row=5, column=1, sticky="w", padx=6, pady=6)

        ctk.CTkButton(frame, text="Compute & Save",
                      command=self._on_save).grid(row=6, column=0, columnspan=2,
                                                   sticky="w", padx=6, pady=16)
        self.save_status = ctk.CTkLabel(frame, text="", text_color="#9ad0a0")
        self.save_status.grid(row=6, column=2, columnspan=2, sticky="w")

    def _on_save(self) -> None:
        try:
            v = {k: e.get().strip() for k, e in self.inputs.items()}
            chart = self.engine.compute(
                name=v["name"], dob=v["dob"], tob=v["tob"], place=v["place"],
                latitude=float(v["latitude"]), longitude=float(v["longitude"]),
                timezone_hours=float(v["timezone"]), ayanamsa=self.ayan_var.get(),
            )
            pid = self.db.save_chart(chart)
            asc = chart.cusps[1]
            self.save_status.configure(
                text=f"Saved (id {pid}). Lagna {asc.sign} {asc.dms}.")
            self._refresh_profiles()
        except ValueError as exc:
            messagebox.showerror("Invalid input", str(exc))
        except Exception as exc:  # pragma: no cover - last-resort guard
            logger.exception("save failed")
            messagebox.showerror("Error", f"Could not compute chart:\n{exc}")

    # ------------------------------------------------------------------ #
    # Tab 2: Chart View
    # ------------------------------------------------------------------ #
    def _build_chart_view(self, parent) -> None:
        bar = ctk.CTkFrame(parent)
        bar.pack(fill="x", padx=16, pady=(16, 8))
        ctk.CTkLabel(bar, text="Profile:").pack(side="left", padx=(6, 8))
        self.profile_var = ctk.StringVar()
        self.profile_menu = ctk.CTkOptionMenu(
            bar, variable=self.profile_var, values=["—"],
            command=lambda _=None: self._show_chart())
        self.profile_menu.pack(side="left")
        ctk.CTkButton(bar, text="Refresh", width=90,
                      command=self._refresh_profiles).pack(side="left", padx=8)

        self._profiles_by_label: dict[str, int] = {}

        container = ctk.CTkFrame(parent)
        container.pack(fill="both", expand=True, padx=16, pady=8)
        self.planet_tree = self._make_tree(
            container, "9 Planet Positions",
            ["Planet", "Degree", "Sign", "Nakshatra", "RL", "StL", "SbL", "SSL"])
        self.cusp_tree = self._make_tree(
            container, "12 Bhava Cuspal Positions",
            ["Cusp", "Degree", "Sign", "Nakshatra", "RL", "StL", "SbL", "SSL"])
        self._refresh_profiles()

    def _make_tree(self, parent, title: str, columns: list[str]) -> ttk.Treeview:
        wrap = ctk.CTkFrame(parent)
        wrap.pack(fill="both", expand=True, pady=6)
        ctk.CTkLabel(wrap, text=title, font=("", 15, "bold")).pack(anchor="w",
                                                                   padx=6, pady=4)
        style = ttk.Style()
        style.theme_use("default")
        style.configure("Treeview", background="#1c1c24", fieldbackground="#1c1c24",
                        foreground="#e8e6f0", rowheight=24, borderwidth=0)
        style.configure("Treeview.Heading", background="#2a2a38",
                        foreground="#cbb978", relief="flat")
        tree = ttk.Treeview(wrap, columns=columns, show="headings", height=9)
        for col in columns:
            tree.heading(col, text=col)
            tree.column(col, width=100 if col in ("Nakshatra", "Sign") else 70,
                        anchor="w")
        tree.pack(fill="both", expand=True, padx=6, pady=4)
        return tree

    def _refresh_profiles(self) -> None:
        rows = self.db.list_profiles()
        self._profiles_by_label = {
            f"{r['name']}  ({r['dob']})": r["id"] for r in rows
        }
        labels = list(self._profiles_by_label) or ["—"]
        self.profile_menu.configure(values=labels)
        if labels and labels[0] != "—":
            self.profile_var.set(labels[0])
            self._show_chart()

    def _show_chart(self) -> None:
        label = self.profile_var.get()
        pid = self._profiles_by_label.get(label)
        if pid is None:
            return
        data = self.db.get_chart_rows(pid)
        for tree in (self.planet_tree, self.cusp_tree):
            tree.delete(*tree.get_children())
        order = {p: i for i, p in enumerate(PLANET_ORDER)}
        for row in sorted(data["planets"], key=lambda r: order.get(r["planet"], 99)):
            self.planet_tree.insert("", "end", values=(
                row["planet"], row["dms"], row["sign"],
                f"{row['nakshatra']} ({row['pada']})",
                ABBR.get(row["sign_lord"], row["sign_lord"]),
                ABBR.get(row["star_lord"], row["star_lord"]),
                ABBR.get(row["sub_lord"], row["sub_lord"]),
                ABBR.get(row["sub_sub_lord"], row["sub_sub_lord"]),
            ))
        for row in data["cusps"]:
            self.cusp_tree.insert("", "end", values=(
                row["house"], row["dms"], row["sign"],
                f"{row['nakshatra']} ({row['pada']})",
                ABBR.get(row["sign_lord"], row["sign_lord"]),
                ABBR.get(row["star_lord"], row["star_lord"]),
                ABBR.get(row["sub_lord"], row["sub_lord"]),
                ABBR.get(row["sub_sub_lord"], row["sub_sub_lord"]),
            ))

    # ------------------------------------------------------------------ #
    # Tab 3: AI Search
    # ------------------------------------------------------------------ #
    def _build_ai_search(self, parent) -> None:
        top = ctk.CTkFrame(parent)
        top.pack(fill="x", padx=16, pady=16)
        ctk.CTkLabel(top, text="AI Chart Search", font=("", 20, "bold")).pack(
            anchor="w")
        ctk.CTkLabel(
            top, text=f"Backend: {self.ai.backend_name}  ·  e.g. "
            '"Find charts where Jupiter is the 11th house sub lord"',
            text_color="#9a93b8").pack(anchor="w", pady=(2, 10))

        entry_row = ctk.CTkFrame(top)
        entry_row.pack(fill="x")
        self.query_entry = ctk.CTkEntry(
            entry_row, placeholder_text="Describe the KP combination…")
        self.query_entry.pack(side="left", fill="x", expand=True, padx=(0, 8))
        self.query_entry.bind("<Return>", lambda _e: self._on_search())
        self.search_btn = ctk.CTkButton(entry_row, text="Search", width=110,
                                         command=self._on_search)
        self.search_btn.pack(side="left")

        self.ai_status = ctk.CTkLabel(parent, text="", text_color="#9a93b8")
        self.ai_status.pack(anchor="w", padx=16)

        # Results table.
        wrap = ctk.CTkFrame(parent)
        wrap.pack(fill="both", expand=True, padx=16, pady=8)
        cols = ["Name", "DOB", "Time", "Place"]
        self.result_tree = ttk.Treeview(wrap, columns=cols, show="headings")
        for c in cols:
            self.result_tree.heading(c, text=c)
            self.result_tree.column(c, width=160, anchor="w")
        self.result_tree.pack(fill="both", expand=True)

    def _on_search(self) -> None:
        query = self.query_entry.get().strip()
        if not query:
            return
        self.search_btn.configure(state="disabled", text="…")
        self.ai_status.configure(text="Interpreting query…")

        # Run off the UI thread so the window stays responsive during an API call.
        def worker() -> None:
            try:
                out = self.ai.run(query)
                self.after(0, lambda: self._render_results(out))
            except Exception as exc:
                self.after(0, lambda: self._search_error(exc))

        threading.Thread(target=worker, daemon=True).start()

    def _render_results(self, out: dict) -> None:
        self.search_btn.configure(state="normal", text="Search")
        self.result_tree.delete(*self.result_tree.get_children())
        spec = out["spec"]
        desc = " ; ".join(
            f"{c.get('entity', 'H'+str(c.get('house')))}.{c['field']}={c['value']}"
            for c in spec.conditions
        ) or "none"
        rows = out["results"]
        self.ai_status.configure(
            text=f"[{out['backend']}] match={spec.match}  conditions: {desc}  "
                 f"→ {len(rows)} result(s)")
        for r in rows:
            self.result_tree.insert("", "end", values=(
                r["name"], r["dob"], r["tob"], r["place"]))

    def _search_error(self, exc: Exception) -> None:
        self.search_btn.configure(state="normal", text="Search")
        self.ai_status.configure(text=f"Error: {exc}", text_color="#e88")
        logger.error("search error: %s", exc)


if __name__ == "__main__":
    KPApp().mainloop()
