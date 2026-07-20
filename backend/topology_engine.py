import os
import json
import logging
import math
from typing import List, Dict, Any, Tuple
from backend.path_manager import PathManager
from backend.config import ConfigManager

class TopologyEngine:
    """
    Topology Engine (Step 3 of the KaRar Pipeline).
    Reads outputs/walls_clean.json, maps wall lines into a mathematical Graph (Nodes & Edges),
    calculates degrees of connection, wall angles, and saves outputs/geometry_graph.json.
    """

    def __init__(self):
        self.path_manager = PathManager()
        self.config = ConfigManager()
        self.logger = logging.getLogger('KaRar')

    def _distance(self, p1: Tuple[float, float], p2: Tuple[float, float]) -> float:
        return math.sqrt((p1[0] - p2[0])**2 + (p1[1] - p2[1])**2)

    def _calculate_angle(self, p1: Tuple[float, float], p2: Tuple[float, float]) -> float:
        """Calculates the orientation angle of a wall segment in degrees (0 to 180)."""
        dx = p2[0] - p1[0]
        dy = p2[1] - p1[1]
        angle = math.degrees(math.atan2(dy, dx))
        if angle < 0:
            angle += 180.0
        # Round to nearest 5 degrees for clean alignment representation
        return round(angle / 5.0) * 5.0

    def run(self) -> Dict[str, Any]:
        """
        Executes the topology graph generation.
        Produces outputs/geometry_graph.json.
        """
        walls_path = self.path_manager.get_path('outputs', 'walls_clean.json')
        if not os.path.exists(walls_path):
            self.logger.warning("walls_clean.json not found. Running GeometryEngine fallback...")
            from backend.geometry_engine import GeometryEngine
            engine = GeometryEngine()
            walls_data = engine.run()
        else:
            with open(walls_path, 'r', encoding='utf-8') as f:
                walls_data = json.load(f)

        self.logger.info(f"Loaded {len(walls_data)} clean wall segments. Reconstructing topological network...")

        # Extract unique nodes
        node_coords: List[Tuple[float, float]] = []
        node_map: Dict[Tuple[float, float], int] = {}
        
        # Helper to register node
        def get_node_id(p: Tuple[float, float]) -> int:
            # Check for existing node within tiny tolerance
            for existing_p in node_coords:
                if self._distance(p, existing_p) < 0.1:
                    return node_map[existing_p]
            
            node_id = len(node_coords)
            node_coords.append(p)
            node_map[p] = node_id
            return node_id

        edges: List[Dict[str, Any]] = []
        node_degrees: Dict[int, int] = {}

        # Process each wall polyline segment by segment
        wall_id_counter = 0
        for ent in walls_data:
            pts = ent.get('points', [])
            if len(pts) < 2:
                continue
                
            # Connect sequential points in polyline
            for idx in range(len(pts) - 1):
                p0 = tuple(pts[idx])
                p1 = tuple(pts[idx+1])
                
                # Filter zero-length edge segments
                if self._distance(p0, p1) < 0.1:
                    continue
                    
                node_id0 = get_node_id(p0)
                node_id1 = get_node_id(p1)
                
                # Increment degrees of connectivity
                node_degrees[node_id0] = node_degrees.get(node_id0, 0) + 1
                node_degrees[node_id1] = node_degrees.get(node_id1, 0) + 1
                
                # Determine angle
                angle = self._calculate_angle(p0, p1)
                
                edges.append({
                    "wall_id": wall_id_counter,
                    "from": node_id0,
                    "to": node_id1,
                    "angle": angle
                })
                wall_id_counter += 1

        # Format node structures
        nodes = []
        for idx, coord in enumerate(node_coords):
            nodes.append({
                "id": idx,
                "x": coord[0],
                "y": coord[1],
                "degree": node_degrees.get(idx, 0)
            })

        graph_payload = {
            "nodes": nodes,
            "edges": edges
        }

        # Save to outputs/geometry_graph.json
        output_path = self.path_manager.get_path('outputs', 'geometry_graph.json')
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(graph_payload, f, indent=4)

        self.logger.info(f"Topological network containing {len(nodes)} nodes and {len(edges)} wall edges built successfully in {self.path_manager.get_relative_path(output_path)}")
        return graph_payload

if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    engine = TopologyEngine()
    graph = engine.run()
    print(f"Topology Engine complete! Extracted {len(graph['nodes'])} nodes and {len(graph['edges'])} edges.")
