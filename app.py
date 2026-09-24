from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

leaderboard = []


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/api/leaderboard", methods=["GET"])
def get_leaderboard():
    return jsonify(leaderboard)


@app.route("/api/leaderboard", methods=["POST"])
def add_score():

    data = request.get_json() or {}

    name = str(
        data.get("name", "Rizki")
    ).strip()

    score = int(
        data.get("score", 0)
    )

    # Kalau nama kosong
    if not name:
        name = "Rizki"

    # Batasi panjang nama
    name = name[:20]

    leaderboard.append({
        "name": name,
        "score": score
    })

    leaderboard.sort(
        key=lambda x: x["score"],
        reverse=True
    )

    # Simpan TOP 5
    del leaderboard[5:]

    return jsonify(leaderboard)


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )