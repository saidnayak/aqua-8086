"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Binary, Info, Settings2 } from "lucide-react";

interface PortSpec {
  name: string;
  virtualAddress: string;
  hardwareAddress: string;
  direction: "Input" | "Output" | "Control";
  mode: string;
  pins: { pin: string; role: string; logic: string; state: string }[];
}

const PORTS_DATA: PortSpec[] = [
  {
    name: "Port A (PA0 - PA7)",
    virtualAddress: "80H",
    hardwareAddress: "00H / FFF0H",
    direction: "Input",
    mode: "Mode 0 (Basic Input)",
    pins: [
      { pin: "PA0", role: "Low Water Level Sensor Probe", logic: "Active-High: 1 = Submerged (>=25%), 0 = Dry (<25%)", state: "Connected (Probe 1)" },
      { pin: "PA1", role: "High Water Level Sensor Probe", logic: "Active-High: 1 = Submerged (>=85%), 0 = Dry (<85%)", state: "Connected (Probe 2)" },
      { pin: "PA2 - PA7", role: "Auxiliary / Spare Sensor Channels", logic: "Pulled to GND / High-Z logic 0", state: "Unused in base design" },
    ],
  },
  {
    name: "Port B (PB0 - PB7)",
    virtualAddress: "81H",
    hardwareAddress: "02H / FFF2H",
    direction: "Output",
    mode: "Mode 0 (Basic Output)",
    pins: [
      { pin: "PB0", role: "Water Pump Motor Relay Trigger", logic: "Active-High: 1 = Pump ON, 0 = Pump OFF", state: "Connected (Optocoupler)" },
      { pin: "PB1", role: "High-Water Alarm Visualizer LED", logic: "Active-High: 1 = Alarm Triggered", state: "Status Visualizer" },
      { pin: "PB2 - PB7", role: "Auxiliary Valve / Actuator Lines", logic: "TTL Latch Outputs (00H idle)", state: "Unused in base design" },
    ],
  },
  {
    name: "Port C (PC0 - PC7)",
    virtualAddress: "82H",
    hardwareAddress: "04H / FFF4H",
    direction: "Output",
    mode: "Mode 0 (Basic Output)",
    pins: [
      { pin: "PC0 - PC3", role: "Port C Lower (General Purpose)", logic: "Configured as output by D0=0", state: "Available for Expansion" },
      { pin: "PC4 - PC7", role: "Port C Upper (General Purpose)", logic: "Configured as output by D3=0", state: "Available for Handshake / Status" },
    ],
  },
  {
    name: "Control Register (CWR)",
    virtualAddress: "83H",
    hardwareAddress: "06H / FFF6H",
    direction: "Control",
    mode: "Configuration Register (Mode 0)",
    pins: [
      { pin: "D7", role: "Mode Set Flag", logic: "1 = Active (Mode Definition Active)", state: "Set to 1" },
      { pin: "D6, D5", role: "Group A Mode Selection", logic: "00 = Mode 0 (Basic Input/Output)", state: "Set to 00" },
      { pin: "D4", role: "Port A Direction", logic: "1 = Port A is Input", state: "Set to 1" },
      { pin: "D3", role: "Port C (Upper PC4-PC7)", logic: "0 = Output", state: "Set to 0" },
      { pin: "D2", role: "Group B Mode Selection", logic: "0 = Mode 0 (Basic Input/Output)", state: "Set to 0" },
      { pin: "D1", role: "Port B Direction", logic: "0 = Port B is Output", state: "Set to 0" },
      { pin: "D0", role: "Port C (Lower PC0-PC3)", logic: "0 = Output", state: "Set to 0" },
    ],
  },
];

interface ControlBitSpec {
  bit: string;
  bitIndex: number;
  val: string;
  name: string;
  group: "Mode Select" | "Group A" | "Group B";
  meaning: string;
  configuredRole: string;
}

