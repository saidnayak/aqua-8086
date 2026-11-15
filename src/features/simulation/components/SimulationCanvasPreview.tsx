"use client";

import React, { useRef, useSyncExternalStore } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";
import { Badge } from "@/components/ui/Badge";
import { RotateCw, ZoomIn, Activity } from "lucide-react";
import { IntegratedState } from "../engine/execution";
import { SimulationTelemetry, ParsedInstruction } from "../types/simulation";

const emptySubscribe = () => () => {};
function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

interface SceneProps {
  state?: IntegratedState;
  busActivity?: SimulationTelemetry["busActivity"];
  activeInstruction?: ParsedInstruction;
}

// Microprocessor 3D IC Component with execution pulse LED
function ProcessorChip({
  position = [0, 0, 0],
  isExecuting = false,
  ip = 0,
}: {
  position?: [number, number, number];
  isExecuting?: boolean;
  ip?: number;
}) {
  const ledRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (ledRef.current) {
      if (isExecuting) {
        // Fast dynamic activity pulse
        const t = clock.getElapsedTime() * 12;
        const intensity = 0.5 + Math.sin(t) * 0.5;
        (ledRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = intensity;
      } else {
        (ledRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.3;
      }
    }
  });

  return (
    <group position={position}>
      {/* IC Ceramic / Plastic Body (40-Pin DIP package) */}
      <mesh castShadow receiveShadow position={[0, 0.25, 0]}>
        <boxGeometry args={[4.2, 0.45, 1.8]} />
        <meshStandardMaterial color="#0e1726" roughness={0.3} metalness={0.7} />
      </mesh>

      {/* Index Notch */}
      <mesh position={[-2.1, 0.26, 0]}>
        <cylinderGeometry args={[0.25, 0.25, 0.46, 16, 1, false, -Math.PI / 2, Math.PI]} />
        <meshStandardMaterial color="#0b1120" roughness={0.5} />
      </mesh>

      {/* Pin 1 Dot */}
      <mesh position={[-1.7, 0.48, 0.6]}>
        <cylinderGeometry args={[0.08, 0.08, 0.05, 16]} />
        <meshStandardMaterial color="#475569" roughness={0.4} />
      </mesh>

      {/* Activity Indicator LED */}
      <mesh ref={ledRef} position={[1.7, 0.49, 0.6]}>
        <sphereGeometry args={[0.09, 16, 16]} />
        <meshStandardMaterial color="#00f0ff" emissive="#00f0ff" emissiveIntensity={0.6} />
      </mesh>

      {/* Gold Heat Spreader / Label Plate */}
      <mesh position={[0, 0.48, 0]}>
        <planeGeometry args={[2.8, 1.2]} />
        <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.8} />
      </mesh>

      {/* Text on Chip */}
      <Text
        position={[0, 0.49, 0.16]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.28}
        color="#00f0ff"
        anchorX="center"
        anchorY="middle"
      >
        intel i8086
      </Text>
      <Text
        position={[0, 0.49, -0.22]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.16}
        color="#94a3b8"
        anchorX="center"
        anchorY="middle"
      >
        {`IP: 0x${ip.toString(16).toUpperCase().padStart(4, "0")} • 5MHz`}
      </Text>

      {/* Dual Row Pins (16 pin pairs visible) */}
      {Array.from({ length: 16 }).map((_, i) => {
        const xOffset = -1.8 + i * 0.24;
        return (
          <React.Fragment key={`pin-pair-${i}`}>
            <mesh position={[xOffset, 0.1, 1.05]}>
              <boxGeometry args={[0.09, 0.2, 0.4]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
            </mesh>
            <mesh position={[xOffset, 0.1, -1.05]}>
              <boxGeometry args={[0.09, 0.2, 0.4]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
            </mesh>
          </React.Fragment>
        );
      })}
    </group>
  );
}

// 8255 PPI Chip with dynamic port telemetry labels
function PPIChip({
  position = [0, 0, 0],
  portA = 0x00,
  portB = 0x00,
  isConfigured = false,
}: {
  position?: [number, number, number];
  portA?: number;
  portB?: number;
  isConfigured?: boolean;
}) {
  return (
    <group position={position}>
      <mesh castShadow receiveShadow position={[0, 0.25, 0]}>
        <boxGeometry args={[3.8, 0.45, 1.6]} />
        <meshStandardMaterial color="#0f172a" roughness={0.35} metalness={0.6} />
      </mesh>

      <Text
        position={[0, 0.49, 0.12]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.26}
        color="#38bdf8"
        anchorX="center"
        anchorY="middle"
      >
        8255A PPI
      </Text>
      <Text
        position={[0, 0.49, -0.22]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.14}
        color={isConfigured ? "#34d399" : "#f59e0b"}
        anchorX="center"
        anchorY="middle"
      >
        {`PA:${portA.toString(16).toUpperCase().padStart(2, "0")}H | PB:${portB
          .toString(16)
          .toUpperCase()
          .padStart(2, "0")}H ${isConfigured ? "[M0 90H]" : "[INIT]"}`}
      </Text>

      {/* Pins */}
      {Array.from({ length: 14 }).map((_, i) => {
        const xOffset = -1.5 + i * 0.23;
        return (
          <React.Fragment key={`ppi-pin-${i}`}>
            <mesh position={[xOffset, 0.1, 0.95]}>
              <boxGeometry args={[0.08, 0.2, 0.35]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
            </mesh>
            <mesh position={[xOffset, 0.1, -0.95]}>
              <boxGeometry args={[0.08, 0.2, 0.35]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
            </mesh>
          </React.Fragment>
        );
      })}
    </group>
  );
}

// 3D Water Reservoir Tank Model responsive to real simulation water level
function WaterTank({
  position = [0, 0, 0],
  waterLevel = 10.0,
  lowSensorActive = false,
  highSensorActive = false,
}: {
  position?: [number, number, number];
  waterLevel?: number;
  lowSensorActive?: boolean;
  highSensorActive?: boolean;
}) {
  const waterMeshRef = useRef<THREE.Mesh>(null);

  // Map 0 - 100% water level to 3D cylinder height (max height ~2.4)
  const maxVisualHeight = 2.4;
  const currentVisualHeight = Math.max(0.08, (waterLevel / 100) * maxVisualHeight);
  const currentCenterY = 0.2 + currentVisualHeight / 2;

  useFrame(({ clock }) => {
    if (waterMeshRef.current) {
      // Subtle surface wave modulation
      const t = clock.getElapsedTime() * 2;
      const wave = Math.sin(t) * 0.015;
      waterMeshRef.current.scale.set(1 + wave, 1, 1 + wave);
    }
  });

  return (
    <group position={position}>
      {/* Tank Base Platform */}
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[1.5, 1.6, 0.2, 32]} />
        <meshStandardMaterial color="#1e293b" metalness={0.5} roughness={0.5} />
      </mesh>

      {/* Graduated Measurement Markings on Tank */}
      <group position={[1.4, 1.4, 0]}>
        {/* 25% Mark */}
        <mesh position={[0, -0.8 + 0.25 * maxVisualHeight, 0]}>
          <boxGeometry args={[0.1, 0.02, 0.2]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
        {/* 85% Mark */}
        <mesh position={[0, -0.8 + 0.85 * maxVisualHeight, 0]}>
          <boxGeometry args={[0.1, 0.02, 0.2]} />
          <meshBasicMaterial color="#f59e0b" />
        </mesh>
      </group>

      {/* Transparent Cylindrical Glass Tank Wall */}
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[1.35, 1.35, 2.7, 32, 1, true]} />
        <meshPhysicalMaterial
          color="#38bdf8"
          transmission={0.88}
          opacity={0.35}
          transparent={true}
          roughness={0.1}
          ior={1.4}
          thickness={0.2}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Dynamic Water Fluid Column responding directly to waterLevel */}
      <mesh ref={waterMeshRef} position={[0, currentCenterY, 0]}>
        <cylinderGeometry args={[1.28, 1.28, currentVisualHeight, 32]} />
        <meshStandardMaterial
          color="#0284c7"
          transparent={true}
          opacity={0.78}
          roughness={0.2}
          metalness={0.3}
        />
      </mesh>

      {/* Low Level Sensor Probe (Bottom 25% Threshold) */}
      <group position={[0.7, 0.8, 0]}>
        <mesh>
          <cylinderGeometry args={[0.035, 0.035, 1.0, 16]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.1} />
        </mesh>
        <mesh position={[0, 0.5, 0]}>
          <sphereGeometry args={[0.09, 16, 16]} />
          <meshStandardMaterial
            color={lowSensorActive ? "#00f0ff" : "#64748b"}
            emissive={lowSensorActive ? "#00f0ff" : "#000000"}
            emissiveIntensity={lowSensorActive ? 1.5 : 0.1}
          />
        </mesh>
        <Text
          position={[0.3, 0.5, 0]}
          fontSize={0.18}
          color={lowSensorActive ? "#00f0ff" : "#64748b"}
          anchorX="left"
          anchorY="middle"
        >
          {`PA0: ${lowSensorActive ? "1 (Submerged)" : "0 (Dry)"}`}
        </Text>
      </group>

      {/* High Level Sensor Probe (Top 85% Threshold) */}
      <group position={[-0.7, 2.2, 0]}>
        <mesh>
          <cylinderGeometry args={[0.035, 0.035, 1.0, 16]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.1} />
        </mesh>
        <mesh position={[0, 0.5, 0]}>
          <sphereGeometry args={[0.09, 16, 16]} />
          <meshStandardMaterial
            color={highSensorActive ? "#f59e0b" : "#64748b"}
            emissive={highSensorActive ? "#f59e0b" : "#000000"}
            emissiveIntensity={highSensorActive ? 1.5 : 0.1}
          />
        </mesh>
        <Text
          position={[-0.3, 0.5, 0]}
          fontSize={0.18}
          color={highSensorActive ? "#f59e0b" : "#64748b"}
          anchorX="right"
          anchorY="middle"
        >
          {`PA1: ${highSensorActive ? "1 (Submerged)" : "0 (Dry)"}`}
        </Text>
      </group>

      {/* Inflow Pipe at Top */}
      <mesh position={[0, 2.9, -1.0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.8, 16]} />
        <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  );
}

// Submersible / External Pump Unit with active rotation and PB0 relay LED
function WaterPump({
  position = [0, 0, 0],
  isPumpOn = false,
}: {
  position?: [number, number, number];
  isPumpOn?: boolean;
}) {
  const impellerRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (impellerRef.current && isPumpOn) {
      // Visibly rotate impeller housing when pump is energized
      impellerRef.current.rotation.x += delta * 15;
    }
  });

  return (
    <group position={position}>
      {/* Motor Casing */}
      <mesh position={[0, 0.5, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.5, 0.5, 1.2, 24]} />
        <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Rotating Impeller Housing */}
      <mesh ref={impellerRef} position={[0.7, 0.5, 0]}>
        <cylinderGeometry args={[0.65, 0.65, 0.4, 24]} />
        <meshStandardMaterial
          color={isPumpOn ? "#0284c7" : "#334155"}
          metalness={0.5}
          roughness={0.4}
        />
      </mesh>

      {/* Relay Trigger Status LED */}
      <mesh position={[0, 1.1, 0]}>
        <sphereGeometry args={[0.09, 16, 16]} />
        <meshStandardMaterial
          color={isPumpOn ? "#10b981" : "#475569"}
          emissive={isPumpOn ? "#10b981" : "#000000"}
          emissiveIntensity={isPumpOn ? 1.8 : 0.2}
        />
      </mesh>

      {/* PB0 Status Text */}
      <Text
        position={[0, 1.35, 0]}
        fontSize={0.2}
        color={isPumpOn ? "#34d399" : "#64748b"}
        anchorX="center"
        anchorY="middle"
      >
        {isPumpOn ? "RELAY PB0 [PUMP ON]" : "RELAY PB0 [STANDBY]"}
      </Text>
    </group>
  );
}

