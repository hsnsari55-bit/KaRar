import json
from shapely.geometry import LineString

JSON_FILE = r"C:\KaRar\outputs\walls_clean.json"

with open(JSON_FILE, "r", encoding="utf-8") as f:
    walls = json.load(f)

lines = []
points = []

for wall in walls:

    if wall["type"] == "LINE":

        p1 = tuple(wall["start"])
        p2 = tuple(wall["end"])

        lines.append(LineString([p1, p2]))
        points.append(p1)
        points.append(p2)

    elif wall["type"] == "LWPOLYLINE":

        pts = [tuple(p) for p in wall["points"]]

        lines.append(LineString(pts))

        for p in pts:
            points.append(p)

print("--------------------------------")
print("Toplam Geometri :", len(lines))
print("Toplam Nokta :", len(points))

unique = set(points)

print("Benzersiz Nokta :", len(unique))

endpoint_count = {}

for p in points:
    endpoint_count[p] = endpoint_count.get(p, 0) + 1

single = [p for p, c in endpoint_count.items() if c == 1]

print("Açık Uç Sayısı :", len(single))

print("--------------------------------")
print("İlk 20 Açık Uç")

for p in single[:20]:
    print(p)

print("--------------------------------")