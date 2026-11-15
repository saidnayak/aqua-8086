"use client";

import React from "react";
import { ArrowRight, Play, CheckCircle2 } from "lucide-react";
import { PROJECT_INFO, SYSTEM_METRICS } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SimulationCanvasPreview } from "@/features/simulation/components/SimulationCanvasPreview";

export function HeroSection() {
  const scrollTo = (targetId: string) => {
    const elem = document.getElementById(targetId);
    if (elem) {
      const navHeight = 72;
      const elementPosition = elem.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navHeight;
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  return (
    <section id="hero" className="relative pt-28 pb-20 md:pt-36 md:pb-28 overflow-hidden bg-tech-grid">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[400px] h-[300px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Eyebrow Status Chip */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <Badge variant="cyan" size="md">
            Interactive Engineering Simulation
          </Badge>
          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-mono text-slate-400">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            {PROJECT_INFO.phase}
          </span>
        </div>

        {/* Hero Title & Description Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-6">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.12]">
              Understand the 8086.{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500">
                Experience the Simulation.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl font-normal">
              {PROJECT_INFO.subtitle}
            </p>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm max-w-2xl">
              <div className="text-xs font-mono text-cyan-400 font-semibold mb-1 uppercase tracking-wider">
                Project Title & Scope
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                {PROJECT_INFO.title}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Button
                variant="primary"
                size="lg"
                icon={<Play className="w-4 h-4 fill-current" />}
                onClick={() => scrollTo("simulator")}
              >
                Start Simulation
              </Button>

              <Button
                variant="outline"
                size="lg"
                icon={<ArrowRight className="w-4 h-4" />}
                iconPosition="right"
                onClick={() => scrollTo("architecture")}
              >
                Explore Architecture
              </Button>
            </div>

            {/* Trust & Spec Markers */}
            <div className="pt-4 flex flex-wrap items-center gap-6 text-xs text-slate-400 font-mono">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Zero Backend / 100% Client-Side</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                <span>Deterministic Assembly Cycle</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-400" />
                <span>Real-Time 3D Viewport</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-3.5">
            {SYSTEM_METRICS.map((metric) => (
              <div
                key={metric.label}
                className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/90 backdrop-blur-md shadow-lg"
              >
                <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                  {metric.label}
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-cyan-400 mt-1 font-mono">
                  {metric.value}
                </div>
                <div className="text-xs text-slate-400 mt-1 leading-snug">
                  {metric.description}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3D Technical Composition Viewport */}
        <div className="mt-14">
          <SimulationCanvasPreview />
        </div>
      </div>
    </section>
  );
}

