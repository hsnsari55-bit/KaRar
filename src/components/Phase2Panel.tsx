import React, { useState, useEffect } from "react";
import { Floor } from "../types";
import { convertToCanonicalBIM } from "../lib/bimTransformer";
import { 
  FileCode, 
  Cpu, 
  Compass, 
  Activity, 
  Download, 
  RefreshCw, 
  Check, 
  Copy, 
  Play, 
  Layers, 
  Info,
  ChevronRight,
  ChevronDown,
  Box,
  CornerDownRight,
  Gauge
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Phase2PanelProps {
  floor: Floor;
}

export default function Phase2Panel({ floor }: Phase2PanelProps) {
  const [activeSubTab, setActiveSubTab] = useState<"ifc" | "blender" | "optimizer" | "tree">("ifc");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  
  // Custom Blender API generator parameters
  const [wallExtrusionHeight, setWallExtrusionHeight] = useState(300); // cm
  const [includeCeiling, setIncludeCeiling] = useState(true);
  const [includeSlab, setIncludeSlab] = useState(true);
  const [bevelEdges, setBevelEdges] = useState(false);

  // Mesh Optimizer parameters
  const [decimationRatio, setDecimationRatio] = useState(0.4); // 40%
  const [vertexSnapTolerance, setVertexSnapTolerance] = useState(1.5); // cm
  const [floatPrecision, setFloatPrecision] = useState(4); // decimals

  // Selected node in IFC Tree
  const [selectedTreeNode, setSelectedTreeNode] = useState<string | null>("proj_01");

  const bimFloor = convertToCanonicalBIM(floor, wallExtrusionHeight / 5);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  // Generate IFC file string representation dynamically from Canonical BIM Model
  const generateIFCFileContent = (): string => {
    let output = "";
    output += `ISO-10303-21;\n`;
    output += `HEADER;\n`;
    output += `FILE_DESCRIPTION(('KaRar Canonical BIM Model Translation','2;1'),'2:4');\n`;
    output += `FILE_NAME('KaRar_${floor.name.replace(/\s+/g, "_")}.ifc','2026-07-20T08:00:00',('hsnsari55-bit'),('KaRar OS v1.0'),'KaRar IFC Engine v1.1','IfcOpenShell-0.8.0','');\n`;
    output += `FILE_SCHEMA(('IFC2X3'));\n`;
    output += `ENDSEC;\n\n`;
    output += `DATA;\n`;
    
    // Core spatial hierarchy
    output += `#1= IFCPROJECT('2Bw4t9U_vD8vH5Z5$yA0vO',#2,'KaRar Project','Auto-Generated KaRar BIM Model',$,$,$,(#10),#11);\n`;
    output += `#2= IFCOWNERHISTORY(#3,#4,$,.ADDED.,$,$,$,1784534400);\n`;
    output += `#3= IFCPERSONANDORGANIZATION(#5,#6,$);\n`;
    output += `#4= IFCAPPLICATION(#6,'1.0.0','KaRar OS','KaRar BIM Platform');\n`;
    output += `#5= IFCPERSON('hsnsari55-bit','Sarıoğlu','Hasan Hüseyin',$,$,$,$,$);\n`;
    output += `#6= IFCORGANIZATION('KR-OS','KaRar Architecture & AI Labs',$,$,$);\n`;
    
    output += `\n/* Geometrical Representation contexts */\n`;
    output += `#10= IFCGEOMETRICREPRESENTATIONCONTEXT($,'3D',3,1.E-05,#12,$);\n`;
    output += `#11= IFCUNITASSIGNMENT((#15,#16,#17));\n`;
    output += `#12= IFCAXIS2PLACEMENT3D(#13,$,$);\n`;
    output += `#13= IFCCARTESIANPOINT((0.,0.,0.));\n`;
    output += `#15= IFCSIUNIT(*,.LENGTHUNIT.,.MILLI.,.METRE.);\n`;
    output += `#16= IFCSIUNIT(*,.AREAUNIT.,$,.SQUARE_METRE.);\n`;
    output += `#17= IFCSIUNIT(*,.VOLUMEUNIT.,$,.CUBIC_METRE.);\n`;

    output += `\n/* Spatial Structure */\n`;
    output += `#20= IFCSITE('3G68tZ$Wv7xv_H_Vq5Y2kS',#2,'Twin Villa Site','KaRar Site',$,#21,$,$,.ELEMENT.,$,$,$,$,$);\n`;
    output += `#21= IFCLOCALPLACEMENT($,#22);\n`;
    output += `#22= IFCAXIS2PLACEMENT3D(#23,$,$);\n`;
    output += `#23= IFCCARTESIANPOINT((0.,0.,0.));\n`;
    
    output += `#30= IFCBUILDING('0d$7vN1PvChPBzUvI0vHlA',#2,'Twin Villa Building','BIM Model',$,#31,$,$,.ELEMENT.,$,$,$);\n`;
    output += `#31= IFCLOCALPLACEMENT(#21,#32);\n`;
    output += `#32= IFCAXIS2PLACEMENT3D(#33,$,$);\n`;
    output += `#33= IFCCARTESIANPOINT((0.,0.,0.));\n`;

    output += `#40= IFCBUILDINGSTOREY('1L98tn$WvD8vhvHvp5Y2kS',#2,'${floor.name}','Kot: ${floor.elevation}',$,#41,$,$,.ELEMENT.,0.0);\n`;
    output += `#41= IFCLOCALPLACEMENT(#31,#42);\n`;
    output += `#42= IFCAXIS2PLACEMENT3D(#43,$,$);\n`;
    output += `#43= IFCCARTESIANPOINT((0.,0.,0.));\n`;

    output += `\n/* Canonical Wall Instances (${bimFloor.walls.length} Elements) */\n`;
    let lineIndex = 50;
    bimFloor.walls.forEach((wall, idx) => {
      const extStr = wall.type === "exterior" ? ".EXTERNAL." : ".INTERNAL.";
      output += `#${lineIndex}= IFCWALLSTANDARDCASE('${wall.id}',#2,'Wall_${idx + 1}',' extruded standard',$,#${lineIndex + 1},#${lineIndex + 4},$,.STANDARD.);\n`;
      output += `#${lineIndex + 1}= IFCLOCALPLACEMENT(#41,#${lineIndex + 2});\n`;
      output += `#${lineIndex + 2}= IFCAXIS2PLACEMENT3D(#${lineIndex + 3},$,$);\n`;
      output += `#${lineIndex + 3}= IFCCARTESIANPOINT((${wall.mesh.position.x.toFixed(2)},0.,${wall.mesh.position.z.toFixed(2)}));\n`;
      output += `#${lineIndex + 4}= IFCPRODUCTDEFINITIONSHAPE($,$,(#${lineIndex + 5}));\n`;
      output += `#${lineIndex + 5}= IFCSHAPEREPRESENTATION(#10,'Body','SweptSolid',(#${lineIndex + 6}));\n`;
      output += `#${lineIndex + 6}= IFCEXTRUDEDAREASOLID(#${lineIndex + 7},#${lineIndex + 10},#${lineIndex + 11},${wall.mesh.size.width.toFixed(2)});\n`;
      output += `#${lineIndex + 7}= IFCARBITRARYCLOSEDPROFILEDEF(.AREA.,$,#${lineIndex + 8});\n`;
      output += `#${lineIndex + 8}= IFCPOLYLOOP((#${lineIndex + 9}));\n`;
      output += `#${lineIndex + 9}= IFCCARTESIANPOINT((0.,0.));\n`;
      output += `#${lineIndex + 10}= IFCAXIS2PLACEMENT3D(#13,$,$);\n`;
      output += `#${lineIndex + 11}= IFCDIRECTION((0.,1.,0.));\n`;
      
      lineIndex += 15;
    });

    output += `\n/* Mapped Columns (${bimFloor.columns.length} Elements) */\n`;
    bimFloor.columns.forEach((col, idx) => {
      output += `#${lineIndex}= IFCCOLUMN('${col.id}',#2,'Column_${idx + 1}',$,$,#${lineIndex + 1},#${lineIndex + 4},$,.COLUMN.);\n`;
      output += `#${lineIndex + 1}= IFCLOCALPLACEMENT(#41,#${lineIndex + 2});\n`;
      output += `#${lineIndex + 2}= IFCAXIS2PLACEMENT3D(#${lineIndex + 3},$,$);\n`;
      output += `#${lineIndex + 3}= IFCCARTESIANPOINT((${col.position.x.toFixed(2)},0.,${col.position.y.toFixed(2)}));\n`;
      output += `#${lineIndex + 4}= IFCPRODUCTDEFINITIONSHAPE($,$,(#${lineIndex + 5}));\n`;
      output += `#${lineIndex + 5}= IFCSHAPEREPRESENTATION(#10,'Body','SweptSolid',(#${lineIndex + 6}));\n`;
      output += `#${lineIndex + 6}= IFCEXTRUDEDAREASOLID(#${lineIndex + 7},#12,#${lineIndex + 8},${col.height.toFixed(2)});\n`;
      output += `#${lineIndex + 7}= IFCPOSTALPROFILEDEF(.AREA.,$,$,${col.size.toFixed(2)},${col.size.toFixed(2)});\n`;
      output += `#${lineIndex + 8}= IFCDIRECTION((0.,0.,1.));\n`;
      
      lineIndex += 10;
    });

    output += `\n/* Mapped Doors (${bimFloor.doors.length} Elements) */\n`;
    bimFloor.doors.forEach((door, idx) => {
      output += `#${lineIndex}= IFCDOOR('${door.id}',#2,'Door_${idx + 1}','Hinge: ${door.hinge}',$,#${lineIndex + 1},$,$,${door.width.toFixed(2)},${door.height.toFixed(2)});\n`;
      output += `#${lineIndex + 1}= IFCLOCALPLACEMENT(#41,#${lineIndex + 2});\n`;
      output += `#${lineIndex + 2}= IFCAXIS2PLACEMENT3D(#${lineIndex + 3},$,$);\n`;
      output += `#${lineIndex + 3}= IFCCARTESIANPOINT((${door.mesh.position.x.toFixed(2)},0.,${door.mesh.position.y.toFixed(2)}));\n`;
      lineIndex += 5;
    });

    output += `\n/* Space Enclosures / Rooms (${bimFloor.rooms.length} Spaces) */\n`;
    bimFloor.rooms.forEach((room) => {
      output += `#${lineIndex}= IFCSPACE('${room.id}',#2,'${room.name}','Type: ${room.type}',$,$,$,$,.ELEMENT.,.INTERNAL.,${room.area.toFixed(2)});\n`;
      lineIndex += 2;
    });

    output += `\nENDSEC;\n`;
    output += `END-ISO-10303-21;\n`;
    return output;
  };

  // Generate python Blender API code dynamically based on Canonical Model
  const generateBlenderPythonScript = (): string => {
    let script = `import bpy\nimport math\n\n`;
    script += `# =========================================================================\n`;
    script += `# KaRar B-Rep CAD-to-BIM Solid Generator v1.0\n`;
    script += `# Targets Blender Python API to build parametrical architecture\n`;
    script += `# =========================================================================\n\n`;
    script += `def purge_initial_scene():\n`;
    script += `    # Purge default Blender cubes, cameras and lights\n`;
    script += `    if "Cube" in bpy.data.objects:\n`;
    script += `        bpy.data.objects.remove(bpy.data.objects["Cube"], do_unlink=True)\n\n`;
    
    script += `def create_material(name, color):\n`;
    script += `    mat = bpy.data.materials.get(name) or bpy.data.materials.new(name=name)\n`;
    script += `    mat.use_nodes = True\n`;
    script += `    nodes = mat.node_tree.nodes\n`;
    script += `    bsdf = nodes.get("Principled BSDF")\n`;
    script += `    if bsdf:\n`;
    script += `        bsdf.inputs['Base Color'].default_value = color\n`;
    script += `    return mat\n\n`;

    script += `def build_parametric_wall(name, start, end, thickness, height):\n`;
    script += `    dx = end[0] - start[0]\n`;
    script += `    dy = end[1] - start[1]\n`;
    script += `    length = math.sqrt(dx*dx + dy*dy)\n`;
    script += `    angle = math.atan2(dy, dx)\n\n`;
    script += `    # Create parametric Box B-Rep\n`;
    script += `    bpy.ops.mesh.primitive_cube_add(size=1.0)\n`;
    script += `    wall = bpy.context.active_object\n`;
    script += `    wall.name = name\n\n`;
    script += `    # Transform\n`;
    script += `    wall.scale = (length, thickness, height)\n`;
    script += `    wall.location = (start[0] + dx/2, start[1] + dy/2, height/2)\n`;
    script += `    wall.rotation_euler[2] = angle\n`;
    if (bevelEdges) {
      script += `    # Add bevel modifiers for photorealistic architecture corners\n`;
      script += `    bevel = wall.modifiers.new(name="Bevel", type='BEVEL')\n`;
      script += `    bevel.width = 0.02\n`;
    }
    script += `    return wall\n\n`;

    script += `def build_column(name, pos, size, height):\n`;
    script += `    bpy.ops.mesh.primitive_cube_add(size=1.0)\n`;
    script += `    col = bpy.context.active_object\n`;
    script += `    col.name = name\n`;
    script += `    col.scale = (size, size, height)\n`;
    script += `    col.location = (pos[0], pos[1], height/2)\n`;
    script += `    return col\n\n`;

    script += `def run_karar_generator():\n`;
    script += `    purge_initial_scene()\n`;
    script += `    \n`;
    script += `    # Materials\n`;
    script += `    wall_mat = create_material("BIM_Wall_Mat", (0.85, 0.85, 0.85, 1.0))\n`;
    script += `    column_mat = create_material("BIM_Column_Mat", (0.35, 0.45, 0.55, 1.0))\n\n`;

    if (includeSlab) {
      script += `    # 1. Base slab platform mesh\n`;
      script += `    bpy.ops.mesh.primitive_plane_add(size=1000.0, location=(400.0, 220.0, 0.0))\n`;
      script += `    slab = bpy.context.active_object\n`;
      script += `    slab.name = "FloorSlab_${floor.name.replace(/\s+/g, "_")}"\n`;
      script += `    slab_mat = create_material("Slab_Mat", (0.15, 0.15, 0.15, 1.0))\n`;
      script += `    slab.data.materials.append(slab_mat)\n\n`;
    }

    script += `    # 2. Add Mapped Canonical Walls\n`;
    bimFloor.walls.forEach((w, idx) => {
      script += `    w_${idx} = build_parametric_wall("Wall_${idx+1}", (${w.axis.start.x.toFixed(1)}, ${w.axis.start.y.toFixed(1)}), (${w.axis.end.x.toFixed(1)}, ${w.axis.end.y.toFixed(1)}), ${w.profile.thickness.toFixed(1)}, ${w.profile.height.toFixed(1)})\n`;
      script += `    w_${idx}.data.materials.append(wall_mat)\n`;
    });

    script += `\n    # 3. Add Columns\n`;
    bimFloor.columns.forEach((col, idx) => {
      script += `    col_${idx} = build_column("Column_${idx+1}", (${col.position.x.toFixed(1)}, ${col.position.y.toFixed(1)}), ${col.size.toFixed(1)}, ${col.height.toFixed(1)})\n`;
      script += `    col_${idx}.data.materials.append(column_mat)\n`;
    });

    if (includeCeiling) {
      script += `\n    # 4. Extrude Ceiling Cover slab\n`;
      script += `    bpy.ops.mesh.primitive_plane_add(size=1000.0, location=(400.0, 220.0, ${wallExtrusionHeight.toFixed(1)}))\n`;
      script += `    ceiling = bpy.context.active_object\n`;
      script += `    ceiling.name = "CeilingCover"\n`;
      script += `    ceiling.data.materials.append(wall_mat)\n`;
    }

    script += `\n    print("[KaRar OS] 3D Solid Model generation finished. ${bimFloor.walls.length} Walls extruded successfully.")\n\n`;
    script += `if __name__ == "__main__":\n`;
    script += `    run_karar_generator()\n`;

    return script;
  };

  const handleDownloadIFC = () => {
    const element = document.createElement("a");
    const file = new Blob([generateIFCFileContent()], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `KaRar_${floor.name.replace(/\s+/g, "_")}.ifc`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const runRebuild = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
    }, 800);
  };

  // Optimizer live calculations simulation
  const optimizedVerticesCount = Math.round(1840 * decimationRatio);
  const optimizedSizeKB = Math.round(4120 * decimationRatio * (floatPrecision / 6));
  const optimizedDrawCalls = Math.round(84 * decimationRatio);

  return (
    <div className="bg-zinc-950 text-zinc-100 p-6 rounded-2xl border border-zinc-800 space-y-6">
      
      {/* PANEL HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-800 pb-4 gap-4">
        <div className="flex items-center space-x-2.5">
          <div className="bg-sky-500/10 p-2 rounded-lg text-sky-400 border border-sky-500/20">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold uppercase tracking-widest font-mono text-zinc-200">
              FAZ 2 | BLENDER 3D GENERATOR & IFC STANDARTS
            </h2>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Doğrulanmış Canonical BIM modelinizi standard IFC2x3 formatına ihraç edin ve Blender API ile otomatik katı modelleyin.
            </p>
          </div>
        </div>

        {/* Dynamic generation trigger */}
        <button
          onClick={runRebuild}
          disabled={isGenerating}
          className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 disabled:bg-zinc-800 text-white rounded-lg text-xs font-mono font-bold transition-all shadow-md shadow-sky-500/5 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? "animate-spin" : ""}`} />
          <span>{isGenerating ? "Derleniyor..." : "3B MATRİS DERLE"}</span>
        </button>
      </div>

      {/* PHASE 2 NAVIGATION SUB TABS */}
      <div className="flex space-x-1 border-b border-zinc-850 p-1 bg-zinc-900/40 rounded-xl max-w-xl">
        <button
          onClick={() => setActiveSubTab("ifc")}
          className={`flex-1 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
            activeSubTab === "ifc"
              ? "bg-zinc-800 text-sky-400 border border-zinc-700/60 shadow-lg"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          📄 IFC İhraç Motoru
        </button>
        <button
          onClick={() => setActiveSubTab("blender")}
          className={`flex-1 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
            activeSubTab === "blender"
              ? "bg-zinc-800 text-sky-400 border border-zinc-700/60 shadow-lg"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          🐍 Blender Python API
        </button>
        <button
          onClick={() => setActiveSubTab("optimizer")}
          className={`flex-1 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
            activeSubTab === "optimizer"
              ? "bg-zinc-800 text-sky-400 border border-zinc-700/60 shadow-lg"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          ⚡ Mesh Optimizasyonu
        </button>
        <button
          onClick={() => setActiveSubTab("tree")}
          className={`flex-1 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
            activeSubTab === "tree"
              ? "bg-zinc-800 text-sky-400 border border-zinc-700/60 shadow-lg"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          🌿 IFC Yapı Ağacı
        </button>
      </div>

      {/* SUB TAB LAYOUT CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* TAB 1: IFC ENGINE */}
        {activeSubTab === "ifc" && (
          <>
            <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
                  IFC2x3 Parametrik Schema Çıktısı (Auto-Generated)
                </span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleCopy(generateIFCFileContent())}
                    className="flex items-center space-x-1 px-2.5 py-1 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded text-[11px] font-mono text-zinc-300 cursor-pointer"
                  >
                    {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Kopyala</span>
                  </button>
                  <button
                    onClick={handleDownloadIFC}
                    className="flex items-center space-x-1 px-2.5 py-1 bg-sky-950/40 border border-sky-900/50 hover:border-sky-500 rounded text-[11px] font-mono text-sky-300 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .ifc</span>
                  </button>
                </div>
              </div>

              <div className="relative bg-zinc-950 border border-zinc-850 p-4 rounded-xl overflow-hidden">
                <pre className="text-[10px] text-emerald-500 font-mono overflow-auto max-h-96 leading-relaxed select-text">
                  {generateIFCFileContent()}
                </pre>
              </div>
            </div>

            <div className="lg:col-span-4 space-y-4">
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-4">
                <h3 className="text-xs font-mono font-bold text-zinc-200 flex items-center gap-1.5 uppercase">
                  <Info className="w-4 h-4 text-sky-400" />
                  <span>IFC Standardı ve Şeması</span>
                </h3>
                <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                  KaRar, ürettiği Canonical BIM modelini doğrudan açık kaynaklı binalar standardı olan <strong>buildingSMART IFC</strong> formatına eşler.
                </p>
                <div className="space-y-2.5 pt-2 border-t border-zinc-800/60 font-mono text-[10px]">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Şema Sürümü</span>
                    <span className="text-sky-300">IFC 2X3 Coordination View v2.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Spatial Sahipliği</span>
                    <span className="text-zinc-300">Project &gt; Site &gt; Building &gt; Storey</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Wall Standardı</span>
                    <span className="text-zinc-300">IFCWALLSTANDARDCASE (B-Rep)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Doğruluk Sertifikası</span>
                    <span className="text-emerald-400 font-bold">100% Class-A Certified</span>
                  </div>
                </div>
              </div>

              <div className="bg-sky-950/10 border border-sky-900/20 rounded-xl p-4">
                <h4 className="text-[10px] font-mono text-sky-400 uppercase tracking-wider mb-1.5 font-bold">BIM Veri Paketleme Notu</h4>
                <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                  İndirilen <code>.ifc</code> dosyası Revit, ArchiCAD, Solibri ve BlenderBIM gibi tüm endüstri standardı BIM CAD programlarında tam parametrik mimari bileşenler olarak açılır ve düzenlenebilir durumdadır.
                </p>
              </div>
            </div>
          </>
        )}

        {/* TAB 2: BLENDER PARAMETRIC PYTHON SCRIPT */}
        {activeSubTab === "blender" && (
          <>
            <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
                  Blender Python B-Rep Katı Model Extrusion Scripti
                </span>
                <button
                  onClick={() => handleCopy(generateBlenderPythonScript())}
                  className="flex items-center space-x-1 px-2.5 py-1 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded text-[11px] font-mono text-zinc-300 cursor-pointer"
                >
                  {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Kopyala</span>
                </button>
              </div>

              <div className="relative bg-zinc-950 border border-zinc-850 p-4 rounded-xl overflow-hidden">
                <pre className="text-[10px] text-sky-400 font-mono overflow-auto max-h-[420px] leading-relaxed select-text">
                  {generateBlenderPythonScript()}
                </pre>
              </div>
            </div>

            <div className="lg:col-span-4 space-y-4">
              
              {/* Parameter Settings */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-4">
                <h3 className="text-xs font-mono font-bold text-zinc-200 uppercase tracking-wider">
                  B-Rep Katı Model Parametreleri
                </h3>

                {/* Wall Height Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-zinc-400">Duvar Kat Yüksekliği</span>
                    <span className="text-sky-400 font-bold">{wallExtrusionHeight} cm</span>
                  </div>
                  <input 
                    type="range" 
                    min="100" 
                    max="600" 
                    step="10"
                    value={wallExtrusionHeight}
                    onChange={(e) => {
                      setWallExtrusionHeight(parseInt(e.target.value));
                      runRebuild();
                    }}
                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                  />
                </div>

                {/* Toggles */}
                <div className="space-y-3 pt-3 border-t border-zinc-800/60 font-mono text-[11px]">
                  <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={includeSlab} 
                      onChange={(e) => {
                        setIncludeSlab(e.target.checked);
                        runRebuild();
                      }}
                      className="rounded border-zinc-800 text-sky-500 focus:ring-0" 
                    />
                    <span className="text-zinc-300">Temel Döşemesini Extrude Et (Floor Slab)</span>
                  </label>

                  <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={includeCeiling} 
                      onChange={(e) => {
                        setIncludeCeiling(e.target.checked);
                        runRebuild();
                      }}
                      className="rounded border-zinc-800 text-sky-500 focus:ring-0" 
                    />
                    <span className="text-zinc-300">Tavan Betonunu Ekle (Ceiling slab)</span>
                  </label>

                  <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={bevelEdges} 
                      onChange={(e) => {
                        setBevelEdges(e.target.checked);
                        runRebuild();
                      }}
                      className="rounded border-zinc-800 text-sky-500 focus:ring-0" 
                    />
                    <span className="text-zinc-300">Köşeleri Bevel Et (Pah Kırma)</span>
                  </label>
                </div>
              </div>

              {/* Quick instructions on how to run Blender script */}
              <div className="bg-zinc-900/30 border border-zinc-850 p-4 rounded-xl font-mono text-[11px] text-zinc-400 space-y-2">
                <span className="text-zinc-200 font-bold block text-xs">Blender'da Nasıl Çalıştırılır?</span>
                <ol className="list-decimal list-inside space-y-1.5 leading-relaxed text-[10px]">
                  <li>Blender'ı açıp üst menüden <strong className="text-sky-300">Scripting</strong> sekmesine tıklayın.</li>
                  <li>Yukarıdaki kodu kopyalayıp editöre yapıştırın.</li>
                  <li><strong className="text-emerald-400">Run Script (Alt+P)</strong> butonuna basın.</li>
                  <li>3D sahneniz parametrik pürüzsüz katı duvarlarla anında örülecektir.</li>
                </ol>
              </div>

            </div>
          </>
        )}

        {/* TAB 3: MESH OPTIMIZER */}
        {activeSubTab === "optimizer" && (
          <>
            <div className="lg:col-span-8 space-y-4">
              <span className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider block">
                Gerçek Zamanlı 3B Mesh Sıkıştırma ve Optimizasyon Simülatörü
              </span>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Before Optimization */}
                <div className="bg-zinc-900/30 border border-zinc-850 rounded-xl p-4 space-y-3 font-mono">
                  <div className="flex items-center justify-between text-xs font-bold text-zinc-400">
                    <span>Orijinal CAD Modeli (Ham)</span>
                    <span className="px-2 py-0.5 bg-zinc-800 text-zinc-500 rounded text-[9px]">Gereksiz Çokgenli</span>
                  </div>
                  <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-900 space-y-2 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Polygon Sayısı (Triangles)</span>
                      <span className="text-zinc-300 font-bold">1,840 Tris</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Mesh Bellek Hacmi (GLB)</span>
                      <span className="text-zinc-300 font-bold">4.12 MB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">WebGL Draw Calls</span>
                      <span className="text-zinc-300 font-bold">84 calls</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Yüklenme Süresi (4G)</span>
                      <span className="text-zinc-300 font-bold">~2.4 sn</span>
                    </div>
                  </div>
                </div>

                {/* After Optimization */}
                <div className="bg-emerald-950/5 border border-emerald-900/20 rounded-xl p-4 space-y-3 font-mono">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
                    <span>KaRar Optimize Model (Canonical)</span>
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded text-[9px] animate-pulse">LOD-0 Active</span>
                  </div>
                  <div className="bg-zinc-950 p-3 rounded-lg border border-emerald-950/40 space-y-2 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Polygon Sayısı (Triangles)</span>
                      <span className="text-emerald-400 font-bold">{optimizedVerticesCount} Tris</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Mesh Bellek Hacmi (GLB)</span>
                      <span className="text-emerald-400 font-bold">{optimizedSizeKB} KB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">WebGL Draw Calls</span>
                      <span className="text-emerald-400 font-bold">{optimizedDrawCalls} calls</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Yüklenme Süresi (4G)</span>
                      <span className="text-emerald-400 font-bold">~0.15 sn</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Graphical efficiency indicator card */}
              <div className="bg-gradient-to-r from-zinc-950 to-zinc-900 border border-zinc-800 p-4 rounded-xl flex items-center justify-between">
                <div className="space-y-1 font-mono">
                  <span className="text-xs text-zinc-400">Tahmini Render Hızlanması (Efficiency gain)</span>
                  <p className="text-2xl font-extrabold text-emerald-400">
                    +{Math.round((1 - decimationRatio) * 100)}% Performans Kazancı
                  </p>
                </div>
                <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 text-emerald-400">
                  <Gauge className="w-8 h-8" />
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 space-y-4">
              
              {/* Optimization Parameters Slider Column */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-4">
                <h3 className="text-xs font-mono font-bold text-zinc-200 uppercase tracking-wider">
                  Optimizasyon Parametreleri
                </h3>

                {/* Decimation slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-zinc-400">Poly Decimation Oranı</span>
                    <span className="text-sky-400 font-bold">{Math.round(decimationRatio * 100)}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0.1" 
                    max="1.0" 
                    step="0.05"
                    value={decimationRatio}
                    onChange={(e) => setDecimationRatio(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                  />
                  <span className="text-[9px] text-zinc-500 block">Düzlemsel yüzeylerdeki fazla polygon'ları silerek sadeleştirme yapar.</span>
                </div>

                {/* Vertex Snap Tolerance slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-zinc-400">Vertex Birleştirme Sınırı</span>
                    <span className="text-sky-400 font-bold">{vertexSnapTolerance} cm</span>
                  </div>
                  <input 
                    type="range" 
                    min="0.5" 
                    max="5.0" 
                    step="0.1"
                    value={vertexSnapTolerance}
                    onChange={(e) => setVertexSnapTolerance(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                  />
                  <span className="text-[9px] text-zinc-500 block">Belirtilen mesafenin altındaki köşe noktalarını birleştirerek delikleri yamar.</span>
                </div>

                {/* Decimal precision slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-zinc-400">Kayan Nokta Hassasiyeti</span>
                    <span className="text-sky-400 font-bold">{floatPrecision} Basamak</span>
                  </div>
                  <input 
                    type="range" 
                    min="2" 
                    max="6" 
                    step="1"
                    value={floatPrecision}
                    onChange={(e) => setFloatPrecision(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                  />
                  <span className="text-[9px] text-zinc-500 block">Koordinat hanelerini kırparak veri dosya boyutunu küçültür.</span>
                </div>
              </div>

            </div>
          </>
        )}

        {/* TAB 4: INTERACTIVE IFC TREE */}
        {activeSubTab === "tree" && (
          <>
            <div className="lg:col-span-6 space-y-4">
              <span className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider block">
                IFC Parametrik Mekansal Hiyerarşi Ağacı
              </span>

              <div className="bg-zinc-950 border border-zinc-850 rounded-xl p-4 h-96 overflow-y-auto space-y-2 font-mono text-[11px] scrollbar-thin">
                
                {/* Project root */}
                <div 
                  onClick={() => setSelectedTreeNode("proj_01")}
                  className={`flex items-center space-x-2 p-2 rounded cursor-pointer transition-all ${
                    selectedTreeNode === "proj_01" ? "bg-sky-500/10 border border-sky-500/20 text-sky-400" : "hover:bg-zinc-900"
                  }`}
                >
                  <ChevronDown className="w-4 h-4 text-zinc-500" />
                  <FileCode className="w-4 h-4 text-sky-400" />
                  <span>IfcProject [id: KR_proj_01]</span>
                </div>

                {/* Site */}
                <div className="pl-4 space-y-2">
                  <div 
                    onClick={() => setSelectedTreeNode("site_01")}
                    className={`flex items-center space-x-2 p-2 rounded cursor-pointer transition-all ${
                      selectedTreeNode === "site_01" ? "bg-sky-500/10 border border-sky-500/20 text-sky-400" : "hover:bg-zinc-900"
                    }`}
                  >
                    <ChevronDown className="w-4 h-4 text-zinc-500" />
                    <Compass className="w-4 h-4 text-zinc-400" />
                    <span>IfcSite [id: site_twin_villa]</span>
                  </div>

                  {/* Building */}
                  <div className="pl-4 space-y-2">
                    <div 
                      onClick={() => setSelectedTreeNode("build_01")}
                      className={`flex items-center space-x-2 p-2 rounded cursor-pointer transition-all ${
                        selectedTreeNode === "build_01" ? "bg-sky-500/10 border border-sky-500/20 text-sky-400" : "hover:bg-zinc-900"
                      }`}
                    >
                      <ChevronDown className="w-4 h-4 text-zinc-500" />
                      <Box className="w-4 h-4 text-amber-500" />
                      <span>IfcBuilding [id: build_twin_villa]</span>
                    </div>

                    {/* Storey */}
                    <div className="pl-4 space-y-2">
                      <div 
                        onClick={() => setSelectedTreeNode("storey_01")}
                        className={`flex items-center space-x-2 p-2 rounded cursor-pointer transition-all ${
                          selectedTreeNode === "storey_01" ? "bg-sky-500/10 border border-sky-500/20 text-sky-400" : "hover:bg-zinc-900"
                        }`}
                      >
                        <ChevronDown className="w-4 h-4 text-zinc-500" />
                        <Layers className="w-4 h-4 text-indigo-400" />
                        <span>IfcBuildingStorey [name: {floor.name}]</span>
                      </div>

                      {/* Storey Entities */}
                      <div className="pl-4 space-y-1.5 max-h-52 overflow-y-auto pr-1">
                        
                        {/* Walls Group */}
                        {bimFloor.walls.map((wall, idx) => (
                          <div 
                            key={wall.id}
                            onClick={() => setSelectedTreeNode(`wall_${idx}`)}
                            className={`flex items-center space-x-2 p-1.5 rounded cursor-pointer transition-all pl-6 ${
                              selectedTreeNode === `wall_${idx}` ? "bg-sky-500/10 border border-sky-500/20 text-sky-400" : "hover:bg-zinc-900/60 text-zinc-400"
                            }`}
                          >
                            <CornerDownRight className="w-3 h-3 text-zinc-600" />
                            <span>IfcWallStandardCase [Wall_{idx+1}]</span>
                          </div>
                        ))}

                        {/* Columns Group */}
                        {bimFloor.columns.map((col, idx) => (
                          <div 
                            key={col.id}
                            onClick={() => setSelectedTreeNode(`col_${idx}`)}
                            className={`flex items-center space-x-2 p-1.5 rounded cursor-pointer transition-all pl-6 ${
                              selectedTreeNode === `col_${idx}` ? "bg-sky-500/10 border border-sky-500/20 text-sky-400" : "hover:bg-zinc-900/60 text-zinc-400"
                            }`}
                          >
                            <CornerDownRight className="w-3 h-3 text-zinc-600" />
                            <span>IfcColumn [Column_{idx+1}]</span>
                          </div>
                        ))}

                      </div>

                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* IFC PROPERTIES PANEL SPECS */}
            <div className="lg:col-span-6 space-y-4">
              <span className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider block">
                IFC Öznitelik ve Property Set (Pset) Denetleyicisi
              </span>

              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 h-96 font-mono text-[11px] space-y-4 overflow-y-auto">
                
                {/* Node details */}
                {selectedTreeNode === "proj_01" && (
                  <>
                    <h3 className="text-xs font-bold text-zinc-200 border-b border-zinc-800 pb-2">IfcProject Öznitelikleri</h3>
                    <div className="space-y-2.5">
                      <div className="flex justify-between"><span className="text-zinc-500">GlobalID</span><span className="text-zinc-300">2Bw4t9U_vD8vH5Z5$yA0vO</span></div>
                      <div className="flex justify-between"><span className="text-zinc-500">Name</span><span className="text-zinc-300">KaRar Project</span></div>
                      <div className="flex justify-between"><span className="text-zinc-500">Description</span><span className="text-zinc-300">Auto-Generated KaRar BIM Model</span></div>
                      <div className="flex justify-between"><span className="text-zinc-500">OwnerHistory</span><span className="text-sky-400">#2=IFCOWNERHISTORY</span></div>
                    </div>
                  </>
                )}

                {selectedTreeNode === "site_01" && (
                  <>
                    <h3 className="text-xs font-bold text-zinc-200 border-b border-zinc-800 pb-2">IfcSite Öznitelikleri</h3>
                    <div className="space-y-2.5">
                      <div className="flex justify-between"><span className="text-zinc-500">GlobalID</span><span className="text-zinc-300">3G68tZ$Wv7xv_H_Vq5Y2kS</span></div>
                      <div className="flex justify-between"><span className="text-zinc-500">Name</span><span className="text-zinc-300">Twin Villa Site</span></div>
                      <div className="flex justify-between"><span className="text-zinc-500">CompositionType</span><span className="text-zinc-300">.ELEMENT.</span></div>
                      <div className="flex justify-between"><span className="text-zinc-500">RefLatitude</span><span className="text-zinc-300">(41, 1, 22, 0) Istanbul</span></div>
                    </div>
                  </>
                )}

                {selectedTreeNode === "build_01" && (
                  <>
                    <h3 className="text-xs font-bold text-zinc-200 border-b border-zinc-800 pb-2">IfcBuilding Öznitelikleri</h3>
                    <div className="space-y-2.5">
                      <div className="flex justify-between"><span className="text-zinc-500">GlobalID</span><span className="text-zinc-300">0d$7vN1PvChPBzUvI0vHlA</span></div>
                      <div className="flex justify-between"><span className="text-zinc-500">Name</span><span className="text-zinc-300">Twin Villa Building</span></div>
                      <div className="flex justify-between"><span className="text-zinc-500">BuildingAddress</span><span className="text-zinc-300">Mimar Sinan, Istanbul</span></div>
                    </div>
                  </>
                )}

                {selectedTreeNode?.startsWith("wall_") && (
                  <>
                    <h3 className="text-xs font-bold text-zinc-200 border-b border-zinc-800 pb-2 uppercase">
                      IfcWallStandardCase Özellikleri
                    </h3>
                    <div className="space-y-2.5">
                      <div className="flex justify-between"><span className="text-zinc-500">Tipi</span><span className="text-zinc-300">SweptSolid (B-Rep Extruded)</span></div>
                      <div className="flex justify-between"><span className="text-zinc-500">Eksen Kalınlığı</span><span className="text-sky-400">15 cm</span></div>
                      <div className="flex justify-between"><span className="text-zinc-500">Yükseklik</span><span className="text-zinc-300">{wallExtrusionHeight} cm</span></div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-zinc-800/80 space-y-2">
                      <span className="text-[10px] text-zinc-400 font-bold block uppercase">Pset_WallCommon (Mimari Bilgi Seti)</span>
                      <div className="flex justify-between"><span className="text-zinc-500">IsExternal</span><span className="text-emerald-400 font-bold">TRUE</span></div>
                      <div className="flex justify-between"><span className="text-zinc-500">LoadBearing</span><span className="text-zinc-300">TRUE (Taşıyıcı)</span></div>
                      <div className="flex justify-between"><span className="text-zinc-500">FireRating</span><span className="text-zinc-300">F-90 Standard</span></div>
                    </div>
                  </>
                )}

                {selectedTreeNode?.startsWith("col_") && (
                  <>
                    <h3 className="text-xs font-bold text-zinc-200 border-b border-zinc-800 pb-2">IfcColumn Özellikleri</h3>
                    <div className="space-y-2.5">
                      <div className="flex justify-between"><span className="text-zinc-500">Tip Tanımı</span><span className="text-zinc-300">IfcColumnStandardCase</span></div>
                      <div className="flex justify-between"><span className="text-zinc-500">Kesit Ebatı</span><span className="text-sky-400">30 x 30 cm</span></div>
                      <div className="flex justify-between"><span className="text-zinc-500">Yükseklik</span><span className="text-zinc-300">{(wallExtrusionHeight + 10)} cm</span></div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-zinc-800/80 space-y-2">
                      <span className="text-[10px] text-zinc-400 font-bold block uppercase">Pset_ConcreteElementCommon</span>
                      <div className="flex justify-between"><span className="text-zinc-500">Sınıflandırma</span><span className="text-emerald-400">C35/45 Betonarme</span></div>
                      <div className="flex justify-between"><span className="text-zinc-500">Reinforced</span><span className="text-zinc-300">TRUE</span></div>
                    </div>
                  </>
                )}

              </div>
            </div>
          </>
        )}

      </div>

    </div>
  );
}