const CONTROL_BITS_90H: ControlBitSpec[] = [
  {
    bit: "D7",
    bitIndex: 7,
    val: "1",
    name: "Mode Set Flag",
    group: "Mode Select",
    meaning: "1 = Mode definition active (0 = Bit Set/Reset BSR mode)",
    configuredRole: "D7 = 1: Activates the I/O mode configuration format word for Groups A and B.",
  },
  {
    bit: "D6",
    bitIndex: 6,
    val: "0",
    name: "Group A Mode Bit 1",
    group: "Group A",
    meaning: "D6, D5 = 00 selects Mode 0 (Basic I/O)",
    configuredRole: "D6-D5 = 00: Group A Mode 0 (Basic Input/Output without handshaking).",
  },
  {
    bit: "D5",
    bitIndex: 5,
    val: "0",
    name: "Group A Mode Bit 0",
    group: "Group A",
    meaning: "D6, D5 = 00 selects Mode 0 (Basic I/O)",
    configuredRole: "D6-D5 = 00: Group A Mode 0 (Unlatched inputs, latched outputs).",
  },
  {
    bit: "D4",
    bitIndex: 4,
    val: "1",
    name: "Port A Direction",
    group: "Group A",
    meaning: "1 = Port A Input, 0 = Port A Output",
    configuredRole: "D4 = 1: Port A is configured as INPUT to sample water level sensors PA0 and PA1.",
  },
  {
    bit: "D3",
    bitIndex: 3,
    val: "0",
    name: "Port C Upper Direction",
    group: "Group A",
    meaning: "0 = Output (PC4 - PC7), 1 = Input",
    configuredRole: "D3 = 0: Port C Upper (PC4-PC7) configured as Output lines.",
  },
  {
    bit: "D2",
    bitIndex: 2,
    val: "0",
    name: "Group B Mode Selection",
    group: "Group B",
    meaning: "0 = Mode 0 (Basic I/O), 1 = Mode 1 (Strobed I/O)",
    configuredRole: "D2 = 0: Group B Mode 0 (Basic Input/Output without strobing).",
  },
  {
    bit: "D1",
    bitIndex: 1,
    val: "0",
    name: "Port B Direction",
    group: "Group B",
    meaning: "0 = Port B Output, 1 = Port B Input",
    configuredRole: "D1 = 0: Port B is configured as OUTPUT to actuate the motor relay line (PB0).",
  },
  {
    bit: "D0",
    bitIndex: 0,
    val: "0",
    name: "Port C Lower Direction",
    group: "Group B",
    meaning: "0 = Output (PC0 - PC3), 1 = Input",
    configuredRole: "D0 = 0: Port C Lower (PC0-PC3) configured as Output lines.",
  },
];

