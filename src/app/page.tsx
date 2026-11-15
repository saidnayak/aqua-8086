import React from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/sections/HeroSection";
import { ProjectOverview } from "@/components/sections/ProjectOverview";
import { SystemArchitecture } from "@/components/sections/SystemArchitecture";
import { SimulatorPreview } from "@/components/sections/SimulatorPreview";
import { ComponentsOverview } from "@/components/sections/ComponentsOverview";
import { InterfacingSection } from "@/components/sections/InterfacingSection";
import { AssemblyLabPreview } from "@/components/sections/AssemblyLabPreview";
import { LearningSection } from "@/components/sections/LearningSection";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/20 selection:text-cyan-300">
      {/* Fixed Sticky Header with Navigation & Status */}
      <Header />

      {/* Main Content Sections */}
      <main className="flex-1">
        {/* 1. Hero Section */}
        <HeroSection />

        {/* 2. Project Overview */}
        <ProjectOverview />

        {/* 3. System Architecture (Block Diagram) */}
        <SystemArchitecture />

        {/* 4. Simulator Preview (3D Viewport) */}
        <SimulatorPreview />

        {/* 5. Components Overview (7 Core Modules) */}
        <ComponentsOverview />

        {/* 6. 8255 PPI Interfacing & Bus Demultiplexing */}
        <InterfacingSection />

        {/* 7. Assembly Lab & Hysteresis Truth Table */}
        <AssemblyLabPreview />

        {/* 8. Learning Section (5 Core Topics) */}
        <LearningSection />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
