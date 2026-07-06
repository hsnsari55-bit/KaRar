import json
import math
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
from shapely.geometry import LineString, Polygon
from shapely.ops import polygonize

# Cross-platform path handling
def get_project_path() -> Path:
    return Path(__file__).parent.parent

class RoomDetectorEngine:
    """Production-ready Room Detection Engine"""
    
    def __init__(self, 
                 walls_input: str = "outputs/walls_normalized.json",
                 rooms_output: str = "outputs/rooms.json", 
                 report_output: str = "outputs/room_report.json"):
        """
        Initialize the Room Detection Engine.
        
        Args:
            walls_input: Path to normalized walls JSON file (relative to project root)
            rooms_output: Path for rooms output JSON file
            report_output: Path for room report JSON file
        """
        self.project_path = get_project_path()
        self.walls_input = walls_input
        self.rooms_output = rooms_output
        self.report_output = report_output
        
    def load_walls(self) -> List[Dict[str, Any]]:
        """Load normalized walls from JSON file."""
        walls_path = self.project_path / self.walls_input
        with open(walls_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    
    def prepare_wall_lines(self, walls: List[Dict[str, Any]]) -> Tuple[List[LineString], Dict[Tuple[Tuple[float, float], Tuple[float, float]], str]]:
        """
        Convert walls to LineString objects and create lookup for boundary matching.
        
        Returns:
            lines: List of LineString objects representing walls
            wall_lookup: Dictionary mapping (start, end) coordinate tuples to wall IDs
        """
        lines = []
        wall_lookup = {}
        
        for wall in walls:
            if wall.get("type") != "LINE":
                continue
                
            start = tuple(wall["start"])
            end = tuple(wall["end"])
            wall_id = wall.get("id", "")
            
            # Create LineString
            line = LineString([start, end])
            lines.append(line)
            
            # Create bidirectional lookup
            wall_lookup[(start, end)] = wall_id
            wall_lookup[(end, start)] = wall_id
            
        return lines, wall_lookup
    
    def detect_rooms(self) -> List[Dict[str, Any]]:
        """
        Detect enclosed rooms using wall topology.
        
        Returns:
            List of room dictionaries with boundary, area, centroid, wall_ids, and confidence
        """
        # Load and prepare walls
        walls = self.load_walls()
        lines, wall_lookup = self.prepare_wall_lines(walls)
        
        # Generate polygons from line arrangement
        polygons = list(polygonize(lines))
        rooms = []
        
        for i, poly in enumerate(polygons):
            # Calculate geometric properties
            area = poly.area
            perimeter = poly.length
            centroid = poly.centroid
            
            # Get boundary coordinates
            polygon_coords = list(poly.exterior.coords)
            
            # Associate wall IDs with this room's boundary
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
            
            # Calculate confidence score (circularity-based)
            # Perfect circle has circularity = 1, other shapes < 1
            # Using (4 * pi * area) / (perimeter^2) as confidence metric
            if perimeter > 0:
                circularity = (4 * math.pi * area) / (perimeter * perimeter)
                # Normalize to [0,1] range (circularity is already in this range)
                confidence_score = round(circularity, 3)
            else:
                confidence_score = 0.0
            
            # Create room representation
            room = {
                'id': f'room_{i+1}',
                'wall_ids': unique_wall_ids,
                'polygon': polygon_coords,
                'area': round(area, 2),
                'perimeter': round(perimeter, 2),
                'centroid': [round(centroid.x, 2), round(centroid.y, 2)],
                'confidence_score': confidence_score
            }
            rooms.append(room)
        
        return rooms
    
    def generate_report(self, rooms: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Generate comprehensive room report with statistics.
        
        Args:
            rooms: List of detected room dictionaries
            
        Returns:
            Report dictionary with aggregated statistics
        """
        if not rooms:
            return {
                'total_rooms': 0,
                'room_areas': [],
                'largest_room': None,
                'smallest_room': None,
                'average_area': 0.0,
                'confidence_stats': {
                    'mean': 0.0,
                    'min': 0.0,
                    'max': 0.0,
                    'std': 0.0
                }
            }
        
        # Extract areas for statistics
        areas = [room['area'] for room in rooms]
        total_rooms = len(rooms)
        
        # Calculate area statistics
        largest_room = max(rooms, key=lambda x: x['area'])
        smallest_room = min(rooms, key=lambda x: x['area'])
        average_area = sum(areas) / total_rooms
        
        # Calculate confidence statistics
        confidences = [room['confidence_score'] for room in rooms]
        conf_mean = sum(confidences) / total_rooms
        conf_min = min(confidences)
        conf_max = max(confidences)
        conf_std = math.sqrt(sum((c - conf_mean) ** 2 for c in confidences) / total_rooms) if total_rooms > 0 else 0.0
        
        # Build report
        report = {
            'total_rooms': total_rooms,
            'room_areas': areas,
            'largest_room': largest_room,
            'smallest_room': smallest_room,
            'average_area': round(average_area, 2),
            'confidence_stats': {
                'mean': round(conf_mean, 3),
                'min': round(conf_min, 3),
                'max': round(conf_max, 3),
                'std': round(conf_std, 3)
            }
        }
        
        return report
    
    def export_rooms(self, rooms: List[Dict[str, Any]]) -> None:
        """Export detected rooms to JSON file."""
        output_path = self.project_path / self.rooms_output
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(rooms, f, indent=2)
        print(f"Rooms exported to {output_path}")
    
    def export_report(self, report: Dict[str, Any]) -> None:
        """Export room report to JSON file."""
        output_path = self.project_path / self.report_output
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2)
        print(f"Report exported to {output_path}")
    
    def run_detection(self) -> None:
        """
        Execute the complete room detection pipeline.
        """
        print("Starting Room Detection Engine...")
        
        # Detect rooms
        rooms = self.detect_rooms()
        print(f"Detected {len(rooms)} rooms")
        
        # Export rooms data
        self.export_rooms(rooms)
        
        # Generate and export report
        report = self.generate_report(rooms)
        self.export_report(report)
        
        print("Room Detection Engine completed successfully")
        return rooms, report

if __name__ == "__main__":
    # Execute detection pipeline
    engine = RoomDetectorEngine()
    engine.run_detection()