"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Cpu, Menu, X, Activity, Terminal } from "lucide-react";
import { NAV_ITEMS, PROJECT_INFO } from "@/lib/constants";
import { Badge } from "@/components/ui/Badge";
import { useScrollSpy } from "@/hooks/useScrollSpy";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const navSectionIds = NAV_ITEMS.map((item) => item.href.replace("#", ""));
  const activeSection = useScrollSpy(navSectionIds, 120);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const targetId = href.replace("#", "");
    const elem = document.getElementById(targetId);
    if (elem) {
      const navHeight = 72;
      const elementPosition = elem.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navHeight;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
      setMobileMenuOpen(false);
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#070b14]/90 backdrop-blur-md border-b border-slate-800/80 shadow-lg shadow-black/40 py-3"
          : "bg-[#070b14]/40 backdrop-blur-sm border-b border-transparent py-4"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <Link
            href="#hero"
            onClick={(e) => scrollToSection(e, "#hero")}
            className="flex items-center gap-3 group focus:outline-none"
          >
            <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/40 text-cyan-400 group-hover:border-cyan-400 group-hover:text-cyan-300 transition-all duration-200">
              <Cpu className="w-5 h-5 transition-transform group-hover:scale-110" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-white font-mono group-hover:text-cyan-400 transition-colors">
                  {PROJECT_INFO.name}
                </span>
                <Badge variant="cyan" size="sm" className="hidden sm:inline-flex">
                  x86 v1.0
                </Badge>
              </div>
              <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">
                Intel 8086 • 8255 PPI Sim
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {NAV_ITEMS.map((item) => {
              const targetId = item.href.replace("#", "");
              const isActive = activeSection === targetId;

              return (
                <a
                  key={item.id}
                  href={item.href}
                  onClick={(e) => scrollToSection(e, item.href)}
                  className={`px-3 py-1.5 text-xs xl:text-sm font-medium rounded-md transition-all duration-150 flex items-center gap-1.5 ${
                    isActive
                      ? "text-cyan-300 bg-cyan-500/10 border border-cyan-500/30"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/60 border border-transparent"
                  }`}
                >
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/30 font-mono">
                      {item.badge}
                    </span>
                  )}
                </a>
              );
            })}
          </nav>

          {/* Right Action Area */}
          <div className="hidden sm:flex items-center gap-3">
            <a
              href="#simulator"
              onClick={(e) => scrollToSection(e, "#simulator")}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors duration-150 flex items-center gap-1.5 shadow-[0_0_15px_-3px_rgba(6,182,212,0.4)]"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Launch Sim</span>
            </a>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-[65px] bg-[#070b14]/95 backdrop-blur-xl border-b border-slate-800 p-6 shadow-2xl transition-all">
          <div className="flex flex-col gap-2">
            <div className="px-2 py-1 mb-2 text-[11px] font-mono uppercase tracking-wider text-slate-400">
              System Modules
            </div>
            {NAV_ITEMS.map((item) => {
              const targetId = item.href.replace("#", "");
              const isActive = activeSection === targetId;

              return (
                <a
                  key={item.id}
                  href={item.href}
                  onClick={(e) => scrollToSection(e, item.href)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium flex items-center justify-between transition-colors ${
                    isActive
                      ? "text-cyan-300 bg-cyan-500/10 border border-cyan-500/30"
                      : "text-slate-200 hover:bg-slate-800/60"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-cyan-400" />
                    {item.label}
                  </span>
                  {item.badge && (
                    <Badge variant="cyan" size="sm">
                      {item.badge}
                    </Badge>
                  )}
                </a>
              );
            })}
            <div className="mt-4 pt-4 border-t border-slate-800 flex flex-col gap-2">
              <a
                href="#simulator"
                onClick={(e) => scrollToSection(e, "#simulator")}
                className="w-full py-3 px-4 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm text-center flex items-center justify-center gap-2"
              >
                <Activity className="w-4 h-4" />
                Launch Simulator Viewport
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

