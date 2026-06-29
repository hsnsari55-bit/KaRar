import json
from collections import Counter

JSON_FILE = r"C:\KaRar\outputs\bim.json"

with open(JSON_FILE, "r", encoding="utf-8") as f:
    objects = json.load(f)

print("===================================")
print("       KaRar BIM Validator")
print("===================================")

print("\nToplam Obje :", len(objects))

categories = Counter()
entities = Counter()

line_count = 0
polyline_count = 0
closed_polyline = 0

for obj in objects:

    categories[obj["category"]] += 1
    entities[obj["entity"]] += 1

    if obj["entity"] == "LINE":
        line_count += 1

    elif obj["entity"] == "LWPOLYLINE":
        polyline_count += 1

        if obj.get("closed", False):
            closed_polyline += 1

print("\n===== KATEGORİLER =====\n")

for k, v in sorted(categories.items()):
    print(f"{k:<15} : {v}")

print("\n===== ENTITYLER =====\n")

for k, v in sorted(entities.items()):
    print(f"{k:<15} : {v}")

print("\n===== GEOMETRİ =====\n")

print("LINE            :", line_count)
print("LWPOLYLINE      :", polyline_count)
print("Kapalı Polyline :", closed_polyline)

print("\n===================================")
print("Validator Tamamlandı")
print("===================================")