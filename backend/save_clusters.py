import json
from sklearn.cluster import DBSCAN

# walls.json oku
with open(
    r"C:\KaRar\outputs\walls.json",
    "r",
    encoding="utf-8"
) as f:
    walls = json.load(f)

points = []

for wall in walls:

    if wall["type"] == "LINE":
        x = (wall["start"][0] + wall["end"][0]) / 2
        y = (wall["start"][1] + wall["end"][1]) / 2

    else:
        xs = [p[0] for p in wall["points"]]
        ys = [p[1] for p in wall["points"]]
        x = sum(xs) / len(xs)
        y = sum(ys) / len(ys)

    points.append([x, y])

# DBSCAN
model = DBSCAN(eps=1500, min_samples=10)
labels = model.fit_predict(points)

villa1 = []
villa2 = []

for i, label in enumerate(labels):

    if label == 0:
        villa1.append(walls[i])

    elif label == 1:
        villa2.append(walls[i])

# Kaydet
with open(
    r"C:\KaRar\outputs\villa1.json",
    "w",
    encoding="utf-8"
) as f:
    json.dump(villa1, f, indent=4, ensure_ascii=False)

with open(
    r"C:\KaRar\outputs\villa2.json",
    "w",
    encoding="utf-8"
) as f:
    json.dump(villa2, f, indent=4, ensure_ascii=False)

print("Villa 1 :", len(villa1))
print("Villa 2 :", len(villa2))
print("villa1.json oluşturuldu")
print("villa2.json oluşturuldu")