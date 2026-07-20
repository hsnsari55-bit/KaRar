import os
import json
import logging
import uuid
from typing import List, Dict, Any, Tuple, Optional
from backend.path_manager import PathManager
from backend.config import ConfigManager

class DXFParser:
    """
    Deterministic Pure-Python DXF Parser.
    Reads a raw ASCII DXF file, extracts entities (LINE, ARC, LWPOLYLINE, TEXT, MTEXT, CIRCLE),
    and saves them as a structured, normalized JSON payload in outputs/dxf_raw.json.
    Operates relative to the locked workspace root and relies on no external dependencies.
    """
    
    def __init__(self):
        self.path_manager = PathManager()
        self.config = ConfigManager()
        self.logger = logging.getLogger('KaRar')
        self.entities: List[Dict[str, Any]] = []
        self.min_x = float('inf')
        self.min_y = float('inf')
        self.max_x = float('-inf')
        self.max_y = float('-inf')

    def _parse_pairs(self, filepath: str, encoding: str = 'utf-8') -> List[Tuple[int, str]]:
        """Reads the DXF file and yields list of (group_code, value) pairs."""
        pairs = []
        try:
            with open(filepath, 'r', encoding=encoding, errors='replace') as f:
                lines = f.readlines()
                
            # Process lines in pairs
            i = 0
            while i < len(lines) - 1:
                code_line = lines[i].strip()
                val_line = lines[i+1].strip()
                if code_line:
                    try:
                        code = int(code_line)
                        pairs.append((code, val_line))
                    except ValueError:
                        # Skip if code is not an integer
                        pass
                i += 2
        except Exception as e:
            self.logger.error(f"Error reading DXF file in parser: {str(e)}")
        return pairs

    def _detect_encoding(self, filepath: str) -> str:
        """Heuristically detects DWGCODEPAGE or defaults to utf-8."""
        try:
            # Quick scanning of the first 100 lines for DWGCODEPAGE
            with open(filepath, 'r', encoding='ascii', errors='ignore') as f:
                for _ in range(200):
                    line1 = f.readline().strip()
                    line2 = f.readline().strip()
                    if line1 == '3' and 'ANSI_' in line2:
                        codepage = line2.replace('ANSI_', 'cp')
                        self.logger.info(f"Detected DXF encoding codepage: {codepage}")
                        return codepage
        except Exception:
            pass
        return 'utf-8'

    def parse(self, filename: str) -> Dict[str, Any]:
        """
        Parses a DXF file from the data folder and extracts key entities.
        Saves output in outputs/dxf_raw.json.
        """
        filepath = self.path_manager.get_path('data', filename)
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"DXF target file not found: {filepath}")

        encoding = self._detect_encoding(filepath)
        pairs = self._parse_pairs(filepath, encoding=encoding)
        
        self.entities = []
        self.min_x = float('inf')
        self.min_y = float('inf')
        self.max_x = float('-inf')
        self.max_y = float('-inf')

        self.logger.info(f"Loaded {len(pairs)} DXF group code pairs. Parsing entities section...")

        # Find ENTITIES section
        in_entities = False
        i = 0
        n_pairs = len(pairs)
        
        while i < n_pairs:
            code, val = pairs[i]
            
            if code == 0 and val == 'SECTION':
                # Check next pair to see if it is ENTITIES
                if i + 1 < n_pairs and pairs[i+1][0] == 2 and pairs[i+1][1] == 'ENTITIES':
                    in_entities = True
                    i += 2
                    continue
            
            if in_entities and code == 0 and val == 'ENDSEC':
                in_entities = False
                break
                
            if in_entities and code == 0:
                # We found a new entity start
                entity_type = val
                entity_data: Dict[str, Any] = {
                    'id': f"entity_{uuid.uuid4().hex[:8]}",
                    'type': entity_type,
                    'layer': '0'
                }
                
                # Consume groups of the entity until the next entity (code 0)
                i += 1
                while i < n_pairs and pairs[i][0] != 0:
                    ent_code, ent_val = pairs[i]
                    
                    if ent_code == 8: # Layer name
                        # Standardize layer names (case insensitive & clean encoding)
                        layer = ent_val.strip()
                        # Clean encoding artifacts for Turkish (e.g. kap -> kapı)
                        if 'kap' in layer or 'kap' in layer.lower():
                            layer = 'kapı'
                        elif 'pencere' in layer.lower():
                            layer = 'k pencere'
                        elif 'duvar' in layer.lower():
                            layer = 'duvar'
                        elif 'kolon' in layer.lower():
                            layer = 'kolon'
                        elif 'aks' in layer.lower():
                            layer = 'aks'
                        entity_data['layer'] = layer
                        
                    elif ent_code == 10: # X or Center X
                        entity_data['x0'] = float(ent_val)
                    elif ent_code == 20: # Y or Center Y
                        entity_data['y0'] = float(ent_val)
                    elif ent_code == 30: # Z or Center Z
                        entity_data['z0'] = float(ent_val)
                        
                    elif ent_code == 11: # End X
                        entity_data['x1'] = float(ent_val)
                    elif ent_code == 21: # End Y
                        entity_data['y1'] = float(ent_val)
                    elif ent_code == 31: # End Z
                        entity_data['z1'] = float(ent_val)
                        
                    elif ent_code == 40: # Radius, Height or Width
                        entity_data['val_40'] = float(ent_val)
                    elif ent_code == 50: # Start angle (degrees)
                        entity_data['angle_start'] = float(ent_val)
                    elif ent_code == 51: # End angle (degrees)
                        entity_data['angle_end'] = float(ent_val)
                    elif ent_code == 1: # Text value
                        entity_data['text_value'] = ent_val
                        
                    elif ent_code == 90: # LWPOLYLINE number of vertices
                        entity_data['num_vertices'] = int(ent_val)
                        entity_data['vertices'] = []
                        
                    elif ent_code == 70: # Flag (closed/open for polyline)
                        entity_data['flag_70'] = int(ent_val)
                        
                    # Handle repeating coordinates in LWPOLYLINE
                    if entity_type == 'LWPOLYLINE':
                        if ent_code == 10:
                            # A vertex is starting. Let's see if we have 20 following it.
                            # We will gather vertices systematically during high-fidelity parsing below.
                            pass
                    
                    i += 1
                
                # High fidelity vertices extraction for LWPOLYLINE
                if entity_type == 'LWPOLYLINE':
                    # Re-scan the entity block to get matched (X, Y) vertices
                    idx = i - 1
                    # Go back to start of this entity block
                    while idx >= 0 and pairs[idx][0] != 0:
                        idx -= 1
                    # Now extract vertices sequentially
                    vertices = []
                    curr_vertex = {}
                    while idx < i:
                        e_c, e_v = pairs[idx]
                        if e_c == 10:
                            curr_vertex['x'] = float(e_v)
                        elif e_c == 20:
                            curr_vertex['y'] = float(e_v)
                            if 'x' in curr_vertex:
                                vertices.append(curr_vertex)
                                curr_vertex = {}
                        idx += 1
                    entity_data['vertices'] = vertices

                # Map entity specific metrics
                self._enrich_and_bounding_box(entity_data)
                self.entities.append(entity_data)
                continue
                
            i += 1

        # Post-processing and normalization
        self.logger.info(f"Successfully extracted {len(self.entities)} raw geometric entities.")
        
        output_payload = {
            "project": self.config.get("project.name", "KaRar Project"),
            "source_file": filename,
            "encoding": encoding,
            "bounding_box": {
                "min_x": self.min_x if self.min_x != float('inf') else 0.0,
                "min_y": self.min_y if self.min_y != float('inf') else 0.0,
                "max_x": self.max_x if self.max_x != float('-inf') else 0.0,
                "max_y": self.max_y if self.max_y != float('-inf') else 0.0
            },
            "entities": self.entities
        }

        # Save to outputs
        output_path = self.path_manager.get_path('outputs', 'dxf_raw.json')
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(output_payload, f, indent=2, ensure_ascii=False)

        self.logger.info(f"Raw DXF payloads exported successfully to {self.path_manager.get_relative_path(output_path)}")
        return output_payload

    def _enrich_and_bounding_box(self, ent: Dict[str, Any]):
        """Calculates bounding box of entity and updates global limits."""
        etype = ent['type']
        
        if etype == 'LINE':
            x0, y0 = ent.get('x0', 0.0), ent.get('y0', 0.0)
            x1, y1 = ent.get('x1', 0.0), ent.get('y1', 0.0)
            ent['start'] = {'x': x0, 'y': y0, 'z': ent.get('z0', 0.0)}
            ent['end'] = {'x': x1, 'y': y1, 'z': ent.get('z1', 0.0)}
            
            # Update bounds
            self.min_x = min(self.min_x, x0, x1)
            self.min_y = min(self.min_y, y0, y1)
            self.max_x = max(self.max_x, x0, x1)
            self.max_y = max(self.max_y, y0, y1)
            
        elif etype in ['ARC', 'CIRCLE']:
            cx, cy = ent.get('x0', 0.0), ent.get('y0', 0.0)
            r = ent.get('val_40', 0.0)
            ent['center'] = {'x': cx, 'y': cy, 'z': ent.get('z0', 0.0)}
            ent['radius'] = r
            
            # Simple bounds for arc/circle
            self.min_x = min(self.min_x, cx - r)
            self.min_y = min(self.min_y, cy - r)
            self.max_x = max(self.max_x, cx + r)
            self.max_y = max(self.max_y, cy + r)
            
        elif etype == 'LWPOLYLINE':
            vertices = ent.get('vertices', [])
            for v in vertices:
                vx, vy = v['x'], v['y']
                self.min_x = min(self.min_x, vx)
                self.min_y = min(self.min_y, vy)
                self.max_x = max(self.max_x, vx)
                self.max_y = max(self.max_y, vy)
                
        elif etype in ['TEXT', 'MTEXT']:
            tx, ty = ent.get('x0', 0.0), ent.get('y0', 0.0)
            ent['position'] = {'x': tx, 'y': ty, 'z': ent.get('z0', 0.0)}
            ent['height'] = ent.get('val_40', 2.5)
            
            self.min_x = min(self.min_x, tx)
            self.min_y = min(self.min_y, ty)
            self.max_x = max(self.max_x, tx)
            self.max_y = max(self.max_y, ty)

if __name__ == '__main__':
    # Simple self-test entry point
    logging.basicConfig(level=logging.INFO)
    parser = DXFParser()
    try:
        res = parser.parse('test_plan.dxf')
        print(f"Parsed {len(res['entities'])} entities successfully!")
        print(f"Bounds: {res['bounding_box']}")
    except Exception as e:
        print("Parsing failed:", e)
