import ezdxf
import json

dosya = r"C:\KaRar\data\test_plan.dxf"

doc = ezdxf.readfile(dosya)
msp = doc.modelspace()

doors = []

for entity in msp:

    # Kapı katmanlarını filtrele
    if entity.dxf.layer.lower() not in [
        "kapı",
        "kapi",
        "kapi___pencere",
        "kapi ve pencereler",
        "kapı ve pencereler"
    ]:
        continue

    if entity.dxftype() == "LINE":

        doors.append({
            "layer": entity.dxf.layer,
            "type": "LINE",
            "start": [
                entity.dxf.start.x,
                entity.dxf.start.y
            ],
            "end": [
                entity.dxf.end.x,
                entity.dxf.end.y
            ]
        })

    elif entity.dxftype() == "LWPOLYLINE":

        points = []

        for p in entity.get_points():
            points.append([p[0], p[1]])

        doors.append({
            "layer": entity.dxf.layer,
            "type": "LWPOLYLINE",
            "points": points
        })

with open(
    r"C:\KaRar\outputs\doors.json",
    "w",
    encoding="utf-8"
) as f:
    json.dump(
        doors,
        f,
        indent=4,
        ensure_ascii=False
    )

print("doors.json oluşturuldu")
print("Toplam kapı elemanı:", len(doors))