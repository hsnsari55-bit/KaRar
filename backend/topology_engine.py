import json
from shapely.geometry import LineString
from shapely.ops import unary_union, linemerge

# ======================================
# DOSYALAR
# ======================================

INPUT = r"C:\KaRar\outputs\bim_clean.json"

# ======================================
# VERİYİ OKU
# ======================================

with open(INPUT, "r", encoding="utf-8") as f:
    objects = json.load(f)

lines = []

# ======================================
# WALL -> LINESTRING
# ======================================

for obj in objects:

    if obj["category"] != "WALL":
        continue

    if obj["entity"] == "LINE":

        lines.append(
            LineString([
                obj["start"],
                obj["end"]
            ])
        )

    elif obj["entity"] == "LWPOLYLINE":

        pts = obj["points"]

        if len(pts) >= 2:
            lines.append(LineString(pts))

# ======================================
# TOPOLOGY
# ======================================

merged = linemerge(unary_union(lines))

# ======================================
# RAPOR
# ======================================

print("====================================")
print("      KaRar Topology Engine")
print("====================================")

print("İlk Çizgi :", len(lines))

if merged.geom_type == "LineString":
    print("Birleşik Tip : LineString")
    print("Parça Sayısı : 1")

elif merged.geom_type == "MultiLineString":
    print("Birleşik Tip : MultiLineString")
    print("Parça Sayısı :", len(merged.geoms))

else:
    print("Birleşik Tip :", merged.geom_type)

print("====================================")