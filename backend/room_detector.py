import json
from shapely.geometry import LineString
from shapely.ops import polygonize

# -----------------------------
# DOSYA
# -----------------------------

JSON_FILE = r"C:\KaRar\outputs\villa1.json"

# -----------------------------
# JSON OKU
# -----------------------------

with open(JSON_FILE, "r", encoding="utf-8") as f:
    walls = json.load(f)

lines = []

# -----------------------------
# LINE'LARI TOPLA
# -----------------------------

for wall in walls:

    if wall["type"] != "LINE":
        continue

    x1, y1 = wall["start"]
    x2, y2 = wall["end"]

    lines.append(
        LineString([
            (x1, y1),
            (x2, y2)
        ])
    )

# -----------------------------
# KAPALI ALANLARI BUL
# -----------------------------

polygons = list(polygonize(lines))

print("--------------------------------")
print("Kapalı Alan Sayısı :", len(polygons))
print("--------------------------------")

for i, poly in enumerate(polygons[:10]):

    print(
        f"Oda {i+1}  Alan = {round(poly.area,2)}"
    )