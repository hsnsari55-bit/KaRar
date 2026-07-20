import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Floor } from "../types";
import { convertToCanonicalBIM } from "../lib/bimTransformer";
import { Box, Eye, Sun, Layers } from "lucide-react";

interface BIMViewer3DProps {
  floor: Floor;
  renderMode: "blueprint" | "semantic" | "realistic";
  wallHeight: number; // in mm visual equivalents (default e.g. 80)
}

export default function BIMViewer3D({
  floor,
  renderMode,
  wallHeight = 70,
}: BIMViewer3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const [cameraView, setCameraView] = useState<"perspective" | "top">("perspective");
  const [lightsOn, setLightsOn] = useState(true);
  const lightsRef = useRef<THREE.Group | null>(null);

  // Re-generate scene objects whenever floor or renderMode or wallHeight changes
  useEffect(() => {
    if (!containerRef.current) return;

    // 1. TRANSFORM TO CANONICAL BIM MODEL
    // This executes our pure geometric/topological transformation logic, decoupling the viewer from raw layers.
    const bimFloor = convertToCanonicalBIM(floor, wallHeight);

    // 2. INITIALIZE THREE.JS RUNTIME
    const container = containerRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 450;

    // Create scene with beautiful gradient atmospheric fog
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#09090b"); // Zinc 950 matching UI
    scene.fog = new THREE.FogExp2("#09090b", 0.0012);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(50, width / height, 1, 3000);
    camera.position.set(400, 350, 700);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Clear old canvases
    container.innerHTML = "";
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.05; // Prevent camera going underground
    controls.minDistance = 100;
    controls.maxDistance = 1200;
    controls.target.set(400, 0, 220); // Focus center of Twin Villa floor plan (800x450 scale)
    controlsRef.current = controls;

    // 3. LIGHTS SETUP
    const lightsGroup = new THREE.Group();
    
    const ambientLight = new THREE.AmbientLight(0xffffff, lightsOn ? 0.35 : 0.05);
    lightsGroup.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff7e6, lightsOn ? 0.8 : 0.1);
    dirLight.position.set(200, 600, 300);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 1500;
    const d = 500;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    lightsGroup.add(dirLight);

    const helperLight = new THREE.DirectionalLight(0x80b0ff, lightsOn ? 0.35 : 0.05);
    helperLight.position.set(-300, 400, -200);
    lightsGroup.add(helperLight);

    scene.add(lightsGroup);
    lightsRef.current = lightsGroup;

    // 4. FLOOR PLATFORM BASE
    let floorMat: THREE.Material;
    if (renderMode === "realistic") {
      floorMat = new THREE.MeshStandardMaterial({
        color: 0x404040,
        roughness: 0.6,
        metalness: 0.1,
      });
    } else if (renderMode === "semantic") {
      floorMat = new THREE.MeshBasicMaterial({
        color: 0x18181b,
        wireframe: false,
      });
    } else {
      floorMat = new THREE.MeshStandardMaterial({
        color: 0x18181b,
        roughness: 0.9,
      });
    }

    const floorGeo = new THREE.BoxGeometry(1000, 4, 800);
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.position.set(400, -2, 220);
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    // Grid helper on base
    const grid = new THREE.GridHelper(1600, 64, 0x3f3f46, 0x27272a);
    grid.position.y = 0.2;
    scene.add(grid);

    // 5. GENERATE 3D MESHES PURELY FROM CANONICAL BIM MODEL
    const materials = getBIMMaterials(renderMode);

    // 5.1 RENDER CANONICAL WALLS
    bimFloor.walls.forEach((wall) => {
      const wallGeo = new THREE.BoxGeometry(
        wall.mesh.size.width,
        wall.mesh.size.height,
        wall.mesh.size.depth
      );
      const wallMesh = new THREE.Mesh(wallGeo, materials.wall);
      
      // Position is already calculated by the Canonical Transformer
      wallMesh.position.set(
        wall.mesh.position.x,
        wall.mesh.position.y,
        wall.mesh.position.z
      );
      wallMesh.rotation.y = wall.mesh.rotation.y;
      wallMesh.castShadow = true;
      wallMesh.receiveShadow = true;
      scene.add(wallMesh);
    });

    // 5.2 RENDER CANONICAL COLUMNS
    bimFloor.columns.forEach((col) => {
      const colGeo = new THREE.BoxGeometry(
        col.mesh.size.width,
        col.mesh.size.height,
        col.mesh.size.depth
      );
      const colMesh = new THREE.Mesh(colGeo, materials.column);
      colMesh.position.set(
        col.mesh.position.x,
        col.mesh.position.y,
        col.mesh.position.z
      );
      colMesh.castShadow = true;
      colMesh.receiveShadow = true;
      scene.add(colMesh);
    });

    // 5.3 RENDER CANONICAL WINDOWS
    bimFloor.windows.forEach((win) => {
      const length = win.width;
      const rotationY = win.mesh.rotation.y;

      // Outer Frame
      const winFrameGeo = new THREE.BoxGeometry(length, win.height, 18);
      const winFrameMesh = new THREE.Mesh(winFrameGeo, materials.windowFrame);
      winFrameMesh.position.set(
        win.mesh.position.x,
        win.mesh.position.y,
        win.mesh.position.z
      );
      winFrameMesh.rotation.y = rotationY;
      scene.add(winFrameMesh);

      // Glass Pane
      const glassGeo = new THREE.BoxGeometry(length - 4, win.height - 4, 4);
      const glassMesh = new THREE.Mesh(glassGeo, materials.windowGlass);
      glassMesh.position.set(
        win.mesh.position.x,
        win.mesh.position.y,
        win.mesh.position.z
      );
      glassMesh.rotation.y = rotationY;
      scene.add(glassMesh);
    });

    // 5.4 RENDER CANONICAL DOORS (Implementing parameter-driven opening direction and swing animations)
    bimFloor.doors.forEach((door) => {
      const startX = door.mesh.position.x;
      const startZ = door.mesh.position.y;
      const rotationY = door.mesh.rotation.y;
      const length = door.width;

      // Two door frame posts placed on the sides of the door aperture
      const postGeo = new THREE.BoxGeometry(6, door.height, 12);
      
      const post1 = new THREE.Mesh(postGeo, materials.doorFrame);
      post1.position.set(startX, door.height / 2, startZ);
      post1.rotation.y = rotationY;
      scene.add(post1);

      const post2 = new THREE.Mesh(postGeo, materials.doorFrame);
      post2.position.set(
        startX + Math.cos(-rotationY) * length,
        door.height / 2,
        startZ + Math.sin(-rotationY) * length
      );
      post2.rotation.y = rotationY;
      scene.add(post2);

      // Render actual door panel with physical rotation derived from door swing parameters
      const doorPanelGeo = new THREE.BoxGeometry(length - 4, door.height * 0.95, 4);
      const doorPanelMesh = new THREE.Mesh(doorPanelGeo, materials.doorPanel);
      
      // Pivot panel from the hinge and swing it open based on opening direction and degree
      const swingRad = (door.swingAngle * Math.PI) / 180;
      
      // Calculate final rotation using our hinge and direction parameters
      const directionMultiplier = door.openingDirection === "inward" ? 1 : -1;
      const hingeMultiplier = door.hinge === "left" ? 1 : -1;
      const finalSwingAngle = rotationY + (swingRad * directionMultiplier * hingeMultiplier);

      doorPanelMesh.position.set(
        startX + Math.cos(-finalSwingAngle) * (length / 2),
        (door.height * 0.95) / 2,
        startZ + Math.sin(-finalSwingAngle) * (length / 2)
      );
      doorPanelMesh.rotation.y = finalSwingAngle;
      scene.add(doorPanelMesh);
    });

    // 6. ANIMATION LOOP
    const animate = () => {
      animationFrameIdRef.current = requestAnimationFrame(animate);
      if (controlsRef.current) controlsRef.current.update();
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    // 7. RESIZE OBSERVER (Responsive Canvas sizing)
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width: currentWidth, height: currentHeight } = entries[0].contentRect;
      if (cameraRef.current && rendererRef.current) {
        cameraRef.current.aspect = currentWidth / currentHeight;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(currentWidth, currentHeight);
      }
    });
    resizeObserver.observe(container);

    // CLEANUP RUNTIME
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      resizeObserver.disconnect();
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, [floor, renderMode, wallHeight]);

  // Handle camera view toggling (perspective vs orthographic top blueprint view)
  const toggleCameraView = () => {
    if (cameraRef.current && controlsRef.current) {
      if (cameraView === "perspective") {
        cameraRef.current.position.set(400, 750, 220);
        controlsRef.current.target.set(400, 0, 220);
        setCameraView("top");
      } else {
        cameraRef.current.position.set(400, 350, 700);
        controlsRef.current.target.set(400, 0, 220);
        setCameraView("perspective");
      }
    }
  };

  const toggleSunlight = () => {
    setLightsOn((l) => !l);
  };

  useEffect(() => {
    if (lightsRef.current) {
      lightsRef.current.traverse((child) => {
        if (child instanceof THREE.AmbientLight) {
          child.intensity = lightsOn ? 0.35 : 0.05;
        }
        if (child instanceof THREE.DirectionalLight) {
          if (child.position.y > 500) {
            child.intensity = lightsOn ? 0.8 : 0.05;
          } else {
            child.intensity = lightsOn ? 0.3 : 0.02;
          }
        }
      });
    }
  }, [lightsOn]);

  return (
    <div className="relative w-full h-[500px] bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden flex flex-col select-none">
      {/* 3D Viewport controls header */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center space-x-2">
          <Box className="w-4 h-4 text-sky-400" />
          <span className="font-mono text-xs text-zinc-300">
            CANONICAL BIM ENGINE | 3D RENDER SAHNESİ
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={toggleCameraView}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded text-[10px] font-mono border transition-all ${
              cameraView === "top"
                ? "bg-sky-950/40 border-sky-800 text-sky-200"
                : "border-zinc-700 text-zinc-300 hover:border-zinc-600"
            }`}
            title="Kamera Bakış Açısını Değiştir"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{cameraView === "top" ? "PERSPEKTİF" : "ÜST BAKIŞ"}</span>
          </button>

          <button
            onClick={toggleSunlight}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded text-[10px] font-mono border transition-all ${
              lightsOn
                ? "bg-amber-950/30 border-amber-800 text-amber-200"
                : "border-zinc-700 text-zinc-400 hover:border-zinc-600"
            }`}
            title="Güneş/Gölge Işığını Kapat"
          >
            <Sun className="w-3.5 h-3.5" />
            <span>{lightsOn ? "GECE MODU" : "GÜNDÜZ MODU"}</span>
          </button>
        </div>
      </div>

      {/* THREE.JS MOUNT CONTAINER */}
      <div ref={containerRef} className="flex-1 w-full h-full bg-zinc-950" />

      {/* Visual render overlay info */}
      <div className="absolute bottom-4 left-4 bg-zinc-900/90 border border-zinc-800 backdrop-blur rounded-lg px-3 py-2 text-[10px] font-mono max-w-xs shadow-xl pointer-events-none">
        <div className="text-zinc-500 uppercase tracking-wider mb-1 flex items-center space-x-1">
          <Layers className="w-3 h-3 text-sky-400" />
          <span>BIM Parametreleri (Canonical Model)</span>
        </div>
        <p className="text-zinc-300 font-semibold">{floor.name}</p>
        <p className="text-zinc-400 mt-0.5 font-mono">Kot: {floor.elevation}</p>
        <p className="text-zinc-400">Yükseklik: {wallHeight * 5} cm Extruded</p>
        <p className="text-zinc-400">Malzeme Modu: <span className="capitalize text-sky-300">{renderMode}</span></p>
      </div>
    </div>
  );
}

