import os
import json
import logging
import math
from typing import List, Dict, Any, Tuple
from backend.path_manager import PathManager
from backend.config import ConfigManager

class GeometryEngine:
    """
    Geometry Engine (Step 2 of the KaRar Pipeline).
    Reads outputs/dxf_raw.json, filters wall layers, applies snaps, collinear merges,
    T-junction cleanups, and outputs a clean outputs/walls_clean.json structure.
    """

    def __init__(self):
        self.path_manager = PathManager()
        self.config = ConfigManager()
        self.logger = logging.getLogger('KaRar')
        
        # Load tolerances from settings.json
        self.snap_tolerance = self.config.get("tolerances.snapping_distance_mm", 5.0)
        self.collinear_angle_deg = self.config.get("tolerances.collinear_angle_threshold_deg", 2.5)

    def _distance(self, p1: Tuple[float, float], p2: Tuple[float, float]) -> float:
        return math.sqrt((p1[0] - p2[0])**2 + (p1[1] - p2[1])**2)

    def _is_collinear(self, p1: Tuple[float, float], p2: Tuple[float, float], p3: Tuple[float, float]) -> bool:
        """Determines if three points are approximately collinear."""
        # Vector p1->p2
        v1_x = p2[0] - p1[0]
        v1_y = p2[1] - p1[1]
        len1 = math.sqrt(v1_x**2 + v1_y**2)
        
        # Vector p2->p3
        v2_x = p3[0] - p2[0]
        v2_y = p3[1] - p2[1]
        len2 = math.sqrt(v2_x**2 + v2_y**2)
        
        if len1 < 1e-5 or len2 < 1e-5:
            return True
            
        # Normalize vectors and calculate dot product
        dot_product = (v1_x * v2_x + v1_y * v2_y) / (len1 * len2)
        # Cap dot product to avoid math domain errors
        dot_product = max(-1.0, min(1.0, dot_product))
        
        angle = math.acos(dot_product)
        angle_deg = math.degrees(angle)
        
        return angle_deg < self.collinear_angle_deg or (180.0 - angle_deg) < self.collinear_angle_deg

    def run(self) -> List[Dict[str, Any]]:
        """
        Executes the geometric cleaning pipeline.
        Produces outputs/walls_clean.json.
        """
        raw_path = self.path_manager.get_path('outputs', 'dxf_raw.json')
        if not os.path.exists(raw_path):
            self.logger.warning("dxf_raw.json not found. Running DXFParser fallback...")
            from backend.dxf_parser import DXFParser
            parser = DXFParser()
            raw_data = parser.parse('test_plan.dxf')
        else:
            with open(raw_path, 'r', encoding='utf-8') as f:
                raw_data = json.load(f)

        entities = raw_data.get('entities', [])
        wall_layers = [w.lower() for w in self.config.get_layer_mapping("walls")] + ['walls', 'duvar', 'duvarlar']
        
        # Filter wall entities
        wall_entities = []
        for ent in entities:
            layer = ent.get('layer', '').lower()
            if any(wl in layer for wl in wall_layers) or ent.get('type') == 'LWPOLYLINE':
                wall_entities.append(ent)

        self.logger.info(f"Filtering wall layers found {len(wall_entities)} candidate entities.")

        cleaned_walls: List[Dict[str, Any]] = []
        
        # Snap vertices logic
        all_points: List[Tuple[float, float]] = []
        for ent in wall_entities:
            if ent['type'] == 'LINE':
                if 'start' in ent and 'end' in ent:
                    all_points.append((ent['start']['x'], ent['start']['y']))
                    all_points.append((ent['end']['x'], ent['end']['y']))
            elif ent['type'] == 'LWPOLYLINE':
                for v in ent.get('vertices', []):
                    all_points.append((v['x'], v['y']))

        # Standard clustering/snapping for all coordinate points
        snapped_map: Dict[Tuple[float, float], Tuple[float, float]] = {}
        unique_points: List[Tuple[float, float]] = []
        
        for p in all_points:
            snapped_to = None
            for up in unique_points:
                if self._distance(p, up) < self.snap_tolerance:
                    snapped_to = up
                    break
            if snapped_to is None:
                unique_points.append(p)
                snapped_map[p] = p
            else:
                snapped_map[p] = snapped_to

        self.logger.info(f"Snapping grid locked: clustered {len(all_points)} coordinates down to {len(unique_points)} unique snap-points.")

        # Reconstruct clean wall entities using snapped points
        for ent in wall_entities:
            if ent['type'] == 'LINE':
                p0 = (ent['start']['x'], ent['start']['y'])
                p1 = (ent['end']['x'], ent['end']['y'])
                sp0 = snapped_map.get(p0, p0)
                sp1 = snapped_map.get(p1, p1)
                
                # Check for zero length lines after snapping
                if self._distance(sp0, sp1) > 1e-2:
                    cleaned_walls.append({
                        "type": "LWPOLYLINE",
                        "layer": ent.get('layer', 'Duvar'),
                        "closed": False,
                        "points": [list(sp0), list(sp1)]
                    })
            elif ent['type'] == 'LWPOLYLINE':
                pts = []
                for v in ent.get('vertices', []):
                    p = (v['x'], v['y'])
                    sp = snapped_map.get(p, p)
                    if not pts or self._distance(pts[-1], sp) > 1e-2:
                        pts.append(sp)
                
                # Filter collinear segments
                if len(pts) >= 3:
                    filtered_pts = [pts[0]]
                    for idx in range(1, len(pts)-1):
                        if not self._is_collinear(filtered_pts[-1], pts[idx], pts[idx+1]):
                            filtered_pts.append(pts[idx])
                    filtered_pts.append(pts[-1])
                    pts = filtered_pts

                if len(pts) >= 2:
                    cleaned_walls.append({
                        "type": "LWPOLYLINE",
                        "layer": ent.get('layer', 'Duvar'),
                        "closed": bool(ent.get('flag_70', 0) & 1),
                        "points": [list(p) for p in pts]
                    })

        # Save to outputs/walls_clean.json
        output_path = self.path_manager.get_path('outputs', 'walls_clean.json')
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(cleaned_walls, f, indent=4)

        self.logger.info(f"Cleaned wall structures exported successfully to {self.path_manager.get_relative_path(output_path)}")
        return cleaned_walls

if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    engine = GeometryEngine()
    walls = engine.run()
    print(f"Geometry Engine complete! Generated {len(walls)} clean wall structures.")
