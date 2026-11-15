"use client";

import React from "react";
import { Droplets, Cpu, Binary, Power, Activity } from "lucide-react";
import { SimulationTelemetry, ParsedInstruction } from "../types/simulation";

interface SignalFlowDiagramProps {
  busActivity: SimulationTelemetry["busActivity"];
  portAValue: number;
  portBValue: number;
  isPumpOn: boolean;
  waterLevel: number;
  isInconsistent?: boolean;
  activeInstruction?: ParsedInstruction;
}

export function SignalFlowDiagram({
  busActivity,
  portAValue,
  portBValue,
  isPumpOn,
  waterLevel,
  isInconsistent = false,
  activeInstruction,
}: SignalFlowDiagramProps) {
  const isInputActive = busActivity.active && busActivity.busType === "IN_READ";
  const isOutputActive = busActivity.active && busActivity.busType === "OUT_WRITE";
  const isCpuActive = !busActivity.active && activeInstruction !== undefined;

  // Derive descriptive status text
  let statusText = "System idle / waiting for clock pulse";
  if (isInconsistent) {
    statusText = "FAULT DETECTED: Inconsistent sensor input (PA=02H). Safe shutdown engaged.";
  } else if (isInputActive) {
    statusText = `INPUT CYCLE: 8086 sampling Port A (80H). Latched 0x${portAValue.toString(16).toUpperCase().padStart(2, "0")}H (${portAValue.toString(2).padStart(8, "0")}b) into AL.`;
  } else if (isOutputActive) {
    statusText = `OUTPUT CYCLE: 8086 writing to Port B (81H). Sent 0x${portBValue.toString(16).toUpperCase().padStart(2, "0")}H -> Pump Relay ${isPumpOn ? "ACTIVATED" : "DEACTIVATED"}.`;
  } else if (isCpuActive) {
    statusText = `INTERNAL CPU: 8086 executing ${activeInstruction?.mnemonic} ${activeInstruction?.operands.join(", ")} in Execution Unit ALU.`;
  } else if (isPumpOn) {
    statusText = "CLOSED-LOOP ACTIVE: Water pump running, replenishing reservoir fluid level.";
  }

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-[#090e1a]/95 border border-slate-800 backdrop-blur-xl shadow-2xl space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold font-mono text-white">
              Live Signal Path & Bus Flow Visualization
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-time hardware pipeline showing electrical and data propagation
            </p>
          </div>
        </div>

        {/* Color Legend */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>Cyan: Input</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span>Blue: CPU</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Green: Pump ON</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            <span>Grey: Standby</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>Red: Fault</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Amber: Warn</span>
          </span>
        </div>
      </div>

      {/* Signal Flow Block Pipeline */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-2 items-center font-mono text-xs">
        {/* Node 1: Water Sensors */}
        <div
          className={`p-3.5 rounded-xl border transition-all ${
            isInconsistent
              ? "bg-rose-950/40 border-rose-500 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.3)]"
              : isInputActive
              ? "bg-cyan-950/40 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.4)]"
              : "bg-slate-950 border-slate-800 text-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 uppercase">Input Source</span>
            <Droplets className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="font-bold text-white text-sm mt-1">Water Sensors</div>
          <div className="text-[11px] text-cyan-300 mt-1">
            Level: {waterLevel.toFixed(1)}%
          </div>
          <div className="text-[10px] text-slate-400">
            PA1: {waterLevel >= 85 ? "1" : "0"} | PA0: {waterLevel >= 25 ? "1" : "0"}
          </div>
        </div>

        {/* Node 2: 8255 Port A */}
        <div
          className={`p-3.5 rounded-xl border transition-all ${
            isInputActive
              ? "bg-cyan-950/50 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.4)] animate-pulse"
              : "bg-slate-950 border-slate-800 text-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 uppercase">Input Latch</span>
            <Binary className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="font-bold text-white text-sm mt-1">8255 Port A</div>
          <div className="text-[11px] text-cyan-300 mt-1 font-bold">
            0x{portAValue.toString(16).toUpperCase().padStart(2, "0")}H
          </div>
          <div className="text-[10px] text-slate-400">
            Binary: {portAValue.toString(2).padStart(8, "0")}b
          </div>
        </div>

        {/* Node 3: 8086 Microprocessor */}
        <div
          className={`p-3.5 rounded-xl border transition-all ${
            isCpuActive
              ? "bg-blue-950/50 border-blue-400 text-blue-200 shadow-[0_0_15px_rgba(59,130,246,0.4)] animate-pulse"
              : "bg-slate-950 border-slate-800 text-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 uppercase">Processing</span>
            <Cpu className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="font-bold text-white text-sm mt-1">Intel 8086 CPU</div>
          <div className="text-[11px] text-blue-300 mt-1">
            {activeInstruction ? `${activeInstruction.mnemonic} ${activeInstruction.operands[0] || ""}` : "CHECK Loop"}
          </div>
          <div className="text-[10px] text-slate-400">
            AL: 0x{portAValue.toString(16).toUpperCase().padStart(2, "0")}H | BL: 0x{portBValue.toString(16).toUpperCase().padStart(2, "0")}H
          </div>
        </div>

        {/* Node 4: 8255 Port B */}
        <div
          className={`p-3.5 rounded-xl border transition-all ${
            isOutputActive
              ? isPumpOn
                ? "bg-emerald-950/50 border-emerald-400 text-emerald-200 shadow-[0_0_15px_rgba(52,211,153,0.4)] animate-pulse"
                : "bg-slate-900 border-slate-700 text-slate-300"
              : "bg-slate-950 border-slate-800 text-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 uppercase">Output Latch</span>
            <Binary className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="font-bold text-white text-sm mt-1">8255 Port B</div>
          <div className={`text-[11px] mt-1 font-bold ${isPumpOn ? "text-emerald-300" : "text-slate-400"}`}>
            0x{portBValue.toString(16).toUpperCase().padStart(2, "0")}H
          </div>
          <div className="text-[10px] text-slate-400">
            PB0: <span className="font-bold text-white">{isPumpOn ? "1" : "0"}</span> (Relay Driver)
          </div>
        </div>

        {/* Node 5: Motor Driver & Pump */}
        <div
          className={`p-3.5 rounded-xl border transition-all ${
            isInconsistent
              ? "bg-rose-950/40 border-rose-500 text-rose-300"
              : isPumpOn
              ? "bg-emerald-950/40 border-emerald-400 text-emerald-200 shadow-[0_0_15px_rgba(52,211,153,0.3)]"
              : "bg-slate-950 border-slate-800 text-slate-400"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 uppercase">Actuator</span>
            <Power className={`w-3.5 h-3.5 ${isPumpOn ? "text-emerald-400" : "text-slate-400"}`} />
          </div>
          <div className="font-bold text-white text-sm mt-1">Water Pump</div>
          <div className={`text-[11px] mt-1 font-bold ${isPumpOn ? "text-emerald-400" : "text-slate-400"}`}>
            {isPumpOn ? "MOTOR RUNNING" : "MOTOR STANDBY"}
          </div>
          <div className="text-[10px] text-slate-400">
            Status: {isPumpOn ? "Pumping (7.5%/s)" : "Stopped"}
          </div>
        </div>
      </div>

      {/* Dynamic Activity Explanation Bar */}
      <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-850 flex items-center gap-3">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
        <span className="font-mono text-xs text-slate-300 flex-1">
          {statusText}
        </span>
      </div>
    </div>
  );
}

