"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Sparkles,
  Layers,
  CheckCircle2,
  Terminal,
  Droplets,
  HelpCircle,
} from "lucide-react";
import { GUIDED_STAGES } from "../constants/guided-stages";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface GuidedDemoModeProps {
  currentWaterLevel: number;
  onSetWaterLevel: (level: number) => void;
  onStepSimulation: () => void;
  onPauseSimulation: () => void;
  onResetSimulation: () => void;
  onClearFault?: () => void;
  onSetDraining?: (draining: boolean) => void;
  onSyncStage?: (stageNumber: number) => void;
  isPumpOn: boolean;
  portAValue: number;
  portBValue: number;
  currentIP?: number;
  activeInstructionText?: string;
  onSelectComponentToHighlight?: (component: string) => void;
}

export function GuidedDemoMode({
  onSetWaterLevel,
  onPauseSimulation,
  onClearFault,
  onSetDraining,
  onSyncStage,
  isPumpOn,
  portAValue,
  portBValue,
  currentIP = 0,
  activeInstructionText,
  onSelectComponentToHighlight,
}: GuidedDemoModeProps) {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoPlayInterval, setAutoPlayInterval] = useState(5); // seconds
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const stage = GUIDED_STAGES[currentStageIndex];

  // Sync stage to real engine whenever stage changes
  const applyStage = useCallback((index: number) => {
    const targetStage = GUIDED_STAGES[index];
    if (onSyncStage) {
      onSyncStage(targetStage.stageNumber);
    } else {
      onPauseSimulation();
      if (onClearFault) onClearFault();
      if (onSetDraining) onSetDraining(targetStage.signalFlowType === "DRAINING");
      onSetWaterLevel(targetStage.targetWaterLevel);
    }
    if (onSelectComponentToHighlight) {
      onSelectComponentToHighlight(targetStage.highlightedComponent);
    }
  }, [onSyncStage, onPauseSimulation, onClearFault, onSetDraining, onSetWaterLevel, onSelectComponentToHighlight]);

  const handleNext = useCallback(() => {
    if (currentStageIndex < GUIDED_STAGES.length - 1) {
      const nextIndex = currentStageIndex + 1;
      setCurrentStageIndex(nextIndex);
      applyStage(nextIndex);
    } else {
      setIsPlaying(false);
    }
  }, [currentStageIndex, applyStage]);

  const handlePrev = useCallback(() => {
    if (currentStageIndex > 0) {
      const prevIndex = currentStageIndex - 1;
      setCurrentStageIndex(prevIndex);
      applyStage(prevIndex);
    }
  }, [currentStageIndex, applyStage]);

  const handleSelectStage = (index: number) => {
    setCurrentStageIndex(index);
    applyStage(index);
  };

  const toggleAutoPlay = () => {
    setIsPlaying((prev) => !prev);
  };

  const handleRestart = () => {
    setCurrentStageIndex(0);
    applyStage(0);
  };

  // Auto-play effect
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setTimeout(() => {
        if (currentStageIndex < GUIDED_STAGES.length - 1) {
          handleNext();
        } else {
          setIsPlaying(false);
        }
      }, autoPlayInterval * 1000);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isPlaying, currentStageIndex, autoPlayInterval, handleNext]);

  return (
    <div className="rounded-2xl border border-cyan-500/30 bg-[#080d1a]/95 backdrop-blur-xl shadow-2xl p-5 sm:p-7 space-y-6">
      {/* Header with Title and Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-bold text-white font-mono">
                Interactive Guided Demonstration Mode
              </h3>
              <Badge variant="cyan" size="sm">
                Stage {stage.stageNumber} of {GUIDED_STAGES.length}
              </Badge>
              <Badge variant="blue" size="sm">
                Guided Scenario • Authentic Engine Execution
              </Badge>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Step-by-step educational walkthrough powered by genuine 8086 execution
            </p>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant={isPlaying ? "secondary" : "primary"}
            size="sm"
            onClick={toggleAutoPlay}
            icon={isPlaying ? <Pause className="w-4 h-4 text-amber-400" /> : <Play className="w-4 h-4 fill-current" />}
          >
            {isPlaying ? "Pause Auto-Play" : "Auto-Play Demo"}
          </Button>

          {/* Speed selector for autoplay */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1 text-[11px] font-mono">
            <span className="text-slate-400 px-1.5">Timer:</span>
            {[3, 5, 8].map((sec) => (
              <button
                key={sec}
                onClick={() => setAutoPlayInterval(sec)}
                className={`px-1.5 py-0.5 rounded cursor-pointer ${
                  autoPlayInterval === sec ? "bg-cyan-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"
                }`}
              >
                {sec}s
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRestart}
            icon={<RotateCcw className="w-3.5 h-3.5" />}
            title="Restart Guided Tour"
          >
            Restart
          </Button>
        </div>
      </div>

      {/* 10-Stage Visual Timeline Progress Tracker */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
          <span>PROGRESS TIMELINE</span>
          <span className="text-cyan-400 font-bold">
            {Math.round(((currentStageIndex + 1) / GUIDED_STAGES.length) * 100)}% Complete
          </span>
        </div>
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
          {GUIDED_STAGES.map((s, idx) => {
            const isCurrent = idx === currentStageIndex;
            const isPast = idx < currentStageIndex;
            return (
              <button
                key={s.id}
                onClick={() => handleSelectStage(idx)}
                className={`py-2 px-1 rounded-lg text-center font-mono text-[11px] transition-all cursor-pointer border ${
                  isCurrent
                    ? "bg-cyan-500 text-slate-950 font-bold border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.5)]"
                    : isPast
                    ? "bg-cyan-950/40 text-cyan-300 border-cyan-800/60 hover:bg-cyan-900/40"
                    : "bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700"
                }`}
                title={`Stage ${s.stageNumber}: ${s.title}`}
              >
                <div className="text-[10px] opacity-75">S{s.stageNumber}</div>
                <div className="truncate text-[9px] hidden sm:block">
                  {s.id.split("-")[0]}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Educational Card for Current Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Educational Narrative (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                {stage.title}
              </span>
              <Badge variant="blue" size="sm">
                Target: {stage.targetWaterLevel}% Water
              </Badge>
            </div>

            {/* Student Explanation */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
                <span>Student Explanation:</span>
              </div>
              <p className="text-sm text-slate-200 leading-relaxed font-sans bg-slate-900/60 p-3.5 rounded-lg border border-slate-800/80">
                {stage.studentExplanation}
              </p>
            </div>

            {/* Technical Explanation */}
            <div className="space-y-1 pt-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                <Terminal className="w-3.5 h-3.5 text-amber-400" />
                <span>Technical & Register Mechanics:</span>
              </div>
              <p className="text-xs text-slate-400 font-mono leading-relaxed bg-slate-900/40 p-3 rounded-lg border border-slate-850">
                {stage.technicalExplanation}
              </p>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="outline"
              size="md"
              onClick={handlePrev}
              disabled={currentStageIndex === 0}
              icon={<ChevronLeft className="w-4 h-4" />}
            >
              Previous Stage
            </Button>

            <div className="text-xs font-mono text-slate-400">
              Stage <span className="text-white font-bold">{currentStageIndex + 1}</span> of {GUIDED_STAGES.length}
            </div>

            <Button
              variant="primary"
              size="md"
              onClick={handleNext}
              disabled={currentStageIndex === GUIDED_STAGES.length - 1}
              icon={<ChevronRight className="w-4 h-4" />}
            >
              Next Stage
            </Button>
          </div>
        </div>

        {/* Right Column: Live Stage Hardware State & Registers (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Active Component & Instruction Card */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Key Instruction Executed</span>
              <Badge variant="cyan" size="sm">8086 Assembly</Badge>
            </div>
            <div className="p-3 rounded-lg bg-cyan-950/20 border border-cyan-500/30 font-mono text-sm font-bold text-cyan-300 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>{stage.relevantInstruction}</span>
            </div>

            {activeInstructionText && (
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs flex items-center justify-between">
                <span className="text-slate-400">
                  Live CPU @ IP 0x{currentIP.toString(16).toUpperCase().padStart(4, "0")}H:
                </span>
                <span className="text-cyan-400 font-bold">{activeInstructionText}</span>
              </div>
            )}

            <div className="pt-2 border-t border-slate-850 text-xs font-mono space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Highlighted 3D Subsystem:</span>
                <span className="text-amber-400 font-bold uppercase">{stage.highlightedComponent}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Signal Bus Transaction:</span>
                <span className="text-emerald-400 font-bold">{stage.signalFlowType}</span>
              </div>
            </div>
          </div>

          {/* Real-Time Live State Comparison */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 uppercase tracking-wider text-[11px]">Hardware Verification</span>
              <div className="flex items-center gap-1.5 text-emerald-400 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Live Synchronized</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {/* Port A */}
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <div className="text-slate-400 text-[10px]">Port A (Sensors)</div>
                <div className="text-sm font-bold text-cyan-300 mt-0.5">
                  0x{portAValue.toString(16).toUpperCase().padStart(2, "0")}H
                </div>
                <div className="text-[10px] text-slate-400">
                  Target: 0x{stage.targetPortA.toString(16).toUpperCase().padStart(2, "0")}H
                </div>
              </div>

              {/* Port B */}
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <div className="text-slate-400 text-[10px]">Port B (Pump Output)</div>
                <div className="text-sm font-bold text-emerald-300 mt-0.5">
                  0x{portBValue.toString(16).toUpperCase().padStart(2, "0")}H
                </div>
                <div className="text-[10px] text-slate-400">
                  Target: 0x{stage.targetPortB.toString(16).toUpperCase().padStart(2, "0")}H
                </div>
              </div>
            </div>

            {/* Pump Relay Status */}
            <div className="p-2.5 rounded bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Droplets className="w-4 h-4 text-cyan-400" />
                <span className="text-slate-300">Pump Actuator State:</span>
              </div>
              <span className={`font-bold ${isPumpOn ? "text-emerald-400" : "text-slate-400"}`}>
                {isPumpOn ? "RUNNING (PB0=1)" : "STOPPED (PB0=0)"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

