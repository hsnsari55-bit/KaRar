import ezdxf
from classifier import classify
from collections import Counter

DXF_FILE = r"C:\KaRar\data\test_plan.dxf"

doc = ezdxf.readfile(DXF_FILE)
msp = doc.modelspace()

counter = Counter()

for entity in msp:

    category = classify(entity.dxf.layer)

    counter[category] += 1

print("\n==============================")

for name, count in sorted(counter.items()):
    print(f"{name:<15} : {count}")

print("==============================")