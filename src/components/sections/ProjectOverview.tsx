import React from "react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Cpu, Binary, Gauge, Workflow, Check, Laptop } from "lucide-react";

export function ProjectOverview() {
  const pillars = [
    {
      icon: Cpu,
      title: "Classical 16-Bit Architecture",
      description:
        "Demystifies how the Intel 8086 executes instructions, handles bus cycles, and addresses peripheral memory spaces without modern abstraction layers.",
      badge: "Intel 8086",
    },
    {
      icon: Binary,
      title: "Programmable Parallel I/O",
      description:
        "Demonstrates real-world use of the 8255 PPI in Mode 0, translating physical digital signals into microprocessor accumulator registers via IN/OUT instructions.",
      badge: "8255 PPI Mode 0",
    },
    {
      icon: Gauge,
      title: "Two-Point Hysteresis Control",
      description:
        "Teaches robust industrial control principles. The two-probe sensor layout prevents rapid on/off motor oscillation (chattering) caused by water waves.",
      badge: "Closed-Loop Control",
    },
    {
      icon: Laptop,
      title: "100% In-Browser Simulation",
      description:
        "No physical hardware, Arduino kits, or external backend required. All instruction decoding, state propagation, and 3D rendering run client-side in real time.",
      badge: "Zero Setup Needed",
    },
  ];

  return (
    <section id="overview" className="py-20 md:py-28 bg-[#060913] border-t border-slate-800/80 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          badge="Project Overview & Motivation"
          title="Bridging Theoretical Microcomputing & Physical Mechatronics"
          subtitle="AQUA8086 replaces abstract textbook diagrams with an interactive, visual engineering environment that models every stage from sensor probe conductivity to 8086 register states."
        />

        {/* Motivation & Purpose Narrative */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          <div className="lg:col-span-7 p-6 rounded-2xl bg-slate-900/40 border border-slate-800/90 backdrop-blur-md space-y-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Workflow className="w-5 h-5 text-cyan-400" />
              The Educational Challenge
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Engineering students often study microprocessor theory, assembly mnemonic sequences,
              and peripheral interface timing diagrams in isolation. Translating these textbook concepts
              into practical control systems traditionally required fragile laboratory breadboards,
              antiquated trainer kits, or microcontrollers that hide the true bus-level mechanics.
            </p>
            <p className="text-sm text-slate-400 leading-relaxed">
              AQUA8086 solves this gap by building a visually transparent, browser-based simulation of
              an automatic water level controller. Users can inspect the exact register contents
              (AX, DX, IP, Flags), observe the 8255 control word decoding (90H), and witness how the
              two-point threshold sensors actuate an industrial water pump inside a dynamic 3D physical model.
            </p>
          </div>

          <div className="lg:col-span-5 p-6 rounded-2xl bg-gradient-to-br from-cyan-950/20 via-slate-900/60 to-blue-950/20 border border-cyan-500/20 flex flex-col justify-between">
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold mb-2">
                Core Project Objective
              </div>
              <h4 className="text-lg font-bold text-white mb-2">
                Pure Software Emulation of Real Hardware
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Every component—from the 8086 clock cycles and 8255 port latches to the float sensor
                bounce and hydraulic tank inflow—is simulated deterministically using modern web technologies.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800/80 space-y-2 text-xs font-mono text-slate-300">
              <div className="flex items-center gap-2 text-emerald-400">
                <Check className="w-4 h-4" />
                <span>Zero backend server latency</span>
              </div>
              <div className="flex items-center gap-2 text-cyan-400">
                <Check className="w-4 h-4" />
                <span>Deterministic cycle-by-cycle stepping</span>
              </div>
              <div className="flex items-center gap-2 text-blue-400">
                <Check className="w-4 h-4" />
                <span>Accessible on any modern web browser</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <Card key={pillar.title} glow interactive className="border-slate-800/80 bg-slate-900/50">
                <CardHeader>
                  <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                    <Icon className="w-5 h-5" />
                  </div>
                  <Badge variant="slate" size="sm">
                    {pillar.badge}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-base text-slate-100">{pillar.title}</CardTitle>
                  <CardDescription className="text-xs text-slate-400 leading-relaxed">
                    {pillar.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}

