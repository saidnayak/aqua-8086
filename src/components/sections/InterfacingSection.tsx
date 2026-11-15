"use client";

import React from "react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { PPI8255PortMap } from "@/features/interface/components/PPI8255PortMap";
import { RegisterViewerPreview } from "@/features/processor/components/RegisterViewerPreview";
import { CPU8086ArchitectureExplorer } from "@/features/processor/components/CPU8086ArchitectureExplorer";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export function InterfacingSection() {
  return (
    <section id="interfacing" className="py-20 md:py-28 bg-[#070b14] border-t border-slate-800/80 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          badge="Hardware Interfacing Subsystem"
          title="8255 PPI Interfacing & Bus Demultiplexing"
          subtitle="Explore the electrical and timing interface between the Intel 8086 16-bit multiplexed bus and the 8255 Programmable Peripheral Interface."
        />

        {/* 8255 Port Map Component */}
        <div className="mb-12">
          <PPI8255PortMap />
        </div>

        {/* Address Decoding & Bus Interface Architecture */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-6">
            <Card className="border-slate-800 bg-[#090e1a]/80">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Badge variant="cyan" size="sm">
                    Address Decoding
                  </Badge>
                  <CardTitle className="text-base text-white">
                    74LS138 Demultiplexer Mapping
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 font-mono text-xs">
                <p className="text-slate-300 font-sans leading-relaxed">
                  The 8086 uses isolated I/O mapping. A 74LS138 3-to-8 line decoder samples address
                  lines A2-A7 alongside M/IO# to generate active-low Chip Select (CS#) for the 8255.
                </p>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                    <span className="text-slate-400">8255 Base Virtual I/O Port:</span>
                    <span className="text-cyan-400 font-bold">80H (Port A)</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                    <span className="text-slate-400">Address Line A1, A0 = 00:</span>
                    <span className="text-slate-200">Port A (80H - Sensor Input)</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                    <span className="text-slate-400">Address Line A1, A0 = 01:</span>
                    <span className="text-slate-200">Port B (81H - Motor Output)</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                    <span className="text-slate-400">Address Line A1, A0 = 10:</span>
                    <span className="text-slate-200">Port C (82H - Status / Spare)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Address Line A1, A0 = 11:</span>
                    <span className="text-amber-400 font-bold">Control Register (83H)</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-6">
            <Card className="border-slate-800 bg-[#090e1a]/80">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Badge variant="blue" size="sm">
                    Bus Timing
                  </Badge>
                  <CardTitle className="text-base text-white">
                    8086 Read & Write Bus Cycles
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <p className="text-slate-300 font-sans leading-relaxed">
                  During an <code className="text-cyan-300 font-mono">IN AL, DX</code> cycle:
                </p>
                <ul className="space-y-2 font-mono text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 font-bold">T1:</span>
                    <span>8086 asserts address 0080H on AD0-AD15, pulses ALE to latch address in 74LS373.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 font-bold">T2:</span>
                    <span>8086 floats AD0-AD7, asserts RD# (Read Strobe active low).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 font-bold">T3:</span>
                    <span>8255 places PA0-PA7 sensor data onto the bus.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 font-bold">T4:</span>
                    <span>8086 latches data byte into AL register and de-asserts RD#.</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 8086 Internal Architecture Explorer (BIU vs EU Subsystems) */}
        <div className="mt-12">
          <CPU8086ArchitectureExplorer />
        </div>

        {/* Register Architecture Preview */}
        <div className="mt-12">
          <RegisterViewerPreview />
        </div>
      </div>
    </section>
  );
}

