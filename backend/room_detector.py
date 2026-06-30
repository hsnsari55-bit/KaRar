import json
from shapely.geometry import LineString, Polygon
from shapely.ops import polygonize

# -----------------------------
# CONFIGURATION
# -----------------------------

INPUT_FILE = r"C:\KaRar\outputs\walls.json"
OUTPUT_ROOMS_FILE = r"C:\KaRar\outputs\rooms.json"
OUTPUT_REPORT_FILE = r"C:\KaRar\outputs\room_report.json"

# -----------------------------
# LOAD WALLS
# -----------------------------

with open(INPUT_FILE, "r", encoding="utf-8") as f:
    walls = json.load(f)

# Build wall lookup for ID matching
wall_lookup = {}
for wall in walls:
    if wall.get("type") == "LINE":
        start = tuple(wall["start"])
        end = tuple(wall["end"])
        wall_lookup[(start, end)] = wall.get("id", "")
        wall_lookup[(end, start)] = wall.get("id", "")

lines = []

# -----------------------------
# COLLECT LINES
# -----------------------------

for wall in walls:
    if wall.get("type") != "LINE":
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
# FIND CLOSED POLYGONS (ROOMS)
# -----------------------------

polygons = list(polygonize(lines))

print("--------------------------------")
print("Kapalı Alan Sayısı :", len(polygons))
print("--------------------------------")

# -----------------------------
# PROCESS ROOMS
# -----------------------------

rooms = []

for i, poly in enumerate(polygons):
    # Calculate properties
    area = poly.area
    perimeter = poly.length
    center = poly.centroid
    
    # Get polygon boundary coordinates
    polygon_coords = list(poly.exterior.coords)
    
    # Find wall IDs that form this room's boundary
    wall_ids = []
    for j in range(len(polygon_coords) - 1):
        start = polygon_coords[j]
        end = polygon_coords[j + 1]
        if (start, end) in wall_lookup:
            wall_ids.append(wall_lookup[(start, end)])
        elif (end, start) in wall_lookup:
            wall_ids.append(wall_lookup[(end, start)])
    
    # Remove duplicates while preserving order
    seen = set()
    unique_wall_ids = []
    for wid in wall_ids:
        if wid not in seen:
            seen.add(wid)
            unique_wall_ids.append(wid)

    # Assign unique ID
    room_id = f'room_{i+1}'

    # Store room data
    rooms.append({
        'id': room_id,
        'wall_ids': unique_wall_ids,
        'polygon': polygon_coords,
        'area': round(area, 2),
        'perimeter': round(perimeter, 2),
        'center': [round(center.x, 2), round(center.y, 2)]
    })

# -----------------------------
# EXPORT ROOMS
# -----------------------------

with open(OUTPUT_ROOMS_FILE, 'w', encoding='utf-8') as f:
    json.dump(rooms, f, indent=2)

print(f"Rooms exported to {OUTPUT_ROOMS_FILE}")

# -----------------------------
# GENERATE REPORT
# -----------------------------

if rooms:
    areas = [room['area'] for room in rooms]
    largest_room = max(rooms, key=lambda x: x['area'])
    smallest_room = min(rooms, key=lambda x: x['area'])
    average_area = sum(areas) / len(areas)
else:
    areas = []
    largest_room = None
    smallest_room = None
    average_area = 0

report = {
    'total_rooms': len(rooms),
    'room_areas': areas,
    'largest_room': largest_room,
    'smallest_room': smallest_room,
    'average_area': round(average_area, 2)
}

with open(OUTPUT_REPORT_FILE, 'w', encoding='utf-8') as f:
    json.dump(report, f, indent=2)

print(f"Report exported to {OUTPUT_REPORT_FILE}")

# Print summary
for room in rooms:
    print(f"Oda {room['id']}  Alan = {room['area']} m²  Çevre = {room['perimeter']} m  Merkez = {room['center']}")