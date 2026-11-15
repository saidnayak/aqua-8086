"use client";

import React from "react";
import { ArrowDown, RotateCw, GitFork, ListOrdered } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { ParsedInstruction } from "../types/simulation";

interface AlgorithmFlowchartProps {
  currentIP: number;
  activeInstruction?: ParsedInstruction;
}

export function AlgorithmFlowchart({ currentIP, activeInstruction }: AlgorithmFlowchartProps) {
  // Use instruction index for robust flowchart mapping, while displaying genuine byte offset IP:
  // Index 0..2: Configure 8255 (MOV AL, 90H; MOV DX, 83H; OUT DX, AL)
  // Index 3: Init BL=0 (MOV BL, 00H)
  // Index 4..5: Read sensor (MOV DX, 80H; IN AL, DX)
  // Index 6..7: Test High Sensor (TEST AL, 02H; JNZ TANK_FULL)
  // Index 8..9: Test Low Sensor (TEST AL, 01H; JZ TANK_LOW)
  // Index 10: Retain State (JMP UPDATE)
  // Index 11..12: Pump ON branch (MOV BL, 01H; JMP UPDATE)
  // Index 13: Pump OFF branch (MOV BL, 00H)
  // Index 14..16: Send Output (MOV DX, 81H; MOV AL, BL; OUT DX, AL)
  // Index 17: Repeat (JMP CHECK)

  const idx = activeInstruction?.index ?? 0;

  const isConfigActive = idx >= 0 && idx <= 3;
  const isReadActive = idx >= 4 && idx <= 5;
  const isHighTestActive = idx >= 6 && idx <= 7;
  const isLowTestActive = idx >= 8 && idx <= 9;
  const isRetainNodeActive = idx === 10;
  const isPumpOnNodeActive = idx === 11 || idx === 12;
  const isPumpOffNodeActive = idx === 13;
  const isOutputNodeActive = idx >= 14 && idx <= 16;
  const isRepeatActive = idx === 17;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start font-mono text-xs">
      {/* Flowchart Diagram (7 cols) */}
      <div className="lg:col-span-7 p-5 sm:p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <GitFork className="w-4 h-4 text-cyan-400" />
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              8086 Assembly Program Logic Flowchart
            </h4>
          </div>
          <Badge variant="cyan" size="sm">
            {activeInstruction ? `${activeInstruction.mnemonic} ${activeInstruction.operands.join(", ")}` : "Live Execution Tracking"}
          </Badge>
        </div>

        {/* Vertical Flow Diagram Nodes */}
        <div className="space-y-3 flex flex-col items-center">
          {/* Node 1: START & Configure 8255 */}
          <div
            className={`w-full max-w-md p-3 rounded-xl border text-center transition-all ${
              isConfigActive
                ? "bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                : "bg-slate-900 border-slate-800 text-slate-300"
            }`}
          >
            <div className="font-bold text-white flex items-center justify-center gap-2">
              <span>START: Configure 8255 PPI</span>
              {isConfigActive && <span className="text-[10px] bg-cyan-950 text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-500/40">IP: 0x{currentIP.toString(16).toUpperCase().padStart(4, "0")}H</span>}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              MOV AL, 90H &rarr; OUT 83H, AL (Mode 0: Port A IN, Port B OUT)
            </div>
          </div>

          <ArrowDown className="w-4 h-4 text-slate-500" />

          {/* Node 2: Read Sensor Input */}
          <div
            className={`w-full max-w-md p-3 rounded-xl border text-center transition-all ${
              isReadActive
                ? "bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                : "bg-slate-900 border-slate-800 text-slate-300"
            }`}
          >
            <div className="font-bold text-white flex items-center justify-center gap-2">
              <span>CHECK: Read Sensor Input</span>
              {isReadActive && <span className="text-[10px] bg-cyan-950 text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-500/40">IP: 0x{currentIP.toString(16).toUpperCase().padStart(4, "0")}H</span>}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              MOV DX, 80H &rarr; IN AL, DX (Read Port A probes into AL)
            </div>
          </div>

          <ArrowDown className="w-4 h-4 text-slate-500" />

          {/* Node 3: Decision 1 - High Sensor Active? */}
          <div
            className={`w-full max-w-md p-3 rounded-xl border text-center transition-all ${
              isHighTestActive
                ? "bg-amber-500/20 border-amber-400 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                : "bg-slate-900 border-slate-800 text-slate-300"
            }`}
          >
            <div className="font-bold text-white flex items-center justify-center gap-2">
              <span>Is High Sensor Active? (TEST AL, 02H)</span>
              {isHighTestActive && <span className="text-[10px] bg-amber-950 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/40">IP: 0x{currentIP.toString(16).toUpperCase().padStart(4, "0")}H</span>}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Checks bit 1 (PA1). If non-zero (ZF=0), tank is full &ge;85%
            </div>
          </div>

          {/* Branch Split 1 */}
          <div className="w-full max-w-md grid grid-cols-2 gap-2 text-center text-[11px]">
            <div
              className={`p-2.5 rounded-lg border transition-all ${
                isPumpOffNodeActive
                  ? "bg-rose-500/20 border-rose-400 text-rose-200 font-bold shadow-[0_0_12px_rgba(244,63,94,0.4)]"
                  : "bg-slate-900/60 border-slate-800 text-slate-400"
              }`}
            >
              <span className="text-emerald-400 font-bold">YES &rarr;</span> TANK_FULL: MOV BL, 00H (Pump OFF)
            </div>
            <div className="p-2.5 rounded-lg border bg-slate-900/60 border-slate-800 text-slate-400">
              <span className="text-cyan-400 font-bold">NO &rarr;</span> Fall through to Low Check
            </div>
          </div>

          <ArrowDown className="w-4 h-4 text-slate-500" />

          {/* Node 4: Decision 2 - Low Sensor Inactive? */}
          <div
            className={`w-full max-w-md p-3 rounded-xl border text-center transition-all ${
              isLowTestActive
                ? "bg-amber-500/20 border-amber-400 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                : "bg-slate-900 border-slate-800 text-slate-300"
            }`}
          >
            <div className="font-bold text-white flex items-center justify-center gap-2">
              <span>Is Low Sensor Inactive? (TEST AL, 01H)</span>
              {isLowTestActive && <span className="text-[10px] bg-amber-950 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/40">IP: 0x{currentIP.toString(16).toUpperCase().padStart(4, "0")}H</span>}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Checks bit 0 (PA0). If zero (ZF=1), water is below 25%
            </div>
          </div>

          {/* Branch Split 2 */}
          <div className="w-full max-w-md grid grid-cols-2 gap-2 text-center text-[11px]">
            <div
              className={`p-2.5 rounded-lg border transition-all ${
                isPumpOnNodeActive
                  ? "bg-emerald-500/20 border-emerald-400 text-emerald-200 font-bold shadow-[0_0_12px_rgba(52,211,153,0.4)]"
                  : "bg-slate-900/60 border-slate-800 text-slate-400"
              }`}
            >
              <span className="text-emerald-400 font-bold">YES &rarr;</span> TANK_LOW: MOV BL, 01H (Pump ON)
            </div>
            <div
              className={`p-2.5 rounded-lg border transition-all ${
                isRetainNodeActive
                  ? "bg-blue-500/20 border-blue-400 text-blue-200 font-bold"
                  : "bg-slate-900/60 border-slate-800 text-slate-400"
              }`}
            >
              <span className="text-cyan-400 font-bold">NO &rarr;</span> Retain previous BL (Hysteresis)
            </div>
          </div>

          <ArrowDown className="w-4 h-4 text-slate-500" />

          {/* Node 5: UPDATE - Send Output */}
          <div
            className={`w-full max-w-md p-3 rounded-xl border text-center transition-all ${
              isOutputNodeActive
                ? "bg-emerald-500/20 border-emerald-400 text-emerald-200 shadow-[0_0_15px_rgba(52,211,153,0.4)]"
                : "bg-slate-900 border-slate-800 text-slate-300"
            }`}
          >
            <div className="font-bold text-white flex items-center justify-center gap-2">
              <span>UPDATE: Output Command to 8255</span>
              {isOutputNodeActive && <span className="text-[10px] bg-emerald-950 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/40">IP: 0x{currentIP.toString(16).toUpperCase().padStart(4, "0")}H</span>}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              MOV DX, 81H &rarr; MOV AL, BL &rarr; OUT DX, AL (Actuates Relay)
            </div>
          </div>

          <ArrowDown className="w-4 h-4 text-slate-500" />

          {/* Node 6: Loop Repeat */}
          <div
            className={`w-full max-w-md p-2.5 rounded-xl border text-center transition-all ${
              isRepeatActive
                ? "bg-cyan-500/20 border-cyan-400 text-cyan-200"
                : "bg-slate-900/60 border-slate-800 text-slate-400"
            }`}
          >
            <div className="font-bold flex items-center justify-center gap-1.5 text-slate-200">
              <RotateCw className="w-3.5 h-3.5 text-cyan-400" />
              <span>JMP CHECK: Repeat Continuous Polling Loop</span>
            </div>
          </div>
        </div>
      </div>

      {/* Numbered Algorithm Panel (5 cols) */}
      <div className="lg:col-span-5 p-5 sm:p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
          <ListOrdered className="w-4 h-4 text-cyan-400" />
          <h4 className="text-sm font-bold text-white uppercase tracking-wider">
            Numbered Engineering Algorithm
          </h4>
        </div>

        <ol className="space-y-3 text-slate-300 font-sans text-xs">
          {[
            {
              step: "1. Hardware Initialization",
              desc: "Load Control Word 90H into AL and write to 8255 Control Register (83H) to configure Port A as Input and Port B as Output in Mode 0.",
            },
            {
              step: "2. Initial Pump State",
              desc: "Initialize Base Register BL to 00H, representing the default pump standby state (motor OFF).",
            },
            {
              step: "3. Acquire Sensor Data",
              desc: "Read Port A into register AL via IN AL, DX with DX pointing to 80H. Bit 0 represents low sensor (PA0) and bit 1 represents high sensor (PA1).",
            },
            {
              step: "4. Full-Tank Threshold Check",
              desc: "Perform bitwise TEST AL, 02H. If bit 1 is set (non-zero), branch via JNZ TANK_FULL to load BL = 00H and stop the pump.",
            },
            {
              step: "5. Low-Tank Threshold Check",
              desc: "If high sensor is dry, perform bitwise TEST AL, 01H. If bit 0 is cleared (zero), branch via JZ TANK_LOW to load BL = 01H and start the pump.",
            },
            {
              step: "6. Hysteresis Retention",
              desc: "If neither threshold is triggered (water level between 25% and 85%), bypass both state updates and preserve existing BL value.",
            },
            {
              step: "7. Actuator Command Emission",
              desc: "Transfer BL to AL and execute OUT DX, AL to Port B (81H) to energize or de-energize the motor relay.",
            },
            {
              step: "8. Continuous Repetition",
              desc: "Execute JMP CHECK to return to Step 3, sustaining an autonomous, infinite closed-loop monitoring cycle.",
            },
          ].map((item, idx) => (
            <li key={idx} className="p-3 rounded-lg bg-slate-900/60 border border-slate-850 space-y-1">
              <span className="font-bold font-mono text-cyan-300 block">{item.step}</span>
              <p className="text-slate-400 text-[11px] leading-relaxed">{item.desc}</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

