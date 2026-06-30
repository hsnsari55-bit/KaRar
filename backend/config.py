from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_ROOT / "data"

DXF_FILES = sorted(DATA_DIR.glob("*.dxf"))

if not DXF_FILES:
    raise FileNotFoundError("data klasöründe DXF bulunamadı!")

DXF = DXF_FILES[0]

OUTPUT_DIR = PROJECT_ROOT / "outputs"