export function PPI8255PortMap() {
  const [activePortIndex, setActivePortIndex] = useState(0);
  const [selectedBitIndex, setSelectedBitIndex] = useState(0); // D7 selected by default

  const activePort = PORTS_DATA[activePortIndex];
  const selectedBit = CONTROL_BITS_90H[selectedBitIndex];

  return (
    <Card className="border-slate-800 bg-[#090e1a]/90 backdrop-blur-xl shadow-2xl">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
              <Binary className="w-5 h-5" />
            </div>
            <div>
              <CardTitle>Intel 8255 PPI Architecture & Port Mapping</CardTitle>
              <CardDescription>
                Interactive 8255 peripheral interface, control register visualizer, and virtual I/O port assignments
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="blue" size="sm">
              Control Word: 90H = 10010000B
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Notice Banner: Virtual I/O Map Explanation */}
        <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-500/30 text-blue-200 flex items-start gap-3">
          <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed font-sans">
            <span className="font-bold text-white font-mono">EDUCATIONAL VIRTUAL I/O MAP NOTICE:</span>{" "}
            This simulator employs standardized virtual I/O port addresses{" "}
            <span className="font-mono text-cyan-300 font-bold">80H (Port A)</span>,{" "}
            <span className="font-mono text-emerald-300 font-bold">81H (Port B)</span>,{" "}
            <span className="font-mono text-slate-300 font-bold">82H (Port C)</span>, and{" "}
            <span className="font-mono text-amber-300 font-bold">83H (Control Register)</span>. In physical 8086 hardware designs with a 74LS138 decoder, typical base offsets are 00H/02H/04H/06H or FFF0H-FFF6H. Both representations map identically to internal 8255 peripheral registers.
          </div>
        </div>

        {/* Port Tabs */}
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
            {PORTS_DATA.map((port, idx) => (
              <button
                key={port.name}
                onClick={() => setActivePortIndex(idx)}
                className={`px-4 py-2 rounded-xl font-mono text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 border ${
                  activePortIndex === idx
                    ? "bg-cyan-500 text-slate-950 shadow-[0_0_15px_-3px_rgba(6,182,212,0.4)] border-cyan-400 font-bold"
                    : "bg-slate-950 text-slate-300 hover:bg-slate-900 border-slate-800"
                }`}
              >
                <span>{port.name.split(" ")[0]} {port.name.split(" ")[1]}</span>
                <span className="text-[10px] opacity-75 font-mono">({port.virtualAddress})</span>
              </button>
            ))}
          </div>

          {/* Active Port Details Card */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
              <div>
                <h4 className="text-base font-bold text-slate-100 font-mono">
                  {activePort.name}
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">{activePort.mode}</p>
              </div>
              <div className="flex items-center gap-3 font-mono text-xs">
                <div className="px-3 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
                  Virtual Port: <span className="text-cyan-400 font-bold">{activePort.virtualAddress}</span>
                </div>
                <div className="px-3 py-1 rounded bg-slate-900 border border-slate-800 text-slate-400 hidden sm:inline">
                  Hardware: <span className="text-slate-300 font-mono">{activePort.hardwareAddress}</span>
                </div>
                <Badge
                  variant={
                    activePort.direction === "Input"
                      ? "emerald"
                      : activePort.direction === "Output"
                      ? "blue"
                      : "amber"
                  }
                >
                  {activePort.direction}
                </Badge>
              </div>
            </div>

            {/* Pin Allocation Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[11px]">
                    <th className="py-2.5 px-3">Pin / Bit</th>
                    <th className="py-2.5 px-3">Assigned Role in AQUA8086</th>
                    <th className="py-2.5 px-3">Logic Specification</th>
                    <th className="py-2.5 px-3 text-right">Physical Wiring</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {activePort.pins.map((pin) => (
                    <tr key={pin.pin} className="hover:bg-slate-900/50">
                      <td className="py-2.5 px-3 font-bold text-cyan-300">{pin.pin}</td>
                      <td className="py-2.5 px-3 font-sans text-slate-200">{pin.role}</td>
                      <td className="py-2.5 px-3 text-slate-400">{pin.logic}</td>
                      <td className="py-2.5 px-3 text-right text-emerald-400">{pin.state}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Interactive 90H Control Word Bit-Level Visualizer */}
        <div className="p-5 sm:p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-cyan-400" />
                <h4 className="text-sm font-bold font-mono text-white">
                  Interactive Control Word Visualizer (90H = 10010000B)
                </h4>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Click any of the 8 control bits below to inspect its exact configuration role
              </p>
            </div>
            <Badge variant="cyan" size="sm">
              Mode 0 Configuration
            </Badge>
          </div>

          {/* 8 Clickable Bit Buttons */}
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 text-center font-mono text-xs">
            {CONTROL_BITS_90H.map((b, idx) => {
              const isSelected = selectedBitIndex === idx;
              return (
                <button
                  key={b.bit}
                  onClick={() => setSelectedBitIndex(idx)}
                  className={`p-3 rounded-xl border flex flex-col items-center transition-all cursor-pointer ${
                    isSelected
                      ? "bg-cyan-500 text-slate-950 border-cyan-400 font-bold shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                      : "bg-slate-900 border-slate-800 text-slate-300 hover:border-cyan-500/50 hover:bg-slate-850"
                  }`}
                >
                  <span className={`text-[11px] ${isSelected ? "text-slate-950 font-bold" : "text-slate-400"}`}>
                    {b.bit}
                  </span>
                  <span
                    className={`text-xl font-bold my-1 ${
                      isSelected
                        ? "text-slate-950"
                        : b.val === "1"
                        ? "text-cyan-400"
                        : "text-slate-400"
                    }`}
                  >
                    {b.val}
                  </span>
                  <span
                    className={`text-[9px] truncate w-full ${
                      isSelected ? "text-slate-950 font-semibold" : "text-slate-400"
                    }`}
                  >
                    {b.name.split(" ")[0]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Selected Bit Detailed Explanation Box */}
          <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-cyan-300 flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-400">
                  {selectedBit.bit} = {selectedBit.val}
                </span>
                <span>{selectedBit.name}</span>
              </span>
              <Badge variant="blue" size="sm">{selectedBit.group}</Badge>
            </div>

            <p className="text-xs text-slate-300 font-mono leading-relaxed bg-slate-950 p-3 rounded-lg border border-slate-850">
              {selectedBit.configuredRole}
            </p>

            <div className="text-[11px] text-slate-400 font-sans">
              <span className="font-semibold text-slate-300">Technical Definition:</span> {selectedBit.meaning}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
