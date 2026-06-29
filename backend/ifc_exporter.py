import json

INPUT = r"C:\KaRar\outputs\bim_model.json"
OUTPUT = r"C:\KaRar\outputs\model.ifc"

with open(INPUT, "r", encoding="utf-8") as f:
    bim = json.load(f)

lines = []

lines.append("ISO-10303-21;")
lines.append("HEADER;")
lines.append("FILE_DESCRIPTION(('KaRar BIM'),'2;1');")
lines.append("FILE_NAME('model.ifc','','',('KaRar'),('KaRar'),'','');")
lines.append("FILE_SCHEMA(('IFC4'));")
lines.append("ENDSEC;")
lines.append("DATA;")

idx = 1

for wall in bim["walls"]:
    lines.append(
        f"#{idx}=IFCWALLSTANDARDCASE('WALL_{wall['id']}',$,'Wall {wall['id']}',$,$,$,$,$);"
    )
    idx += 1

for door_id, door in enumerate(bim["doors"], start=1):
    lines.append(
        f"#{idx}=IFCDOOR('DOOR_{door_id}',$,'Door {door_id}',$,$,$,$,$,$);"
    )
    idx += 1

for window_id, window in enumerate(bim["windows"], start=1):
    lines.append(
        f"#{idx}=IFCWINDOW('WINDOW_{window_id}',$,'Window {window_id}',$,$,$,$,$,$);"
    )
    idx += 1

for column_id, column in enumerate(bim["columns"], start=1):
    lines.append(
        f"#{idx}=IFCCOLUMN('COLUMN_{column_id}',$,'Column {column_id}',$,$,$,$,$);"
    )
    idx += 1

for room in bim["rooms"]:
    lines.append(
        f"#{idx}=IFCSPACE('ROOM_{room['id']}',$,'Room {room['id']}',$,$,$,$,$);"
    )
    idx += 1

lines.append("ENDSEC;")
lines.append("END-ISO-10303-21;")

with open(OUTPUT, "w", encoding="utf-8") as f:
    f.write("\n".join(lines))

print("====================================")
print("         IFC EXPORTER")
print("====================================")
print("Walls   :", len(bim["walls"]))
print("Doors   :", len(bim["doors"]))
print("Windows :", len(bim["windows"]))
print("Columns :", len(bim["columns"]))
print("Rooms   :", len(bim["rooms"]))
print("------------------------------------")
print("Kaydedildi :", OUTPUT)
print("====================================")