// BIM Material generator helper
function getBIMMaterials(mode: "blueprint" | "semantic" | "realistic") {
  if (mode === "realistic") {
    return {
      wall: new THREE.MeshStandardMaterial({
        color: 0xefefef, // Matte white plaster
        roughness: 0.8,
        metalness: 0.05,
      }),
      column: new THREE.MeshStandardMaterial({
        color: 0x3a3a3c, // Dark anthracite structural columns
        roughness: 0.4,
        metalness: 0.5,
      }),
      windowFrame: new THREE.MeshStandardMaterial({
        color: 0x222222, // Matte black aluminum window borders
        roughness: 0.5,
      }),
      windowGlass: new THREE.MeshStandardMaterial({
        color: 0xa5f3fc, // Pale sky transparent glass
        roughness: 0.1,
        metalness: 0.9,
        transparent: true,
        opacity: 0.6,
      }),
      doorFrame: new THREE.MeshStandardMaterial({
        color: 0x8a5a36, // Wooden oak frame
        roughness: 0.7,
      }),
      doorPanel: new THREE.MeshStandardMaterial({
        color: 0xa16207, // Wooden walnut panel
        roughness: 0.6,
      }),
    };
  }

  if (mode === "semantic") {
    return {
      wall: new THREE.MeshBasicMaterial({ color: 0x52525b }), // Zinc gray
      column: new THREE.MeshBasicMaterial({ color: 0xef4444 }), // Crimson Column
      windowFrame: new THREE.MeshBasicMaterial({ color: 0x0284c7 }), // Blue Windows Frame
      windowGlass: new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.5,
      }), // Transparent light blue glass
      doorFrame: new THREE.MeshBasicMaterial({ color: 0xd97706 }), // Amber doors frame
      doorPanel: new THREE.MeshBasicMaterial({ color: 0xf59e0b }), // Bright Amber doors
    };
  }

  // DEFAULT BLUEPRINT (Slate Monochromatic)
  return {
    wall: new THREE.MeshStandardMaterial({
      color: 0x27272a,
      roughness: 0.7,
      metalness: 0.1,
    }),
    column: new THREE.MeshStandardMaterial({
      color: 0x3f3f46,
      roughness: 0.5,
    }),
    windowFrame: new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.5,
    }),
    windowGlass: new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.2,
      metalness: 0.8,
      transparent: true,
      opacity: 0.4,
    }),
    doorFrame: new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.8,
    }),
    doorPanel: new THREE.MeshStandardMaterial({
      color: 0x27272a,
      roughness: 0.8,
    }),
  };
}

