"use client";

import React, { useState } from "react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { LEARNING_TOPICS } from "@/lib/constants";
import { LearningTopic } from "@/types";
import {
  BookOpen,
  Cpu,
  Binary,
  Gauge,
  Terminal,
  Workflow,
  CheckCircle2,
  Code2,
  ChevronRight,
} from "lucide-react";

export function LearningSection() {
  const [selectedTopic, setSelectedTopic] = useState<LearningTopic>(LEARNING_TOPICS[0]);

  const getTopicIcon = (id: string) => {
    switch (id) {
      case "topic-8086-arch":
        return Cpu;
      case "topic-8255-interfacing":
        return Binary;
      case "topic-working-principle":
        return Gauge;
      case "topic-assembly-lang":
        return Terminal;
      case "topic-algorithm-flowchart":
        return Workflow;
      default:
        return BookOpen;
    }
  };

  return (
    <section id="learn" className="py-20 md:py-28 bg-[#060913] border-t border-slate-800/80 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          badge="Educational Curriculum"
          title="Learning Modules & Engineering Theory"
          subtitle="Master the fundamental concepts underpinning microprocessor-based control systems through our structured introductory learning modules."
        />

        {/* 5 Topic Selector Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-10">
          {LEARNING_TOPICS.map((topic) => {
            const Icon = getTopicIcon(topic.id);
            const isSelected = selectedTopic.id === topic.id;

            return (
              <button
                key={topic.id}
                onClick={() => setSelectedTopic(topic)}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? "bg-slate-900 border-cyan-400 shadow-[0_0_15px_-3px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400/50"
                    : "bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/50"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                        isSelected
                          ? "bg-cyan-500/20 border-cyan-400 text-cyan-300"
                          : "bg-slate-900 border-slate-800 text-slate-400"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <Badge
                      variant={
                        topic.difficulty === "Beginner"
                          ? "emerald"
                          : topic.difficulty === "Intermediate"
                          ? "cyan"
                          : "amber"
                      }
                      size="sm"
                    >
                      {topic.difficulty}
                    </Badge>
                  </div>

                  <h4 className="text-sm font-semibold text-white leading-snug line-clamp-2">
                    {topic.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 font-mono mt-1">
                    {topic.category}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-cyan-400">
                  <span>Explore Module</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Topic Detailed Card */}
        <Card className="border-slate-800 bg-[#090e1a]/90 backdrop-blur-xl">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-4 w-full">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="cyan" size="sm">
                    {selectedTopic.category}
                  </Badge>
                  <Badge
                    variant={
                      selectedTopic.difficulty === "Beginner"
                        ? "emerald"
                        : selectedTopic.difficulty === "Intermediate"
                        ? "cyan"
                        : "amber"
                    }
                    size="sm"
                  >
                    Level: {selectedTopic.difficulty}
                  </Badge>
                </div>
                <CardTitle className="text-2xl mt-2 text-white">
                  {selectedTopic.title}
                </CardTitle>
              </div>

              <div className="text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                Topic ID: <span className="text-cyan-400">{selectedTopic.id}</span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-sans">
              {selectedTopic.contentExcerpt}
            </p>

            {/* Key Takeaways */}
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-3">
                Key Learning Objectives & Takeaways
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedTopic.keyTakeaways.map((takeaway, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800/80 flex items-start gap-3"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-xs text-slate-300 leading-relaxed">{takeaway}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Code Snippet if applicable */}
            {selectedTopic.codeSnippet && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-cyan-400" />
                    <span>8086 Assembly Implementation</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">MASM / TASM Syntax</span>
                </div>
                <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-cyan-300 overflow-x-auto leading-relaxed">
                  <code>{selectedTopic.codeSnippet}</code>
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