// Motherboard with dynamic bus trace illumination
function Motherboard({ busActive = false, pumpOn = false }: { busActive?: boolean; pumpOn?: boolean }) {
  return (
    <group position={[0, -0.05, 0]}>
      {/* Main PCB board */}
      <mesh receiveShadow position={[0, 0, 0]}>
        <boxGeometry args={[14, 0.15, 9]} />
        <meshStandardMaterial color="#08101e" roughness={0.6} metalness={0.2} />
      </mesh>

      {/* PCB Trace decorative grid lines */}
      <mesh position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[13.5, 8.5]} />
        <meshBasicMaterial
          color={busActive ? "#00f0ff" : "#0e2a47"}
          wireframe={true}
          transparent={true}
          opacity={busActive ? 0.65 : 0.35}
        />
      </mesh>

      {/* Active Control Bus Trace (8255 PB0 -> Pump Relay) */}
      <mesh position={[-1.7, 0.09, 0.3]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.1, 4.2]} />
        <meshBasicMaterial
          color={pumpOn ? "#10b981" : "#1e293b"}
          transparent={true}
          opacity={pumpOn ? 0.9 : 0.3}
        />
      </mesh>
    </group>
  );
}

// Composite Scene
function SimulationScene({ state, busActivity }: SceneProps) {
  const sceneGroupRef = useRef<THREE.Group>(null);

  const waterLevel = state?.tank.waterLevel ?? 10.0;
  const isPumpOn = state?.tank.isPumpOn ?? false;
  const lowSensorActive = state?.sensors.lowSensor ?? false;
  const highSensorActive = state?.sensors.highSensor ?? false;
  const portA = state?.ppi.portA ?? 0x00;
  const portB = state?.ppi.portB ?? 0x00;
  const isConfigured = state?.ppi.isConfigured ?? false;
  const ip = state?.registers.ip ?? 0;
  const busActive = busActivity?.active ?? false;

  useFrame((_, delta) => {
    if (sceneGroupRef.current) {
      // Slow background idle orbit
      sceneGroupRef.current.rotation.y += delta * 0.04;
    }
  });

  return (
    <group ref={sceneGroupRef}>
      <Motherboard busActive={busActive} pumpOn={isPumpOn} />
      <ProcessorChip position={[-3.2, 0, 1.2]} isExecuting={busActive} ip={ip} />
      <PPIChip
        position={[-3.2, 0, -1.8]}
        portA={portA}
        portB={portB}
        isConfigured={isConfigured}
      />
      <WaterTank
        position={[2.8, 0, 0]}
        waterLevel={waterLevel}
        lowSensorActive={lowSensorActive}
        highSensorActive={highSensorActive}
      />
      <WaterPump position={[-0.2, 0, 2.4]} isPumpOn={isPumpOn} />
    </group>
  );
}

