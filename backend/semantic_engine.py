import os
import json
import logging
import math
from typing import List, Dict, Any, Tuple
from backend.path_manager import PathManager
from backend.config import ConfigManager

class SemanticEngine:
    """
    Semantic Engine (Step 4 of the KaRar Pipeline).
    Reads geometry_graph.json and dxf_raw.json, maps topological lines back into classified 
    BIM elements (WALL, COLUMN, DOOR, WINDOW), performs smart classification (Internal vs External walls),
    and saves outputs/bim_clean.json.
    """

    def __init__(self):
        self.path_manager = PathManager()
        self.config = ConfigManager()
        self.logger = logging.getLogger('KaRar')

    def _distance(self, p1: Tuple[float, float], p2: Tuple[float, float]) -> float:
        return math.sqrt((p1[0] - p2[0])**2 + (p1[1] - p2[1])**2)

    def run(self) -> List[Dict[str, Any]]:
        """
        Executes semantic analysis.
        Produces outputs/bim_clean.json.
        """
        graph_path = self.path_manager.get_path('outputs', 'geometry_graph.json')
        raw_path = self.path_manager.get_path('outputs', 'dxf_raw.json')
        
        if not os.path.exists(graph_path):
            self.logger.warning("geometry_graph.json not found. Running TopologyEngine fallback...")
            from backend.topology_engine import TopologyEngine
            engine = TopologyEngine()
            graph_data = engine.run()
        else:
            with open(graph_path, 'r', encoding='utf-8') as f:
                graph_data = json.load(f)

        if not os.path.exists(raw_path):
            self.logger.warning("dxf_raw.json not found. Running DXFParser fallback...")
            from backend.dxf_parser import DXFParser
            parser = DXFParser()
            raw_data = parser.parse('test_plan.dxf')
        else:
            with open(raw_path, 'r', encoding='utf-8') as f:
                raw_data = json.load(f)

        self.logger.info("Executing architectural classification and semantic categorization...")

        nodes = graph_data.get('nodes', [])
        edges = graph_data.get('edges', [])
        raw_entities = raw_data.get('entities', [])

        # Create lookup for nodes
        node_lookup = {n['id']: n for n in nodes}

        bim_elements: List[Dict[str, Any]] = []

        # 1. PROCESS WALLS FROM TOPOLOGY GRAPH
        # Categorize: If a wall segment is on the boundary or has thickness, label external vs internal
        # For simplicity in this step, let's look at the wall length or node coordinates to classify
        # Let's say walls near the boundary are "EXTERNAL", others are "INTERNAL"
        min_x = min(n['x'] for n in nodes) if nodes else 0.0
        max_x = max(n['x'] for n in nodes) if nodes else 1000.0
        min_y = min(n['y'] for n in nodes) if nodes else 0.0
        max_y = max(n['y'] for n in nodes) if nodes else 1000.0
        
        x_span = max_x - min_x if max_x != min_x else 1.0
        y_span = max_y - min_y if max_y != min_y else 1.0

        for edge in edges:
            n0 = node_lookup.get(edge['from'])
            n1 = node_lookup.get(edge['to'])
            if not n0 or not n1:
                continue

            p0 = (n0['x'], n0['y'])
            p1 = (n1['x'], n1['y'])

            # If either end is close to bounding box outer edges, classify as External Wall
            is_external = False
            margin_x = x_span * 0.1
            margin_y = y_span * 0.1
            
            if (abs(p0[0] - min_x) < margin_x or abs(p0[0] - max_x) < margin_x or
                abs(p0[1] - min_y) < margin_y or abs(p0[1] - max_y) < margin_y or
                abs(p1[0] - min_x) < margin_x or abs(p1[0] - max_x) < margin_x or
                abs(p1[1] - min_y) < margin_y or abs(p1[1] - max_y) < margin_y):
                is_external = True

            wall_thickness = self.config.get("defaults.external_wall_thickness", 0.25) if is_external else self.config.get("defaults.internal_wall_thickness", 0.15)

            bim_elements.append({
                "category": "WALL",
                "wall_id": edge['wall_id'],
                "type": "External Wall" if is_external else "Partition Wall",
                "points": [list(p0), list(p1)],
                "thickness": wall_thickness * 1000.0, # converted to mm
                "angle": edge['angle']
            })

        # 2. PROCESS COLUMNS, DOORS, WINDOWS FROM RAW ENTITIES
        for ent in raw_entities:
            etype = ent['type']
            layer = ent.get('layer', '').lower()
            
            # Match columns
            if etype in ['LWPOLYLINE', 'LINE'] and ('kolon' in layer or 'column' in layer):
                pts = ent.get('vertices', []) if etype == 'LWPOLYLINE' else [ent['start'], ent['end']]
                pts_list = [[p['x'], p['y']] for p in pts if 'x' in p]
                if pts_list:
                    bim_elements.append({
                        "category": "COLUMN",
                        "layer": ent.get('layer', 'Kolon'),
                        "points": pts_list,
                        "closed": etype == 'LWPOLYLINE'
                    })
                    
            # Match doors
            elif etype == 'LINE' and ('kap' in layer or 'door' in layer):
                bim_elements.append({
                    "category": "DOOR",
                    "layer": ent.get('layer', 'Kapı'),
                    "points": [[ent['start']['x'], ent['start']['y']], [ent['end']['x'], ent['end']['y']]],
                    "width": self._distance((ent['start']['x'], ent['start']['y']), (ent['end']['x'], ent['end']['y']))
                })
                
            # Match windows
            elif etype == 'LINE' and ('pencere' in layer or 'window' in layer):
                bim_elements.append({
                    "category": "WINDOW",
                    "layer": ent.get('layer', 'Pencere'),
                    "points": [[ent['start']['x'], ent['start']['y']], [ent['end']['x'], ent['end']['y']]],
                    "width": self._distance((ent['start']['x'], ent['start']['y']), (ent['end']['x'], ent['end']['y']))
                })

        # Save to outputs/bim_clean.json
        output_path = self.path_manager.get_path('outputs', 'bim_clean.json')
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(bim_elements, f, indent=4)

        self.logger.info(f"Successfully classified {len(bim_elements)} BIM elements (WALL, COLUMN, DOOR, WINDOW). Saved in {self.path_manager.get_relative_path(output_path)}")
        return bim_elements

if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    engine = SemanticEngine()
    elements = engine.run()
    print(f"Semantic Engine complete! Generated {len(elements)} high-fidelity BIM elements.")
