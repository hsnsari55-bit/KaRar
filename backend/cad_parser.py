import ezdxf
import json
from pathlib import Path

DXF = Path(r"C:\KaRar\data\test_plan.dxf")
OUTPUT = Path(r"C:\KaRar\outputs\cad_database.json")

doc = ezdxf.readfile(DXF)
msp = doc.modelspace()

database = []

for entity in msp:

    item = {
        "type": entity.dxftype(),
        "layer": entity.dxf.layer,
        "handle": entity.dxf.handle,
    }

    try:
        item["color"] = entity.dxf.color
    except:
        item["color"] = None

    try:
        item["linetype"] = entity.dxf.linetype
    except:
        item["linetype"] = None

    if entity.dxftype() == "LINE":

        item["start"] = list(entity.dxf.start[:2])
        item["end"] = list(entity.dxf.end[:2])

    elif entity.dxftype() == "LWPOLYLINE":

        item["points"] = [
            [p[0], p[1]]
            for p in entity.get_points()
        ]

        item["closed"] = entity.closed

    elif entity.dxftype() == "INSERT":

        item["block"] = entity.dxf.name
        item["insert"] = list(entity.dxf.insert[:2])

    elif entity.dxftype() in ("TEXT", "MTEXT"):

        try:
            item["text"] = entity.dxf.text
        except:
            item["text"] = entity.text

        try:
            item["insert"] = list(entity.dxf.insert[:2])
        except:
            pass

    database.append(item)

with open(OUTPUT, "w", encoding="utf-8") as f:
    json.dump(database, f, indent=4, ensure_ascii=False)

print("=" * 45)
print("        CAD PARSER")
print("=" * 45)
print("Toplam Entity :", len(database))

types = {}

for e in database:
    types[e["type"]] = types.get(e["type"], 0) + 1

print()

for k, v in sorted(types.items()):
    print(f"{k:<18} {v}")

print("=" * 45)
print("Kaydedildi :", OUTPUT)
print("=" * 45)