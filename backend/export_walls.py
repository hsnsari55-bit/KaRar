import ezdxf
import json

# ============================
# DOSYALAR
# ============================

DXF_FILE = r"C:\KaRar\data\test_plan.dxf"
OUTPUT = r"C:\KaRar\outputs\walls_clean.json"

# ============================
# DXF AÇ
# ============================

doc = ezdxf.readfile(DXF_FILE)
msp = doc.modelspace()

walls = []

# ============================
# SADECE GERÇEK DUVARLAR
# ============================

for entity in msp:

    if entity.dxftype() != "LWPOLYLINE":
        continue

    layer = entity.dxf.layer.strip().lower()

    if layer != "duvar":
        continue

    points = []

    for p in entity.get_points():
        points.append([p[0], p[1]])

    walls.append(
        {
            "type": "LWPOLYLINE",
            "layer": entity.dxf.layer,
            "closed": entity.closed,
            "points": points
        }
    )

# ============================
# KAYDET
# ============================

with open(OUTPUT, "w", encoding="utf-8") as f:
    json.dump(
        walls,
        f,
        indent=4,
        ensure_ascii=False
    )

print("--------------------------------")
print("Duvar Sayısı :", len(walls))
print("Çıktı :", OUTPUT)
print("--------------------------------")