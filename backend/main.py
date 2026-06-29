import subprocess
import sys

print("=" * 50)
print("           KaRar AI v0.2")
print("=" * 50)

steps = [
    "export_walls.py",
    "export_doors.py",
    "export_windows.py",
    "analyzer.py",
    "save_clusters.py"
]

for step in steps:

    print(f"\n>>> Çalışıyor: {step}")

    result = subprocess.run(
        [sys.executable, f"backend/{step}"]
    )

    if result.returncode != 0:
        print(f"\nHATA: {step} çalışmadı.")
        sys.exit(1)

print("\n==========================================")
print("KaRar AI başarıyla tamamlandı.")
print("==========================================")