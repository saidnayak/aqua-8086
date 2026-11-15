"use client";

import React, { useState } from "react";
import {
  Sliders,
  AlertTriangle,
  Droplets,
  ShieldAlert,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export interface ScenarioSpec {
  id: string;
  title: string;
  description: string;
  initialWaterLevel: number;
  initialDraining: boolean;
  injectFault: boolean;
  initialStateSummary: string;
  sensorValuesSummary: string;
  cpuDecisionSummary: string;
  executedInstructionsSummary: string;
  finalPumpStateSummary: string;
  isFaultScenario?: boolean;
}

const PRACTICE_SCENARIOS: ScenarioSpec[] = [
  {
    id: "empty-tank",
    title: "Scenario 1: Empty Tank Refill (< 25%)",
    description: "Tank starts at 10% volume. Both sensor probes are dry (PA = 00H). The 8086 detects an empty tank and commands the pump to turn ON.",
    initialWaterLevel: 10.0,
    initialDraining: false,
    injectFault: false,
    initialStateSummary: "Water level at 10.0%. Probes dry.",
    sensorValuesSummary: "PA0 = 0, PA1 = 0 &rarr; Port A = 00H",
    cpuDecisionSummary: "TEST AL, 01H sets ZF=1; JZ TANK_LOW branches; loads BL = 01H (Pump ON).",
    executedInstructionsSummary: "IN AL, DX &rarr; TEST AL, 02H &rarr; TEST AL, 01H &rarr; JZ TANK_LOW &rarr; MOV BL, 01H &rarr; OUT DX, AL",
    finalPumpStateSummary: "PB0 = 1 (PUMP ACTIVE, REFILLING RESERVOIR)",
  },
  {
    id: "half-filled",
    title: "Scenario 2: Half-Filled Hysteresis Zone (50%)",
    description: "Water at 50%. The low probe is submerged (PA0 = 1) but the high probe is dry (PA1 = 0), yielding PA = 01H. The pump retains its prior state.",
    initialWaterLevel: 50.0,
    initialDraining: false,
    injectFault: false,
    initialStateSummary: "Water level at 50.0%. Low probe submerged, high probe dry.",
    sensorValuesSummary: "PA0 = 1, PA1 = 0 &rarr; Port A = 01H",
    cpuDecisionSummary: "Neither JNZ TANK_FULL nor JZ TANK_LOW taken. Program executes JMP UPDATE, retaining prior BL state.",
    executedInstructionsSummary: "IN AL, DX &rarr; TEST AL, 02H &rarr; TEST AL, 01H &rarr; JMP UPDATE &rarr; OUT DX, AL",
    finalPumpStateSummary: "PB0 = Retained State (Pump maintains existing running or standby state without chattering)",
  },
  {
    id: "full-tank",
    title: "Scenario 3: Full Tank Cutoff (>= 85%)",
    description: "Water level reaches 90%. Both low and high probes are submerged (PA = 03H). The 8086 detects tank full and cuts off the pump.",
    initialWaterLevel: 90.0,
    initialDraining: false,
    injectFault: false,
    initialStateSummary: "Water level at 90.0%. Upper safe limit reached.",
    sensorValuesSummary: "PA0 = 1, PA1 = 1 &rarr; Port A = 03H",
    cpuDecisionSummary: "TEST AL, 02H yields 02H (ZF=0). JNZ TANK_FULL branches; loads BL = 00H (Pump OFF).",
    executedInstructionsSummary: "IN AL, DX &rarr; TEST AL, 02H &rarr; JNZ TANK_FULL &rarr; MOV BL, 00H &rarr; OUT DX, AL",
    finalPumpStateSummary: "PB0 = 0 (PUMP SHUT DOWN, PREVENTING OVERFLOW)",
  },
  {
    id: "water-consumption",
    title: "Scenario 4: Water Consumption & Autonomous Drain",
    description: "Consumers draw water from the full tank. Water drains from 90% down through 50% to below 25%, automatically restarting the pump.",
    initialWaterLevel: 80.0,
    initialDraining: true,
    injectFault: false,
    initialStateSummary: "Water level at 80.0%, Drain Active (4%/s).",
    sensorValuesSummary: "Level falling: PA=03H &rarr; PA=01H &rarr; PA=00H (<25%)",
    cpuDecisionSummary: "Pump stays OFF while level is between 85% and 25%. Once level drops < 25%, CPU detects PA=00H and triggers pump.",
    executedInstructionsSummary: "CHECK &rarr; SENSE &rarr; HYSTERESIS HOLD &rarr; TRIGGER LOW &rarr; RESTART PUMP",
    finalPumpStateSummary: "PB0 transitions from 0 to 1 as soon as level falls < 25%",
  },
  {
    id: "fault-injection",
    title: "Scenario 5: Inconsistent Sensor Fault (PA = 02H)",
    description: "Demonstrates physical sensor failure: High probe reports submerged (PA1=1) while low probe reports dry (PA0=0), generating illegal state 02H.",
    initialWaterLevel: 30.0,
    initialDraining: false,
    injectFault: true,
    isFaultScenario: true,
    initialStateSummary: "Hardware fault simulated: Physical anomaly where upper probe is wet but lower is dry.",
    sensorValuesSummary: "PA0 = 0, PA1 = 1 &rarr; Port A = 02H (INVALID HARDWARE CONDITION)",
    cpuDecisionSummary: "Inconsistent sensor state detected. The 8086 firmware engages safe shutdown, forcing pump output OFF.",
    executedInstructionsSummary: "SENSOR DIAGNOSTIC INTERCEPT &rarr; SAFETY CUTOFF &rarr; FORCE MOTOR RELAY OFF",
    finalPumpStateSummary: "PB0 = 0 (FORCED SAFE SHUTDOWN / ALARM ENGAGED)",
  },
];

interface PracticeScenariosProps {
  onApplyScenario: (waterLevel: number, isDraining: boolean, injectFault: boolean) => void;
  onClearFault: () => void;
  isFaultActive: boolean;
  currentWaterLevel: number;
  currentPumpState: boolean;
  currentPortA: number;
}

export function PracticeScenarios({
  onApplyScenario,
  onClearFault,
  isFaultActive,
  currentWaterLevel,
  currentPumpState,
  currentPortA,
}: PracticeScenariosProps) {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>("empty-tank");
  const activeScenario =
    PRACTICE_SCENARIOS.find((s) => s.id === selectedScenarioId) || PRACTICE_SCENARIOS[0];

  const handleApply = (scenario: ScenarioSpec) => {
    setSelectedScenarioId(scenario.id);
    onApplyScenario(scenario.initialWaterLevel, scenario.initialDraining, scenario.injectFault);
  };

  return (
    <div className="p-5 sm:p-7 rounded-2xl bg-[#090e1a]/95 border border-slate-800 backdrop-blur-xl shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold font-mono text-white">
              Interactive Practice & Fault Injection Laboratory
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Select real-world operating scenarios to test 8086 decision branches and safety cutoffs
            </p>
          </div>
        </div>

        {isFaultActive && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearFault}
            icon={<RotateCcw className="w-4 h-4 text-emerald-400" />}
            className="border-emerald-500/40 text-emerald-300 hover:bg-emerald-950/40"
          >
            Clear Fault & Restore Normal Sensors
          </Button>
        )}
      </div>

      {/* Fault Warning Banner if Fault is Active */}
      {isFaultActive && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/60 text-rose-200 flex items-start gap-3 backdrop-blur-md">
          <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm space-y-1">
            <span className="font-bold font-mono text-rose-300">
              FAULT DEMONSTRATION ACTIVE (PA = 02H):
            </span>{" "}
            Upper probe submerged while lower probe dry. The 8086 software routine engages safe shutdown response, holding the pump OFF to prevent accidental dry running or erratic actuator cycling.
            <div className="text-[11px] text-rose-400/90 pt-1">
              Click &quot;Clear Fault & Restore Normal Sensors&quot; above to resume automatic sensor calculations.
            </div>
          </div>
        </div>
      )}

      {/* 5 Selectable Scenario Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 font-mono text-xs">
        {PRACTICE_SCENARIOS.map((scenario) => {
          const isSelected = selectedScenarioId === scenario.id;
          const isFault = scenario.isFaultScenario;
          return (
            <button
              key={scenario.id}
              onClick={() => handleApply(scenario)}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                isSelected
                  ? isFault
                    ? "bg-rose-500/20 border-rose-500 text-rose-200 shadow-[0_0_15px_rgba(244,63,94,0.4)]"
                    : "bg-cyan-500 text-slate-950 font-bold border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                  : isFault
                  ? "bg-slate-900 border-rose-900/60 text-rose-300 hover:border-rose-500/50"
                  : "bg-slate-900/80 border-slate-800 text-slate-300 hover:border-cyan-500/50 hover:bg-slate-850"
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] uppercase font-bold ${isSelected && !isFault ? "text-slate-950" : "text-slate-400"}`}>
                    {scenario.id.split("-")[0]}
                  </span>
                  {isFault ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  ) : (
                    <Droplets className={`w-3.5 h-3.5 ${isSelected ? "text-slate-950" : "text-cyan-400"}`} />
                  )}
                </div>
                <div className="font-bold text-sm mt-1">{scenario.title.split(":")[0]}</div>
              </div>
              <div className={`text-[11px] truncate w-full ${isSelected && !isFault ? "text-slate-900" : "text-slate-400"}`}>
                {scenario.title.split(":")[1] || ""}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Scenario Detailed Diagnostic Report Card */}
      <div className="p-5 sm:p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h4 className="text-base font-bold text-white font-mono flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              {activeScenario.title}
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">{activeScenario.description}</p>
          </div>
          <Badge
            variant={activeScenario.isFaultScenario ? "amber" : "cyan"}
            size="sm"
          >
            {activeScenario.isFaultScenario ? "Safety Cutoff Demo" : "Standard Operating Mode"}
          </Badge>
        </div>

        {/* 5 Required Scenario Breakdown Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 font-mono text-xs">
          {/* 1. Initial State */}
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-850 space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-slate-400">1. Initial State</span>
            <div className="text-slate-200 text-[11px]">{activeScenario.initialStateSummary}</div>
          </div>

          {/* 2. Sensor Values */}
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-850 space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-cyan-400">2. Sensor Values</span>
            <div
              className="text-cyan-300 font-bold text-[11px]"
              dangerouslySetInnerHTML={{ __html: activeScenario.sensorValuesSummary }}
            />
          </div>

          {/* 3. CPU Decision */}
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-850 space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-sky-400">3. CPU Decision</span>
            <div className="text-slate-300 font-sans text-xs">{activeScenario.cpuDecisionSummary}</div>
          </div>

          {/* 4. Executed Instructions */}
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-850 space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-amber-400">4. Executed Instructions</span>
            <div
              className="text-amber-300 font-mono text-[11px]"
              dangerouslySetInnerHTML={{ __html: activeScenario.executedInstructionsSummary }}
            />
          </div>

          {/* 5. Final Pump State */}
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-850 space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-emerald-400">5. Final Pump State</span>
            <div className="text-emerald-300 font-bold text-xs">{activeScenario.finalPumpStateSummary}</div>
          </div>
        </div>

        {/* Live System Feedback Comparison */}
        <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-4">
            <span className="text-slate-400">Live Reservoir Level:</span>
            <span className="text-cyan-400 font-bold">{currentWaterLevel.toFixed(1)}%</span>
            <span className="text-slate-400">Port A:</span>
            <span className="text-cyan-300 font-bold">
              0x{currentPortA.toString(16).toUpperCase().padStart(2, "0")}H
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Live Pump Actuator:</span>
            <Badge variant={currentPumpState ? "emerald" : "slate"} size="sm">
              {currentPumpState ? "MOTOR ON (PB0=1)" : "MOTOR OFF (PB0=0)"}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
