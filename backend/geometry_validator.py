import json

JSON_FILE = r"C:\KaRar\outputs\walls_clean.json"

with open(JSON_FILE, "r", encoding="utf-8") as f:
    walls = json.load(f)

endpoints = {}

for wall in walls:

    if wall["type"] == "LINE":

        pts = [
            tuple(wall["start"]),
            tuple(wall["end"])
        ]

    elif wall["type"] == "LWPOLYLINE":

        pts = [tuple(p) for p in wall["points"]]

        if wall.get("closed", False):
            continue

        pts = [
            pts[0],
            pts[-1]
        ]

    else:
        continue

    for p in pts:

        endpoints[p] = endpoints.get(p, 0) + 1

open_points = []

for p, c in endpoints.items():

    if c == 1:
        open_points.append(p)

print("--------------------------------")
print("Toplam Endpoint :", len(endpoints))
print("Açık Endpoint :", len(open_points))
print("--------------------------------")

print("İlk 20 Açık Nokta")

for p in open_points[:20]:
    print(p)

print("--------------------------------")