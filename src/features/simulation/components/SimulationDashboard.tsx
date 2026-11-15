"use client";

import React, { useState } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  StepForward,
  Droplets,
  AlertTriangle,
  Cpu,
  Binary,
  Terminal,
  Activity,
  Trash2,
  Sliders,
  Sparkles,
  Maximize2,
  GitFork,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useSimulation } from "../hooks/useSimulation";
import { SimulationCanvasPreview } from "./SimulationCanvasPreview";
import { SignalFlowDiagram } from "./SignalFlowDiagram";
import { GuidedDemoMode } from "./GuidedDemoMode";
import { AlgorithmFlowchart } from "./AlgorithmFlowchart";
import { InstructionExplainer } from "./InstructionExplainer";
import { PracticeScenarios } from "./PracticeScenarios";
import { PresentationMode } from "@/features/presentation/components/PresentationMode";

export function SimulationDashboard() {
  const {
    state,
    status,
    speedMultiplier,
    program,
    activeInstruction,
    logs,
    busActivity,
    step,
    start,
    pause,
    reset,
    setWaterLevel,
    toggleDrain,
    setDraining,
    setSpeedMultiplier,
    setForceSensorInconsistency,
    syncToGuidedStage,
    applyPracticeScenario,
    clearLogs,
  } = useSimulation();

  const [activeTab, setActiveTab] = useState<
    "guided" | "program" | "flowchart" | "practice" | "registers" | "ppi" | "logs"
  >("guided");

  const [isPresentationOpen, setIsPresentationOpen] = useState(false);
  const [highlightedComponent, setHighlightedComponent] = useState<string>("tank");

  const { registers, flags, ppi, sensors, tank } = state;
  const isRunning = status === "RUNNING";

  return (
    <div className="space-y-8">
      {/* 1. Main Interactive Control Toolbar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#090e1a]/95 border border-slate-800 backdrop-blur-xl shadow-2xl flex flex-wrap items-center justify-between gap-4">
        {/* Left: Execution Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {isRunning ? (
            <Button
              variant="secondary"
              size="md"
              icon={<Pause className="w-4 h-4 text-amber-400" />}
              onClick={pause}
            >
              Pause
            </Button>
          ) : (
            <Button
              variant="primary"
              size="md"
              icon={<Play className="w-4 h-4 fill-current" />}
              onClick={start}
            >
              Run Engine
            </Button>
          )}

          <Button
            variant="outline"
            size="md"
            icon={<StepForward className="w-4 h-4" />}
            onClick={step}
            disabled={isRunning}
            title="Execute 1 instruction at current IP"
          >
            Step 1 Inst
          </Button>

          <Button
            variant="secondary"
            size="md"
            icon={<RotateCcw className="w-4 h-4 text-slate-300" />}
            onClick={reset}
            title="Reset CPU, PPI, sensors, and tank"
          >
            Reset
          </Button>

          {/* Execution Status Badge */}
          <div className="ml-2 flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isRunning ? "bg-emerald-400 animate-ping" : "bg-amber-400"
              }`}
            />
            <span className="font-mono text-xs font-bold text-slate-200">
              {status}
            </span>
          </div>
        </div>

        {/* Center: Draining & Speed Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Water Drain Toggle */}
          <button
            onClick={toggleDrain}
            className={`px-3 py-2 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
              tank.isDraining
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_12px_-2px_rgba(245,158,11,0.3)]"
                : "bg-slate-900 text-slate-400 hover:text-slate-200 border-slate-800"
            }`}
          >
            <Droplets className="w-3.5 h-3.5 text-cyan-400" />
            <span>Water Drain: {tank.isDraining ? "ACTIVE (4%/s)" : "OFF"}</span>
          </button>

          {/* Speed Selector */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 font-mono text-xs">
            <span className="text-slate-400 px-2 text-[11px]">Speed:</span>
            {[0.5, 1.0, 2.0, 4.0].map((s) => (
              <button
                key={s}
                onClick={() => setSpeedMultiplier(s)}
                className={`px-2 py-1 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                  speedMultiplier === s
                    ? "bg-cyan-500 text-slate-950"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Fault Injection Button */}
          <button
            onClick={() => setForceSensorInconsistency(!state.forceSensorInconsistency)}
            className={`px-3 py-2 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
              state.forceSensorInconsistency
                ? "bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-[0_0_15px_-2px_rgba(244,63,94,0.4)]"
                : "bg-slate-900 text-slate-400 hover:text-slate-300 border-slate-800"
            }`}
            title="Inject physical inconsistency fault: PA1=1 while PA0=0 (PA=02H)"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>Fault: {state.forceSensorInconsistency ? "PA=02H FAULT" : "Normal"}</span>
          </button>

          {/* Full-Screen Presentation Mode Button */}
          <Button
            variant="primary"
            size="md"
            icon={<Maximize2 className="w-4 h-4 text-slate-950" />}
            onClick={() => setIsPresentationOpen(true)}
            title="Launch clean full-screen presentation mode for faculty demonstrations"
          >
            Faculty Presentation Mode
          </Button>
        </div>
      </div>

      {/* Manual Water Level Testing Slider */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <div>
            <div className="text-xs font-mono font-bold text-slate-200">
              Manual Water Level Testing Slider
            </div>
            <div className="text-[11px] text-slate-400">
              Adjust water level dynamically; sensors immediately report updated logic to 8255 Port A
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full sm:w-auto">
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={tank.waterLevel}
            onChange={(e) => setWaterLevel(parseFloat(e.target.value))}
            className="w-full sm:w-64 accent-cyan-400 cursor-pointer"
          />
          <span className="font-mono text-sm font-bold text-cyan-300 w-16 text-right">
            {tank.waterLevel.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Inconsistent Sensor Warning Banner if active */}
      {sensors.isInconsistent && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/50 text-rose-200 flex items-start gap-3 backdrop-blur-md">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm">
            <span className="font-bold font-mono">SENSOR INCONSISTENCY DETECTED (PA=02H):</span> High-level
            probe submerged while low-level probe dry. In accordance with safety specifications, the
            8086 software routine engages safe cutoff mode (Pump forced OFF).
          </div>
        </div>
      )}

      {/* 2. 3D Viewport Connected to Live State */}
      <div className="relative">
        {highlightedComponent && activeTab === "guided" && (
          <div className="absolute top-4 right-4 z-10 p-2 px-3 rounded-lg bg-slate-950/80 border border-cyan-500/40 text-cyan-300 font-mono text-xs backdrop-blur-md flex items-center gap-1.5 shadow-lg pointer-events-none">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Target Subsystem: <strong className="uppercase">{highlightedComponent}</strong></span>
          </div>
        )}
        <SimulationCanvasPreview
          simulationState={state}
          busActivity={busActivity}
          activeInstruction={activeInstruction}
        />
      </div>

      {/* 3. Live System Telemetry Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Reservoir Volume */}
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/90 backdrop-blur-md space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Reservoir Volume</span>
            <Badge
              variant={
                tank.systemCondition === "FILLING"
                  ? "emerald"
                  : tank.systemCondition === "DRAINING"
                  ? "amber"
                  : tank.systemCondition === "INCONSISTENCY_WARNING"
                  ? "amber"
                  : "slate"
              }
              size="sm"
            >
              {tank.systemCondition}
            </Badge>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-cyan-400">
              {tank.waterLevel.toFixed(1)}%
            </span>
            <span className="text-xs font-mono text-slate-400">
              {tank.waterLevel < 25 ? "Below LOW (<25%)" : tank.waterLevel >= 85 ? "At HIGH (>=85%)" : "Mid Hysteresis Zone"}
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
            <div
              className={`h-full transition-all duration-300 ${
                tank.waterLevel >= 85
                  ? "bg-amber-400"
                  : tank.waterLevel <= 25
                  ? "bg-cyan-400"
                  : "bg-sky-500"
              }`}
              style={{ width: `${tank.waterLevel}%` }}
            />
          </div>
        </div>

        {/* Low Sensor PA0 */}
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/90 backdrop-blur-md space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Low Probe (PA0)</span>
            <Badge variant={sensors.lowSensor ? "cyan" : "slate"} size="sm">
              {sensors.lowSensor ? "Active (1)" : "Dry (0)"}
            </Badge>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-slate-100">
              {sensors.lowSensor ? "SUBMERGED" : "DRY"}
            </span>
            <span className="text-xs font-mono text-slate-400">Threshold: &ge;25%</span>
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            Bit 0: <span className="text-cyan-300 font-bold">{sensors.lowSensor ? "1" : "0"}</span>
          </div>
        </div>

        {/* High Sensor PA1 */}
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/90 backdrop-blur-md space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase">High Probe (PA1)</span>
            <Badge variant={sensors.highSensor ? "amber" : "slate"} size="sm">
              {sensors.highSensor ? "Active (1)" : "Dry (0)"}
            </Badge>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-slate-100">
              {sensors.highSensor ? "SUBMERGED" : "DRY"}
            </span>
            <span className="text-xs font-mono text-slate-400">Threshold: &ge;85%</span>
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            Bit 1: <span className="text-amber-300 font-bold">{sensors.highSensor ? "1" : "0"}</span>
          </div>
        </div>

        {/* Pump Actuator PB0 */}
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/90 backdrop-blur-md space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Pump Actuator (PB0)</span>
            <Badge variant={tank.isPumpOn ? "emerald" : "slate"} size="sm">
              {tank.isPumpOn ? "RUNNING" : "STANDBY"}
            </Badge>
          </div>
          <div className="flex items-baseline justify-between">
            <span
              className={`text-2xl font-bold font-mono ${
                tank.isPumpOn ? "text-emerald-400" : "text-slate-400"
              }`}
            >
              {tank.isPumpOn ? "MOTOR ON" : "MOTOR OFF"}
            </span>
            <span className="text-xs font-mono text-slate-400">Relay: PB0</span>
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            Port B Bit 0:{" "}
            <span className={tank.isPumpOn ? "text-emerald-400 font-bold" : "text-slate-300 font-bold"}>
              {tank.isPumpOn ? "1" : "0"}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Live Signal Flow Visualization */}
      <SignalFlowDiagram
        busActivity={busActivity}
        portAValue={ppi.portA}
        portBValue={ppi.portB}
        isPumpOn={tank.isPumpOn}
        waterLevel={tank.waterLevel}
        isInconsistent={sensors.isInconsistent}
        activeInstruction={activeInstruction}
      />

      {/* 5. Comprehensive Multi-Tab Educational Workspace */}
      <div className="rounded-2xl border border-slate-800 bg-[#090e1a]/95 backdrop-blur-xl overflow-hidden shadow-2xl">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-slate-800/80 bg-slate-900/60">
          <div className="flex flex-wrap gap-2">
            {[
              { id: "guided", label: "Guided Demo (10 Stages)", icon: Sparkles },
              { id: "program", label: "Assembly Program", icon: Terminal },
              { id: "flowchart", label: "Algorithm Flowchart", icon: GitFork },
              { id: "practice", label: "Practice & Faults", icon: Sliders },
              { id: "registers", label: "CPU Registers & Flags", icon: Cpu },
              { id: "ppi", label: "8255 PPI I/O Ports", icon: Binary },
              { id: "logs", label: `Execution Log (${logs.length})`, icon: Activity },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-mono font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                    isActive
                      ? "bg-cyan-500 text-slate-950 shadow-[0_0_15px_-3px_rgba(6,182,212,0.4)] font-bold"
                      : "bg-slate-950/60 text-slate-300 hover:bg-slate-800 border border-slate-800"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
            <span>Cycle Count:</span>
            <span className="text-cyan-400 font-bold">{state.stepCount}</span>
          </div>
        </div>

        {/* Tab 1: Guided Demo Mode */}
        {activeTab === "guided" && (
          <div className="p-6">
            <GuidedDemoMode
              currentWaterLevel={tank.waterLevel}
              onSetWaterLevel={setWaterLevel}
              onStepSimulation={step}
              onPauseSimulation={pause}
              onResetSimulation={reset}
              onClearFault={() => setForceSensorInconsistency(false)}
              onSetDraining={setDraining}
              onSyncStage={syncToGuidedStage}
              isPumpOn={tank.isPumpOn}
              portAValue={ppi.portA}
              portBValue={ppi.portB}
              currentIP={registers.ip}
              activeInstructionText={activeInstruction ? `${activeInstruction.mnemonic} ${activeInstruction.operands.join(", ")}` : undefined}
              onSelectComponentToHighlight={setHighlightedComponent}
            />
          </div>
        )}

        {/* Tab 2: Assembly Program Listing & Instruction Explainer */}
        {activeTab === "program" && (
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  8086 Assembly Program Execution Pipeline
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Current IP: <span className="font-mono text-cyan-300 font-bold">0x{registers.ip.toString(16).toUpperCase().padStart(4, "0")}H</span> (Code Segment Byte Offset) &bull; Instruction #{activeInstruction?.index ?? 0} ({activeInstruction?.lengthInBytes ?? 1} byte{activeInstruction?.lengthInBytes === 1 ? "" : "s"}).
                </p>
              </div>

              {activeInstruction && (
                <Badge variant="cyan" size="sm">
                  Active: {activeInstruction.mnemonic} {activeInstruction.operands.join(", ")}
                </Badge>
              )}
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 font-mono text-xs overflow-hidden max-h-[380px] overflow-y-auto">
              {program.instructions.map((inst) => {
                const isCurrent = inst.byteOffset === registers.ip;
                return (
                  <div
                    key={inst.byteOffset}
                    className={`flex items-center gap-3 sm:gap-4 px-4 py-2.5 border-b border-slate-900 transition-colors ${
                      isCurrent
                        ? "bg-cyan-500/15 text-cyan-200 border-l-4 border-l-cyan-400"
                        : "text-slate-300 hover:bg-slate-900/50"
                    }`}
                  >
                    <span className="w-20 text-slate-400 text-[11px] select-none font-mono">
                      0x{inst.byteOffset.toString(16).toUpperCase().padStart(4, "0")}H
                    </span>

                    <span className="w-14 text-cyan-400/80 text-[10px] select-none hidden sm:inline-block">
                      #{inst.index}
                    </span>

                    <span className="w-20 text-[11px] font-mono text-slate-500 select-none hidden md:inline-block">
                      {inst.encodedBytes.join(" ")}
                    </span>

                    <span className="w-24 text-[11px] font-bold text-amber-400 select-none">
                      {inst.label ? `${inst.label}:` : ""}
                    </span>

                    <span className="w-16 font-bold text-slate-100">
                      {inst.mnemonic}
                    </span>

                    <span className="w-36 text-cyan-300 font-semibold">
                      {inst.operands.join(", ")}
                    </span>

                    <span className="text-[10px] text-slate-500 hidden lg:inline-block">
                      ({inst.lengthInBytes}B)
                    </span>

                    {isCurrent && (
                      <span className="ml-auto text-[10px] uppercase font-bold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-500/40 animate-pulse">
                        &larr; IP (0x{registers.ip.toString(16).toUpperCase().padStart(4, "0")}H)
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Instruction Explainer Panel */}
            <InstructionExplainer
              instruction={activeInstruction}
              registers={registers}
              flags={flags}
              portAValue={ppi.portA}
            />
          </div>
        )}

        {/* Tab 3: Algorithm Flowchart */}
        {activeTab === "flowchart" && (
          <div className="p-6">
            <AlgorithmFlowchart
              currentIP={registers.ip}
              activeInstruction={activeInstruction}
            />
          </div>
        )}

        {/* Tab 4: Practice Scenarios & Fault Demonstration */}
        {activeTab === "practice" && (
          <div className="p-6">
            <PracticeScenarios
              onApplyScenario={(waterLevel, isDraining, injectFault) => {
                applyPracticeScenario(waterLevel, isDraining, injectFault);
              }}
              onClearFault={() => {
                applyPracticeScenario(tank.waterLevel, tank.isDraining, false);
              }}
              isFaultActive={state.forceSensorInconsistency}
              currentWaterLevel={tank.waterLevel}
              currentPumpState={tank.isPumpOn}
              currentPortA={ppi.portA}
            />
          </div>
        )}

        {/* Tab 5: CPU Registers & Flags */}
        {activeTab === "registers" && (
          <div className="p-6 space-y-6">
            <div>
              <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-3">
                General Purpose & Pointer Registers (16-Bit & 8-Bit Aliases)
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono text-xs">
                {/* AX */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-slate-400 text-[11px]">AX (Accumulator)</div>
                  <div className="text-base font-bold text-cyan-300 mt-1">
                    0x{registers.ax.toString(16).toUpperCase().padStart(4, "0")}H
                  </div>
                  <div className="mt-1 text-[10px] text-slate-400 flex justify-between">
                    <span>AH: 0x{((registers.ax >> 8) & 0xff).toString(16).toUpperCase()}</span>
                    <span>AL: 0x{(registers.ax & 0xff).toString(16).toUpperCase()}</span>
                  </div>
                </div>

                {/* BX */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-slate-400 text-[11px]">BX (Base / Pump State)</div>
                  <div className="text-base font-bold text-emerald-300 mt-1">
                    0x{registers.bx.toString(16).toUpperCase().padStart(4, "0")}H
                  </div>
                  <div className="mt-1 text-[10px] text-slate-400 flex justify-between">
                    <span>BH: 0x{((registers.bx >> 8) & 0xff).toString(16).toUpperCase()}</span>
                    <span>BL: 0x{(registers.bx & 0xff).toString(16).toUpperCase()}</span>
                  </div>
                </div>

                {/* CX */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-slate-400 text-[11px]">CX (Counter)</div>
                  <div className="text-base font-bold text-slate-200 mt-1">
                    0x{registers.cx.toString(16).toUpperCase().padStart(4, "0")}H
                  </div>
                  <div className="mt-1 text-[10px] text-slate-400 flex justify-between">
                    <span>CH: 0x{((registers.cx >> 8) & 0xff).toString(16).toUpperCase()}</span>
                    <span>CL: 0x{(registers.cx & 0xff).toString(16).toUpperCase()}</span>
                  </div>
                </div>

                {/* DX */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-slate-400 text-[11px]">DX (Data / I/O Port)</div>
                  <div className="text-base font-bold text-amber-300 mt-1">
                    0x{registers.dx.toString(16).toUpperCase().padStart(4, "0")}H
                  </div>
                  <div className="mt-1 text-[10px] text-slate-400 flex justify-between">
                    <span>DH: 0x{((registers.dx >> 8) & 0xff).toString(16).toUpperCase()}</span>
                    <span>DL: 0x{(registers.dx & 0xff).toString(16).toUpperCase()}</span>
                  </div>
                </div>

                {/* IP */}
                <div className="p-3 rounded-xl bg-slate-950 border border-cyan-500/40">
                  <div className="text-cyan-400 text-[11px] font-bold">IP (Instruction Pointer)</div>
                  <div className="text-base font-bold text-white mt-1">
                    0x{registers.ip.toString(16).toUpperCase().padStart(4, "0")}H
                  </div>
                  <div className="mt-1 text-[10px] text-slate-400">
                    Byte Offset (Inst #{activeInstruction?.index ?? 0})
                  </div>
                </div>
              </div>
            </div>

            {/* Status Flags */}
            <div>
              <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-3">
                8086 Condition Flags (Updated by TEST Instruction)
              </h4>
              <div className="grid grid-cols-5 gap-3 font-mono text-xs">
                {[
                  { name: "ZF", label: "Zero Flag", val: flags.zf, desc: "Set when result is zero" },
                  { name: "SF", label: "Sign Flag", val: flags.sf, desc: "Set when MSB is 1" },
                  { name: "PF", label: "Parity Flag", val: flags.pf, desc: "Set when parity is even" },
                  { name: "CF", label: "Carry Flag", val: flags.cf, desc: "Cleared by TEST" },
                  { name: "OF", label: "Overflow Flag", val: flags.of, desc: "Cleared by TEST" },
                ].map((f) => (
                  <div
                    key={f.name}
                    className={`p-3 rounded-xl border ${
                      f.val
                        ? "bg-cyan-500/10 border-cyan-400/60 text-cyan-300"
                        : "bg-slate-950 border-slate-800 text-slate-400"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200">{f.name}</span>
                      <span className="text-xs font-bold">{f.val ? "1" : "0"}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">{f.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 6: 8255 PPI I/O Ports */}
        {activeTab === "ppi" && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
              {/* Port A */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">Port A (80H)</span>
                  <Badge variant="emerald" size="sm">
                    {ppi.portADirection.toUpperCase()}
                  </Badge>
                </div>
                <div className="text-2xl font-bold text-cyan-300">
                  0x{ppi.portA.toString(16).toUpperCase().padStart(2, "0")}H
                </div>
                <div className="text-[11px] text-slate-400">
                  Binary: {ppi.portA.toString(2).padStart(8, "0")}b
                </div>
                <div className="pt-2 border-t border-slate-900 space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400">PA0 (Low Probe):</span>
                    <span className="text-slate-200">{sensors.lowSensor ? "1" : "0"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">PA1 (High Probe):</span>
                    <span className="text-slate-200">{sensors.highSensor ? "1" : "0"}</span>
                  </div>
                </div>
              </div>

              {/* Port B */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">Port B (81H)</span>
                  <Badge variant="blue" size="sm">
                    {ppi.portBDirection.toUpperCase()}
                  </Badge>
                </div>
                <div className="text-2xl font-bold text-emerald-300">
                  0x{ppi.portB.toString(16).toUpperCase().padStart(2, "0")}H
                </div>
                <div className="text-[11px] text-slate-400">
                  Binary: {ppi.portB.toString(2).padStart(8, "0")}b
                </div>
                <div className="pt-2 border-t border-slate-900 space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400">PB0 (Motor Relay):</span>
                    <span className={tank.isPumpOn ? "text-emerald-400 font-bold" : "text-slate-200"}>
                      {tank.isPumpOn ? "1 (PUMP ON)" : "0 (PUMP OFF)"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Control Word Register */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">Control Word (83H)</span>
                  <Badge variant={ppi.isConfigured ? "cyan" : "amber"} size="sm">
                    {ppi.isConfigured ? "CONFIGURED" : "PENDING"}
                  </Badge>
                </div>
                <div className="text-2xl font-bold text-amber-300">
                  0x{ppi.controlWord.toString(16).toUpperCase().padStart(2, "0")}H
                </div>
                <div className="text-[11px] text-slate-400">
                  Binary: {ppi.controlWord.toString(2).padStart(8, "0")}b
                </div>
                <div className="pt-2 border-t border-slate-900 text-[11px] text-slate-400">
                  Mode 0: Port A Input, Port B Output, Port C Output
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 7: Execution Log */}
        {activeTab === "logs" && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono text-slate-400 uppercase">
                Chronological Execution Log
              </span>
              <button
                onClick={clearLogs}
                className="text-xs font-mono text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear
              </button>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 font-mono text-xs max-h-[360px] overflow-y-auto space-y-1.5">
              {logs.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  No execution steps recorded yet. Click &quot;Step 1 Inst&quot; or &quot;Run Engine&quot; to begin.
                </div>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className="p-2 rounded bg-slate-900/60 border border-slate-850 flex items-start justify-between gap-3"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 text-[11px]">#{log.stepNumber}</span>
                      <span className="text-cyan-400 font-bold">@0x{log.ip.toString(16).toUpperCase().padStart(4, "0")}H</span>
                      <span className="text-slate-200 font-bold">{log.mnemonic}</span>
                      <span className="text-slate-300">{log.description}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Full-Screen Presentation Mode Modal */}
      <PresentationMode
        isOpen={isPresentationOpen}
        onClose={() => setIsPresentationOpen(false)}
        simulationState={state}
        busActivity={busActivity}
        activeInstruction={activeInstruction}
        onStep={step}
        onTogglePlay={() => {
          if (isRunning) {
            pause();
          } else {
            start();
          }
        }}
        onReset={reset}
        onSetWaterLevel={setWaterLevel}
        onSyncStage={syncToGuidedStage}
        isRunning={isRunning}
      />
    </div>
  );
}
