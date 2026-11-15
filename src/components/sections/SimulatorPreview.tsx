"use client";

import React from "react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SimulationDashboard } from "@/features/simulation/components/SimulationDashboard";

export function SimulatorPreview() {
  return (
    <section id="simulator" className="py-20 md:py-28 bg-[#060913] border-t border-slate-800/80 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          badge="Virtual Hardware & 8086 Engine Active"
          title="AQUA8086 Interactive Simulation Laboratory"
          subtitle="Execute genuine 8086 assembly instructions in the browser to communicate with a virtual 8255 PPI, read dual-threshold sensors, and actuate an automatic water pump."
        />

        {/* Live Simulation Engine & Dashboard */}
        <SimulationDashboard />
      </div>
    </section>
  );
}
