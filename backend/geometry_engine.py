import ezdxf

class GeometryEngine:
    def __init__(self):
        pass
    
    def read_dxf(self, file_path: str) -> None:
        self.doc = ezdxf.readfile(file_path)
        self.modelspace = self.doc.modelspace()
    
    def classify_entities(self) -> dict:
        classified_entities = {'LINE': [], 'LWPOLYLINE': []}
        
        for entity in self.modelspace:
            if entity.dxftype() == 'LINE':
                classified_entities['LINE'].append(entity)
                
            elif entity.dxftype() == 'LWPOLYLINE':
                classified_entities['LWPOLYLINE'].append(entity)
            
        return classified_entities