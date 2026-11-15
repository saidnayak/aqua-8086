"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  HelpCircle,
  Terminal,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { GUIDED_STAGES } from "@/features/simulation/constants/guided-stages";
import { SimulationCanvasPreview } from "@/features/simulation/components/SimulationCanvasPreview";
import { SimulationTelemetry, ParsedInstruction } from "@/features/simulation/types/simulation";
import { IntegratedState } from "@/features/simulation/engine/execution";

interface PresentationModeProps {
  isOpen: boolean;
  onClose: () => void;
  simulationState: IntegratedState;
  busActivity: SimulationTelemetry["busActivity"];
  activeInstruction?: ParsedInstruction;
  onStep: () => void;
  onTogglePlay: () => void;
  onReset: () => void;
  onSetWaterLevel: (level: number) => void;
  onSyncStage?: (stageNumber: number) => void;
  isRunning: boolean;
}

export function PresentationMode({
  isOpen,
  onClose,
  simulationState,
  busActivity,
  activeInstruction,
  onStep,
  onTogglePlay,
  onReset,
  onSetWaterLevel,
  onSyncStage,
  isRunning,
}: PresentationModeProps) {
  const [currentStageIdx, setCurrentStageIdx] = useState(0);

  const stage = GUIDED_STAGES[currentStageIdx];

  const handleNext = useCallback(() => {
    if (currentStageIdx < GUIDED_STAGES.length - 1) {
      const nextIdx = currentStageIdx + 1;
      setCurrentStageIdx(nextIdx);
      if (onSyncStage) {
        onSyncStage(GUIDED_STAGES[nextIdx].stageNumber);
      } else {
        onSetWaterLevel(GUIDED_STAGES[nextIdx].targetWaterLevel);
      }
    }
  }, [currentStageIdx, onSyncStage, onSetWaterLevel]);

  const handlePrev = useCallback(() => {
    if (currentStageIdx > 0) {
      const prevIdx = currentStageIdx - 1;
      setCurrentStageIdx(prevIdx);
      if (onSyncStage) {
        onSyncStage(GUIDED_STAGES[prevIdx].stageNumber);
      } else {
        onSetWaterLevel(GUIDED_STAGES[prevIdx].targetWaterLevel);
      }
    }
  }, [currentStageIdx, onSyncStage, onSetWaterLevel]);

  // Keyboard shortcut listener for slides (Left/Right arrows, Space for play/pause, Esc to close)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent shortcut interception when typing in input/textarea
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === " ") {
        e.preventDefault();
        onTogglePlay();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleNext, handlePrev, onClose, onTogglePlay]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#040711] text-slate-100 flex flex-col overflow-hidden">
      {/* Top Presentation Bar */}
      <header className="h-14 px-6 border-b border-slate-800/90 bg-[#070b16]/95 backdrop-blur-xl flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-base font-bold text-white tracking-wider">AQUA8086</span>
            <span className="text-slate-500">/</span>
            <span className="text-xs font-mono font-bold text-cyan-400 uppercase">
              Faculty Classroom Presentation Mode
            </span>
          </div>
          <Badge variant="cyan" size="sm">
            Stage {stage.stageNumber} of {GUIDED_STAGES.length}
          </Badge>
        </div>

        {/* Global Controls & Exit */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 text-[11px] font-mono text-slate-400 mr-2">
            <span>&larr; / &rarr; Slides</span>
            <span>&bull;</span>
            <span>Space: Run/Pause</span>
            <span>&bull;</span>
            <span>Esc: Exit</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            icon={<X className="w-4 h-4 text-rose-400" />}
          >
            Exit Presentation
          </Button>
        </div>
      </header>

      {/* Main Presentation Viewport: 3D Scene + Explanation Side-by-Side */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 overflow-hidden">
        {/* Left Column: Prominent 3D Simulation Environment (7 cols) */}
        <div className="lg:col-span-7 relative bg-[#040711] flex flex-col min-h-0 border-r border-slate-800/80">
          <div className="flex-1 relative">
            <SimulationCanvasPreview
              simulationState={simulationState}
              busActivity={busActivity}
              activeInstruction={activeInstruction}
            />

            {/* Overlaid Minimal Stage HUD */}
            <div className="absolute top-4 left-4 p-3 rounded-xl bg-slate-950/80 border border-slate-800 backdrop-blur-md pointer-events-none space-y-1 font-mono text-xs">
              <div className="text-[10px] text-slate-400 uppercase">Current Subsystem Highlight</div>
              <div className="text-sm font-bold text-cyan-300 uppercase">
                {stage.highlightedComponent}
              </div>
              <div className="text-[11px] text-slate-300">
                Reservoir: <span className="text-cyan-400 font-bold">{simulationState.tank.waterLevel.toFixed(1)}%</span> | Pump:{" "}
                <span className={simulationState.tank.isPumpOn ? "text-emerald-400 font-bold" : "text-slate-400"}>
                  {simulationState.tank.isPumpOn ? "ON" : "OFF"}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Playback Toolbar */}
          <div className="h-16 px-6 border-t border-slate-800 bg-[#070b16]/95 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrev}
                disabled={currentStageIdx === 0}
                icon={<ChevronLeft className="w-4 h-4" />}
              >
                Previous
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleNext}
                disabled={currentStageIdx === GUIDED_STAGES.length - 1}
                icon={<ChevronRight className="w-4 h-4" />}
              >
                Next Stage
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={isRunning ? "secondary" : "primary"}
                size="sm"
                onClick={onTogglePlay}
                icon={isRunning ? <Pause className="w-4 h-4 text-amber-400" /> : <Play className="w-4 h-4 fill-current" />}
              >
                {isRunning ? "Pause Engine" : "Run Continuous"}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={onStep}
                disabled={isRunning}
              >
                Step 1 Inst
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={onReset}
                icon={<RotateCcw className="w-3.5 h-3.5" />}
              >
                Reset
              </Button>
            </div>
          </div>
        </div>

        {/* Right Column: Educational Narrative & Live Register State (5 cols) */}
        <div className="lg:col-span-5 p-6 flex flex-col justify-between overflow-y-auto space-y-6 bg-[#070b16]">
          <div className="space-y-4">
            <div className="space-y-1">
              <Badge variant="cyan" size="sm">
                Stage {stage.stageNumber} of 10
              </Badge>
              <h2 className="text-xl font-bold font-mono text-white mt-1">
                {stage.title}
              </h2>
            </div>

            {/* Student-Friendly Explanation */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 font-mono">
                <HelpCircle className="w-4 h-4" />
                <span>Student Concept:</span>
              </div>
              <p className="text-sm text-slate-200 leading-relaxed font-sans">
                {stage.studentExplanation}
              </p>
            </div>

            {/* Technical Hardware Mechanics */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400 font-mono">
                <Terminal className="w-4 h-4" />
                <span>8086 Instruction & Register Mechanics:</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-mono">
                {stage.technicalExplanation}
              </p>
            </div>

            {/* Key Relevant Instruction & Active CPU Instruction Panel */}
            <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/40 space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Stage Target Assembly:</span>
                <span className="text-cyan-300 font-bold">{stage.relevantInstruction}</span>
              </div>
              {activeInstruction && (
                <div className="flex items-center justify-between pt-1.5 border-t border-cyan-500/20 text-[11px]">
                  <span className="text-slate-400">
                    Active CPU @ IP 0x{simulationState.registers.ip.toString(16).toUpperCase().padStart(4, "0")}H (#{activeInstruction.index}):
                  </span>
                  <span className="text-white font-bold">
                    {activeInstruction.mnemonic} {activeInstruction.operands.join(", ")} ({activeInstruction.encodedBytes.join(" ")})
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Live Register & Sensor Inspector */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-bold text-slate-400">
                Live Microprocessor, Sensor & Actuator Telemetry
              </span>
              <span
                className={`text-[11px] font-bold ${
                  simulationState.tank.isPumpOn ? "text-emerald-400" : "text-slate-400"
                }`}
              >
                Pump (PB0): {simulationState.tank.isPumpOn ? "ON (1)" : "OFF (0)"}
              </span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
              <div className="p-2 rounded bg-slate-900 border border-slate-850">
                <span className="text-[10px] text-slate-400">AL</span>
                <div className="text-cyan-300 font-bold mt-0.5">
                  0x{(simulationState.registers.ax & 0xff).toString(16).toUpperCase().padStart(2, "0")}H
                </div>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-850">
                <span className="text-[10px] text-slate-400">BL</span>
                <div className="text-emerald-300 font-bold mt-0.5">
                  0x{(simulationState.registers.bx & 0xff).toString(16).toUpperCase().padStart(2, "0")}H
                </div>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-850">
                <span className="text-[10px] text-slate-400">DX</span>
                <div className="text-amber-300 font-bold mt-0.5">
                  0x{simulationState.registers.dx.toString(16).toUpperCase().padStart(2, "0")}H
                </div>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-850">
                <span className="text-[10px] text-slate-400">IP</span>
                <div className="text-white font-bold mt-0.5">
                  0x{simulationState.registers.ip.toString(16).toUpperCase().padStart(4, "0")}H
                </div>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-850">
                <span className="text-[10px] text-slate-400">ZF</span>
                <div className="text-cyan-200 font-bold mt-0.5">
                  {simulationState.flags.zf ? "1" : "0"}
                </div>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-850">
                <span className="text-[10px] text-slate-400">Port A</span>
                <div className="text-cyan-400 font-bold mt-0.5">
                  0x{simulationState.ppi.portA.toString(16).toUpperCase().padStart(2, "0")}H
                </div>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-900 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
              <span>
                Low Probe (PA0):{" "}
                <strong className={simulationState.sensors.lowSensor ? "text-cyan-300" : "text-slate-400"}>
                  {simulationState.sensors.lowSensor ? "1 (Wet)" : "0 (Dry)"}
                </strong>
              </span>
              <span>
                High Probe (PA1):{" "}
                <strong className={simulationState.sensors.highSensor ? "text-amber-300" : "text-slate-400"}>
                  {simulationState.sensors.highSensor ? "1 (Wet)" : "0 (Dry)"}
                </strong>
              </span>
              <span>
                Port B (81H):{" "}
                <strong className={simulationState.tank.isPumpOn ? "text-emerald-400" : "text-slate-300"}>
                  0x{simulationState.ppi.portB.toString(16).toUpperCase().padStart(2, "0")}H
                </strong>
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
