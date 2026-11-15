import React from "react";
import { Cpu, Layers, CheckCircle2 } from "lucide-react";
import { PROJECT_INFO, NAV_ITEMS } from "@/lib/constants";
import { Badge } from "@/components/ui/Badge";

export function Footer() {
  const currentYear = 2026;

  return (
    <footer id="about" className="border-t border-slate-800/80 bg-[#05080f] text-slate-400 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Column 1: Brand & Project Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <Cpu className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white font-mono">
                {PROJECT_INFO.name}
              </span>
              <Badge variant="emerald" size="sm">
                v{PROJECT_INFO.version} Ready
              </Badge>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed font-medium">
              {PROJECT_INFO.title}
            </p>

            <p className="text-xs text-slate-400 leading-relaxed">
              An educational engineering initiative dedicated to visual microprocessor simulation.
              Bridging classical 16-bit x86 architecture, peripheral parallel I/O interfacing (8255 PPI),
              and real-world closed-loop electromechanical fluid automation entirely in the browser.
            </p>

            <div className="pt-2 flex flex-wrap gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Pure Client-Side
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                No Physical Hardware Required
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                Zero Backend Dependencies
              </span>
            </div>
          </div>

          {/* Column 2: Quick Navigation */}
          <div className="space-y-4">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
              Navigation
            </h4>
            <ul className="space-y-2 text-sm">
              {NAV_ITEMS.map((item) => (
                <li key={item.id}>
                  <a
                    href={item.href}
                    className="hover:text-cyan-300 transition-colors flex items-center gap-1.5"
                  >
                    <span>{item.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Architecture Specs */}
          <div className="space-y-4">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
              Hardware Specs
            </h4>
            <ul className="space-y-2 text-xs font-mono text-slate-300">
              <li className="flex justify-between gap-2 border-b border-slate-800/60 pb-1.5">
                <span className="text-slate-400">CPU</span>
                <span className="text-cyan-400 text-right">Intel 8086 (16-bit)</span>
              </li>
              <li className="flex justify-between gap-2 border-b border-slate-800/60 pb-1.5">
                <span className="text-slate-400">Interface</span>
                <span className="text-cyan-400 text-right">8255A PPI</span>
              </li>
              <li className="flex justify-between gap-2 border-b border-slate-800/60 pb-1.5">
                <span className="text-slate-400">Operating Mode</span>
                <span className="text-slate-200 text-right">Mode 0 (Basic I/O)</span>
              </li>
              <li className="flex justify-between gap-2 border-b border-slate-800/60 pb-1.5">
                <span className="text-slate-400">Control Word</span>
                <span className="text-amber-400 text-right">90H (10010000b)</span>
              </li>
              <li className="flex justify-between gap-2 border-b border-slate-800/60 pb-1.5">
                <span className="text-slate-400">Control Method</span>
                <span className="text-emerald-400 text-right">Hysteresis Loop</span>
              </li>
            </ul>
          </div>

          {/* Column 4: Technology & Roadmap */}
          <div className="space-y-4">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
              Technology Stack
            </h4>
            <div className="flex flex-wrap gap-1.5 text-[11px] font-mono">
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">Next.js 16</span>
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">React 19</span>
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">TypeScript</span>
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">Tailwind CSS</span>
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">Three.js</span>
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">React Three Fiber</span>
            </div>

            <div className="mt-4 p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-xs">
              <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>System Status</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-400 leading-normal">
                Complete browser-based 8086 + 8255 PPI simulation engine with authentic instruction byte offsets, 10-stage guided demo, and 3D hardware visualization.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p className="text-slate-400">
            &copy; {currentYear} {PROJECT_INFO.name}. Built for advanced microprocessor and embedded systems pedagogy.
          </p>
          <div className="flex items-center gap-4 font-mono text-slate-400">
            <span>Client-side runtime</span>
            <span>•</span>
            <span className="text-cyan-400">{PROJECT_INFO.phase}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

