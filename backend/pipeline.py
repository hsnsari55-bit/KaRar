import os
import subprocess
from pathlib import Path
import sys


def run_script(script_path):
    return_code = subprocess.run([sys.executable, script_path]).returncode
    return return_code == 0


def read_blender_config():
    import configparser

    config = configparser.ConfigParser()
    config.read("config.ini")
    
    blender_yolu: str = config.get("blender", "executable_path")  # Adjusted section name

    if not Path(blender_yolu).exists():
        print("Error: Provided Blender executable does not exist.")
        sys.exit(1)

    return blender_yolu


def run_pipeline():
    output_dir = Path("outputs")

    if not output_dir.exists():
        os.makedirs(output_dir)

    print("=" * 50)
    print("           KaRar AI v0.2")
    print("=" * 50)

    steps = [
        "backend/export_walls.py",
        "backend/export_doors.py",
        "backend/export_windows.py",
        "backend/room_detector.py",
        "backend/analyzer.py",
        "backend/save_clusters.py",
    ]

    for step in steps:
        if not run_script(step):
            sys.exit(1)

    print("\n>>> Çalışiyor: blender_builder.py (Blender 3D İnşa Motoru)")

    # NOT: Bilgisayarındaki Blender sürümüne göre klasör yolunu (Blender 4.0, Blender 4.2 vb.) kontrol etmen gerekebilir.

    blender_yolu = read_blender_config()
    blender_result = subprocess.run(
        [
            blender_yolu,
            "--background",
            "--python-exit-code=1",
            "backend/blender_builder.py",
        ]
    )

    if blender_result.returncode != 0:
        print("\nHATA: Blender motoru çalışmadı veya json verisini bulamadı.")
        sys.exit(1)

    print("\n==========================================")
    print("KaRar AI başarıyla tamamlandı.")
    print("==========================================")


if __name__ == "__main__":
    run_pipeline()