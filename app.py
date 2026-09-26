from flask import Flask, render_template, request, jsonify
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
import sqlite3
import os

app = Flask(__name__)

JAKARTA = ZoneInfo("Asia/Jakarta")
DB_PATH = os.path.join(
    os.path.dirname(__file__),
    "leaderboard.db"
)


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    conn.execute("""
        CREATE TABLE IF NOT EXISTS scores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            season_key TEXT NOT NULL,
            name TEXT NOT NULL,
            score INTEGER NOT NULL,
            created_at TEXT NOT NULL
        )
    """)

    return conn


def get_current_season():
    now = datetime.now(JAKARTA)

    iso = now.isocalendar()
    season_key = f"{iso.year}-W{iso.week:02d}"

    monday = (
        now - timedelta(days=now.weekday())
    ).replace(
        hour=0,
        minute=0,
        second=0,
        microsecond=0
    )

    next_reset = monday + timedelta(days=7)

    return {
        "season": iso.week,
        "season_key": season_key,
        "reset_at": next_reset.isoformat()
    }


def get_top_scores():
    season = get_current_season()

    conn = get_db()

    rows = conn.execute("""
        SELECT name, score
        FROM scores
        WHERE season_key = ?
        ORDER BY score DESC, id ASC
        LIMIT 100
    """, (season["season_key"],)).fetchall()

    conn.close()

    scores = [
        {
            "name": row["name"],
            "score": row["score"]
        }
        for row in rows
    ]

    return {
        "season": season["season"],
        "season_key": season["season_key"],
        "reset_at": season["reset_at"],
        "scores": scores
    }


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/api/leaderboard", methods=["GET"])
def get_leaderboard():
    return jsonify(get_top_scores())


@app.route("/api/leaderboard", methods=["POST"])
def add_score():

    data = request.get_json() or {}

    name = str(
        data.get("name", "Player")
    ).strip()

    try:
        score = int(data.get("score", 0))
    except (TypeError, ValueError):
        score = 0

    if not name:
        name = "Player"

    name = name[:20]

    if score < 0:
        score = 0

    season = get_current_season()

    conn = get_db()

    conn.execute("""
        INSERT INTO scores (
            season_key,
            name,
            score,
            created_at
        )
        VALUES (?, ?, ?, ?)
    """, (
        season["season_key"],
        name,
        score,
        datetime.now(JAKARTA).isoformat()
    ))

    conn.commit()
    conn.close()

    return jsonify(get_top_scores())


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )
