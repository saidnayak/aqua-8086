"use client";

import React, { useState } from "react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { ARCHITECTURE_STAGES } from "@/lib/constants";
import { ArchitectureBlock } from "@/types";
import {
  ArrowDown,
  Waves,
  Binary,
  Cpu,
  Zap,
  Power,
  Share2,
} from "lucide-react";

export function SystemArchitecture() {
  const [selectedStage, setSelectedStage] = useState<ArchitectureBlock>(ARCHITECTURE_STAGES[0]);

  const getStageIcon = (id: string) => {
    switch (id) {
      case "sensors":
        return Waves;
      case "ppi-in":
        return Binary;
      case "cpu-8086":
        return Cpu;
      case "ppi-out":
        return Binary;
      case "motor-driver":
        return Zap;
      case "water-pump":
        return Power;
      default:
        return Share2;
    }
  };

  return (
    <section id="architecture" className="py-20 md:py-28 bg-[#070b14] border-t border-slate-800/80 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          badge="End-to-End Signal Pipeline"
          title="System Architecture & Data Flow"
          subtitle="Explore the sequential hardware pipeline from fluid sensor conductivity through 8255 parallel port mapping to the 8086 CPU and high-power motor actuator."
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Conceptual Block Diagram Column */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between px-2 mb-2">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                Architectural Signal Pipeline
              </span>
              <span className="text-xs font-mono text-cyan-400">Click a stage to inspect</span>
            </div>

            {ARCHITECTURE_STAGES.map((stage, index) => {
              const Icon = getStageIcon(stage.id);
              const isSelected = selectedStage.id === stage.id;
              const isLast = index === ARCHITECTURE_STAGES.length - 1;

              return (
                <React.Fragment key={stage.id}>
                  <div
                    onClick={() => setSelectedStage(stage)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                      isSelected
                        ? "bg-slate-900 border-cyan-400 shadow-[0_0_20px_-5px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400/50"
                        : "bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60"
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${
                          isSelected
                            ? "bg-cyan-500/20 border-cyan-400 text-cyan-300"
                            : "bg-slate-900 border-slate-800 text-slate-400"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-slate-400">
                            STAGE 0{stage.order}
                          </span>
                          <span className="text-slate-400">•</span>
                          <span className="text-xs font-mono text-cyan-400">
                            {stage.dataDirection}
                          </span>
                        </div>
                        <h4 className="text-base font-semibold text-white mt-0.5">
                          {stage.title}
                        </h4>
                      </div>
                    </div>

                    <div className="hidden sm:flex items-center gap-2 font-mono text-xs text-slate-400">
                      <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800">
                        {stage.signalNames[0]}
                      </span>
                    </div>
                  </div>

                  {/* Flow Arrow */}
                  {!isLast && (
                    <div className="flex justify-center py-0.5">
                      <div className="flex items-center gap-2 text-cyan-400/70 font-mono text-xs">
                        <ArrowDown className="w-4 h-4 animate-bounce" />
                      </div>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Detailed Stage Inspector Panel */}
          <div className="lg:col-span-5 sticky top-28">
            <Card className="border-slate-800 bg-[#090e1a]/90 backdrop-blur-xl shadow-2xl">
              <CardHeader>
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="cyan" size="sm">
                      Stage 0{selectedStage.order} Detail
                    </Badge>
                    <Badge variant="slate" size="sm">
                      {selectedStage.dataDirection}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl mt-2 text-white">
                    {selectedStage.title}
                  </CardTitle>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800/80">
                  <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                    Functional Role
                  </div>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                    {selectedStage.role}
                  </p>
                </div>

                <div className="space-y-2.5 font-mono text-xs">
                  <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800 flex justify-between items-center">
                    <span className="text-slate-400">Interface Spec:</span>
                    <span className="text-cyan-300 font-medium text-right">
                      {selectedStage.interfaceDetails}
                    </span>
                  </div>

                  <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800 flex justify-between items-center">
                    <span className="text-slate-400">Voltage / Logic:</span>
                    <span className="text-amber-300 font-medium text-right">
                      {selectedStage.voltageLogic}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                    Primary Signal Lines
                  </div>
                  <div className="flex flex-wrap gap-1.5 font-mono text-xs">
                    {selectedStage.signalNames.map((sig) => (
                      <span
                        key={sig}
                        className="px-2.5 py-1 rounded-md bg-cyan-950/60 border border-cyan-500/30 text-cyan-300"
                      >
                        {sig}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2 text-xs text-slate-400 leading-relaxed border-t border-slate-800/80">
                  {selectedStage.description}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}