export interface SimulationCanvasPreviewProps {
  simulationState?: IntegratedState;
  busActivity?: SimulationTelemetry["busActivity"];
  activeInstruction?: ParsedInstruction;
}

export function SimulationCanvasPreview({
  simulationState,
  busActivity,
  activeInstruction,
}: SimulationCanvasPreviewProps) {
  const mounted = useMounted();

  const currentWaterLevel = simulationState?.tank.waterLevel ?? 10.0;
  const isPumpOn = simulationState?.tank.isPumpOn ?? false;
  const isConfigured = simulationState?.ppi.isConfigured ?? false;

  return (
    <div className="relative w-full rounded-2xl border border-slate-800/90 bg-gradient-to-b from-[#0a1122]/90 to-[#060a14] overflow-hidden shadow-2xl">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-3 h-3 rounded-full ${
                isPumpOn
                  ? "bg-emerald-400 animate-ping"
                  : "bg-cyan-500/80"
              }`}
            />
            <span className="font-mono text-xs font-semibold text-slate-200">
              3D VIEWPORT • LIVE ENGINE
            </span>
          </div>
          <Badge variant={isPumpOn ? "emerald" : "cyan"} size="sm">
            {isPumpOn ? "PUMP ACTIVE (PB0=1)" : "STANDBY (PB0=0)"}
          </Badge>
        </div>

        {/* Viewport Control Badges */}
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span className="hidden sm:inline-flex items-center gap-1 bg-slate-800/80 px-2.5 py-1 rounded border border-slate-700/60">
            <RotateCw className="w-3 h-3 text-cyan-400" /> Orbit: Left Click + Drag
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 bg-slate-800/80 px-2.5 py-1 rounded border border-slate-700/60">
            <ZoomIn className="w-3 h-3 text-cyan-400" /> Zoom: Scroll
          </span>
        </div>
      </div>

      {/* 3D Canvas Area */}
      <div className="relative w-full h-[420px] sm:h-[480px] lg:h-[540px] bg-gradient-to-b from-[#060b16] via-[#070e1c] to-[#050811]">
        {mounted ? (
          <Canvas
            shadows
            camera={{ position: [7, 6, 8], fov: 42 }}
            gl={{ antialias: true, alpha: true }}
            className="w-full h-full cursor-grab active:cursor-grabbing"
          >
            <ambientLight intensity={0.9} />
            <directionalLight
              position={[10, 15, 8]}
              intensity={1.5}
              castShadow
              shadow-mapSize-width={1024}
              shadow-mapSize-height={1024}
            />
            <pointLight position={[-4, 4, -2]} intensity={1.2} color="#00f0ff" />
            <pointLight position={[4, 5, 2]} intensity={1.2} color="#38bdf8" />

            <SimulationScene
              state={simulationState}
              busActivity={busActivity}
              activeInstruction={activeInstruction}
            />

            <OrbitControls
              enablePan={false}
              minDistance={5}
              maxDistance={18}
              maxPolarAngle={Math.PI / 2.1}
              autoRotate={false}
            />
          </Canvas>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-3">
            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-mono">Initializing Three.js WebGL Context...</span>
          </div>
        )}

        {/* Viewport Overlay Floating HUD */}
        <div className="absolute top-4 left-4 pointer-events-none flex flex-col gap-2 max-w-xs">
          <div className="p-3.5 rounded-xl bg-slate-950/85 backdrop-blur-md border border-slate-800 text-xs shadow-2xl">
            <div className="flex items-center justify-between text-[11px] font-mono text-cyan-400 mb-2">
              <span className="flex items-center gap-1.5 font-bold">
                <Activity className="w-3.5 h-3.5" /> HARDWARE TELEMETRY
              </span>
              <span className={isPumpOn ? "text-emerald-400 font-bold" : "text-slate-400"}>
                {isPumpOn ? "PUMPING" : "IDLE"}
              </span>
            </div>
            <div className="space-y-1.5 font-mono text-[11px] text-slate-300">
              <div className="flex justify-between border-b border-slate-850 pb-1">
                <span className="text-slate-400">Water Level:</span>
                <span className="text-cyan-300 font-bold">{currentWaterLevel.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between border-b border-slate-850 pb-1">
                <span className="text-slate-400">8255 Port A:</span>
                <span className="text-amber-300">
                  {`0x${(simulationState?.ppi.portA ?? 0).toString(16).toUpperCase().padStart(2, "0")}H`}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-850 pb-1">
                <span className="text-slate-400">8255 Port B:</span>
                <span className={isPumpOn ? "text-emerald-400 font-bold" : "text-slate-300"}>
                  {`0x${(simulationState?.ppi.portB ?? 0).toString(16).toUpperCase().padStart(2, "0")}H`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">8255 Mode:</span>
                <span className="text-sky-400 font-bold">
                  {isConfigured ? "Mode 0 (90H)" : "Unconfigured"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Legend Overlay */}
        <div className="absolute bottom-4 inset-x-4 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
          <div className="flex flex-wrap gap-2 pointer-events-auto">
            <span className="px-2.5 py-1 rounded-md bg-slate-900/90 border border-slate-800 text-[11px] font-mono text-slate-300 flex items-center gap-1.5 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              8086 CPU
            </span>
            <span className="px-2.5 py-1 rounded-md bg-slate-900/90 border border-slate-800 text-[11px] font-mono text-slate-300 flex items-center gap-1.5 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              8255 PPI
            </span>
            <span className="px-2.5 py-1 rounded-md bg-slate-900/90 border border-slate-800 text-[11px] font-mono text-slate-300 flex items-center gap-1.5 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Water Tank & Probes
            </span>
            <span className="px-2.5 py-1 rounded-md bg-slate-900/90 border border-slate-800 text-[11px] font-mono text-slate-300 flex items-center gap-1.5 backdrop-blur-sm">
              <span className={`w-2 h-2 rounded-full ${isPumpOn ? "bg-emerald-400" : "bg-slate-400"}`} />
              Motor Actuator ({isPumpOn ? "ON" : "OFF"})
            </span>
          </div>

          <div className="pointer-events-auto flex items-center gap-2">
            <span className="px-3 py-1 rounded-md bg-cyan-950/80 border border-cyan-500/40 text-[11px] font-mono text-cyan-300 backdrop-blur-sm">
              AQUA8086 Virtual Hardware Engine
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
