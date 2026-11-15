"use client";

import React, { useState } from "react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { HARDWARE_COMPONENTS } from "@/lib/constants";
import { HardwareComponent } from "@/types";
import {
  Cpu,
  Binary,
  Waves,
  ShieldAlert,
  Zap,
  Power,
  Database,
  ArrowRight,
} from "lucide-react";

export function ComponentsOverview() {
  const [selectedComponent, setSelectedComponent] = useState<HardwareComponent>(
    HARDWARE_COMPONENTS[0]
  );
  const [filterCategory, setFilterCategory] = useState<string>("All");

  const categories = ["All", "Processor", "Interface", "Sensor", "Actuator", "Vessel"];

  const filteredComponents =
    filterCategory === "All"
      ? HARDWARE_COMPONENTS
      : HARDWARE_COMPONENTS.filter((c) => c.category === filterCategory);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "Cpu":
        return Cpu;
      case "Binary":
        return Binary;
      case "Waves":
        return Waves;
      case "ShieldAlert":
        return ShieldAlert;
      case "Zap":
        return Zap;
      case "Power":
        return Power;
      case "Database":
        return Database;
      default:
        return Cpu;
    }
  };

  return (
    <section id="components" className="py-20 md:py-28 bg-[#070b14] border-t border-slate-800/80 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          badge="Hardware Modules & Specs"
          title="Components Overview"
          subtitle="Explore the 7 essential hardware components making up the automatic water level control system, with detailed electrical specifications, port assignments, and behavioral models."
        />

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                filterCategory === cat
                  ? "bg-cyan-500 text-slate-950 font-bold shadow-[0_0_12px_-2px_rgba(6,182,212,0.4)]"
                  : "bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid and Inspector Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Component Selection Cards List */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredComponents.map((comp) => {
              const Icon = getIcon(comp.iconName);
              const isSelected = selectedComponent.id === comp.id;

              return (
                <div
                  key={comp.id}
                  onClick={() => setSelectedComponent(comp)}
                  className={`p-5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? "bg-slate-900 border-cyan-400 shadow-[0_0_20px_-5px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400/50"
                      : "bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/40"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center border ${
                          isSelected
                            ? "bg-cyan-500/20 border-cyan-400 text-cyan-300"
                            : "bg-slate-900 border-slate-800 text-slate-400"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <Badge
                        variant={
                          comp.category === "Processor"
                            ? "cyan"
                            : comp.category === "Interface"
                            ? "blue"
                            : comp.category === "Sensor"
                            ? "emerald"
                            : "amber"
                        }
                        size="sm"
                      >
                        {comp.category}
                      </Badge>
                    </div>

                    <h4 className="text-base font-semibold text-white">{comp.title}</h4>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{comp.model}</p>
                    <p className="text-xs text-slate-300 mt-2.5 line-clamp-2 leading-relaxed">
                      {comp.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-cyan-400">
                    <span>Inspect Specs</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Component Detailed Specification View */}
          <div className="lg:col-span-5 sticky top-28">
            <Card className="border-slate-800 bg-[#090e1a]/90 backdrop-blur-xl shadow-2xl">
              <CardHeader>
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="cyan" size="sm">
                      {selectedComponent.category}
                    </Badge>
                    <span className="text-xs font-mono text-slate-400">
                      {selectedComponent.model}
                    </span>
                  </div>
                  <CardTitle className="text-xl mt-2 text-white">
                    {selectedComponent.title}
                  </CardTitle>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {selectedComponent.description}
                </p>

                {/* Technical Specs List */}
                <div>
                  <div className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                    Electrical & Engineering Specs
                  </div>
                  <div className="space-y-1.5 font-mono text-xs">
                    {selectedComponent.specifications.map((spec) => (
                      <div
                        key={spec.label}
                        className="p-2 rounded bg-slate-900 border border-slate-800 flex justify-between items-center"
                      >
                        <span className="text-slate-400">{spec.label}:</span>
                        <span className="text-slate-200 font-semibold text-right">
                          {spec.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Port Assignment */}
                {selectedComponent.portAssignment && (
                  <div className="p-3 rounded-lg bg-cyan-950/30 border border-cyan-500/20">
                    <div className="text-[11px] font-mono uppercase text-cyan-400 font-semibold mb-1">
                      System Port Assignment
                    </div>
                    <div className="text-xs font-mono text-slate-200">
                      {selectedComponent.portAssignment}
                    </div>
                  </div>
                )}

                {/* Behavioral Logic */}
                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                  <div className="text-[11px] font-mono uppercase text-amber-400 font-semibold mb-1">
                    Control Logic Behavior
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    {selectedComponent.logicBehavior}
                  </p>
                </div>

                {/* Pinout Preview Tags if available */}
                {selectedComponent.pinoutPreview && (
                  <div>
                    <div className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                      Key Pin Connections
                    </div>
                    <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
                      {selectedComponent.pinoutPreview.map((pin) => (
                        <span
                          key={pin}
                          className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300"
                        >
                          {pin}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}

