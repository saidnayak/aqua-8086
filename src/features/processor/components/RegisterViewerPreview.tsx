"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Cpu } from "lucide-react";

interface RegisterItem {
  id: string;
  name: string;
  unit: "Execution Unit (EU)" | "Bus Interface Unit (BIU)";
  bits: 16;
  hexValue: string;
  binaryHigh?: string;
  binaryLow?: string;
  roleInProject: string;
  description: string;
}

const REGISTERS: RegisterItem[] = [
  {
    id: "ax",
    name: "AX (Accumulator Register)",
    unit: "Execution Unit (EU)",
    bits: 16,
    hexValue: "0090H",
    binaryHigh: "00000000",
    binaryLow: "10010000",
    roleInProject: "Holds 8255 Control Word (90H) in AL during setup; receives Port A (80H) sensor input; outputs Port B (81H) motor commands.",
    description: "Primary 16-bit accumulator partitioned into AH (high byte) and AL (low byte). IN and OUT operations target AL.",
  },
  {
    id: "bx",
    name: "BX (Base / Pump State Register)",
    unit: "Execution Unit (EU)",
    bits: 16,
    hexValue: "0001H",
    binaryHigh: "00000000",
    binaryLow: "00000001",
    roleInProject: "Low byte BL stores the hysteresis pump state (01H = Pump ON, 00H = Pump OFF) across closed-loop polling cycles.",
    description: "General-purpose 16-bit base register partitioned into BH and BL. Preserves actuator state in the hysteresis band (25%-84%).",
  },
  {
    id: "dx",
    name: "DX (Data / I/O Pointer)",
    unit: "Execution Unit (EU)",
    bits: 16,
    hexValue: "0080H",
    binaryHigh: "00000000",
    binaryLow: "10000000",
    roleInProject: "Holds 16-bit I/O port addresses: 0083H (Control Register), 0080H (Port A Sensors), and 0081H (Port B Motor Relay).",
    description: "Used by variable port addressing instructions (IN AL, DX and OUT DX, AL).",
  },
  {
    id: "ip",
    name: "IP (Instruction Pointer)",
    unit: "Bus Interface Unit (BIU)",
    bits: 16,
    hexValue: "0008H",
    roleInProject: "Tracks the authentic machine byte offset (0x0000H to 0x0022H) of the next instruction in the 36-byte firmware.",
    description: "Contains the 16-bit byte offset of the next instruction within the Code Segment. Advances by 1, 2, or 3 bytes per instruction.",
  },
  {
    id: "flags",
    name: "FLAGS (Status & Control Flags)",
    unit: "Execution Unit (EU)",
    bits: 16,
    hexValue: "0044H",
    roleInProject: "Zero Flag (ZF) updated by TEST AL, 02H and TEST AL, 01H to govern conditional branches JNZ TANK_FULL and JZ TANK_LOW.",
    description: "Contains condition flags ZF (Zero), SF (Sign), PF (Parity), CF (Carry), and OF (Overflow).",
  },
];

export function RegisterViewerPreview() {
  const [selectedReg, setSelectedReg] = useState<RegisterItem>(REGISTERS[0]);

  return (
    <Card className="border-slate-800 bg-[#090e1a]/80">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <CardTitle>8086 Register Architecture</CardTitle>
            <CardDescription>
              Internal CPU registers actively utilized in the automatic water controller algorithm
            </CardDescription>
          </div>
        </div>
        <Badge variant="cyan" size="sm">
          EU & BIU Subsystems
        </Badge>
      </CardHeader>

      <CardContent>
        {/* Register Select Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {REGISTERS.map((reg) => {
            const isSelected = selectedReg.id === reg.id;
            return (
              <button
                key={reg.id}
                onClick={() => setSelectedReg(reg)}
                className={`p-3 rounded-lg border text-left transition-all font-mono text-xs ${
                  isSelected
                    ? "bg-cyan-500/15 border-cyan-400/60 text-cyan-300 shadow-[0_0_15px_-3px_rgba(6,182,212,0.3)]"
                    : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                <div className="font-bold text-sm text-slate-100 flex items-center justify-between">
                  <span>{reg.name.split(" ")[0]}</span>
                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
                </div>
                <div className="mt-1 text-[11px] text-cyan-400/90">{reg.hexValue}</div>
                <div className="text-[10px] text-slate-400 mt-0.5 truncate">{reg.unit.split(" ")[0]}</div>
              </button>
            );
          })}
        </div>

        {/* Selected Register Detail Inspector */}
        <div className="mt-4 p-5 rounded-xl bg-slate-950/80 border border-slate-800/90">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-bold text-white">{selectedReg.name}</span>
                <Badge variant={selectedReg.unit.includes("EU") ? "cyan" : "blue"} size="sm">
                  {selectedReg.unit}
                </Badge>
              </div>
              <p className="text-xs text-slate-400 mt-1">{selectedReg.description}</p>
            </div>
            <div className="text-right font-mono">
              <span className="text-[11px] text-slate-400 uppercase">Current Hex Value</span>
              <div className="text-lg font-bold text-cyan-400">{selectedReg.hexValue}</div>
            </div>
          </div>

          {/* Project Specific Role */}
          <div className="mt-4 space-y-3">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                Functional Role in AQUA8086
              </span>
              <p className="mt-1 text-sm text-slate-200 leading-relaxed font-sans bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
                {selectedReg.roleInProject}
              </p>
            </div>

            {selectedReg.binaryHigh && (
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                  Bitwise Binary Representation (AH : AL)
                </span>
                <div className="mt-1 grid grid-cols-2 gap-2 font-mono text-xs">
                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800 flex justify-between">
                    <span className="text-slate-400">AH (High Byte):</span>
                    <span className="text-slate-200 font-bold">{selectedReg.binaryHigh}</span>
                  </div>
                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800 flex justify-between">
                    <span className="text-slate-400">AL (Low Byte):</span>
                    <span className="text-cyan-400 font-bold">{selectedReg.binaryLow}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

