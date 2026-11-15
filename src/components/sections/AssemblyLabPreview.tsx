"use client";

import React, { useState } from "react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { ASSEMBLY_PROGRAM_LISTING, SENSOR_TRUTH_TABLE } from "@/lib/simulation-spec";
import { Terminal, Table } from "lucide-react";

export function AssemblyLabPreview() {
  const [selectedLineIndex, setSelectedLineIndex] = useState(0);
  const selectedInstruction = ASSEMBLY_PROGRAM_LISTING[selectedLineIndex];

  return (
    <section id="assembly" className="py-20 md:py-28 bg-[#060913] border-t border-slate-800/80 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          badge="Assembly Lab & Firmware"
          title="Intel 8086 Assembly Program & Logic Truth Table"
          subtitle="Inspect the annotated machine instructions running in the 8086 execution pipeline to control water intake and maintain hysteresis stability."
        />

        {/* Assembly Code Inspector & Instruction Details */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-14">
          {/* Program Code Listing */}
          <div className="lg:col-span-8 rounded-xl border border-slate-800 bg-slate-950/90 overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span className="font-mono text-xs font-semibold text-slate-200">
                  WATER_CTRL.ASM • 8086 Machine Disassembly
                </span>
              </div>
              <Badge variant="cyan" size="sm">
                16-Bit Real Mode
              </Badge>
            </div>

            <div className="max-h-[460px] overflow-y-auto divide-y divide-slate-800/50 font-mono text-xs">
              {ASSEMBLY_PROGRAM_LISTING.map((line, idx) => {
                const isSelected = selectedLineIndex === idx;

                return (
                  <div
                    key={line.address}
                    onClick={() => setSelectedLineIndex(idx)}
                    className={`flex items-center gap-3 px-4 py-2.5 transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-cyan-500/15 border-l-2 border-cyan-400 text-cyan-200"
                        : "hover:bg-slate-900/60 text-slate-300"
                    }`}
                  >
                    <span className="w-20 text-[11px] text-slate-400 shrink-0 select-none">
                      {line.address}
                    </span>
                    <span className="w-24 text-[11px] text-amber-400/80 shrink-0 select-none hidden sm:inline-block">
                      {line.bytes}
                    </span>
                    <span className="w-48 font-bold text-slate-100 shrink-0">
                      {line.mnemonic}
                    </span>
                    <span className="text-slate-400 text-[11px] truncate hidden md:inline-block">
                      ; {line.comment}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Instruction Detail Panel */}
          <div className="lg:col-span-4 sticky top-28">
            <Card className="border-slate-800 bg-[#090e1a]/90 backdrop-blur-xl">
              <CardHeader>
                <div>
                  <Badge variant="cyan" size="sm">
                    Instruction Execution
                  </Badge>
                  <CardTitle className="text-lg mt-2 text-white font-mono">
                    {selectedInstruction.mnemonic}
                  </CardTitle>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 font-mono text-xs">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Physical Address:</span>
                    <span className="text-cyan-400 font-bold">{selectedInstruction.address}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Machine Opcode:</span>
                    <span className="text-amber-400 font-bold">{selectedInstruction.bytes}</span>
                  </div>
                </div>

                <div>
                  <div className="text-[11px] uppercase tracking-wider text-slate-400 mb-1">
                    Instruction Purpose
                  </div>
                  <p className="text-xs text-slate-200 font-sans leading-relaxed bg-slate-900 p-3 rounded-lg border border-slate-800">
                    {selectedInstruction.comment}
                  </p>
                </div>

                <div className="pt-2 text-[11px] font-sans text-slate-400 leading-normal border-t border-slate-800">
                  Click any assembly instruction on the left to inspect its opcode encoding, target
                  register operand, and machine cycle effect.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Hysteresis Truth Table */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-6 backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Table className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-bold text-white">
                Closed-Loop Hysteresis Truth Table
              </h3>
            </div>
            <Badge variant="emerald" size="sm">
              Deterministic Logic
            </Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[11px]">
                  <th className="py-3 px-4">Water Level Range</th>
                  <th className="py-3 px-4">Operating Condition</th>
                  <th className="py-3 px-4">PA0 (Low Probe)</th>
                  <th className="py-3 px-4">PA1 (High Probe)</th>
                  <th className="py-3 px-4">Port A Byte</th>
                  <th className="py-3 px-4">PB0 (Motor Relay)</th>
                  <th className="py-3 px-4 text-right">Controller Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {SENSOR_TRUTH_TABLE.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/50">
                    <td className="py-3 px-4 font-bold text-white">{row.waterRange}</td>
                    <td className="py-3 px-4 font-sans text-slate-300">{row.condition}</td>
                    <td className="py-3 px-4 text-cyan-400 font-bold">{row.pa0}</td>
                    <td className="py-3 px-4 text-cyan-400 font-bold">{row.pa1}</td>
                    <td className="py-3 px-4 text-amber-400 font-bold">{row.portAHex}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded font-bold ${
                          row.pb0 === 1
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                            : "bg-slate-800 text-slate-400 border border-slate-700"
                        }`}
                      >
                        {row.pb0 === 1 ? "1 (ON)" : "0 (OFF)"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-sans font-semibold text-cyan-300">
                      {row.action}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

