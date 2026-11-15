"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Cpu, Activity, Sparkles, Check } from "lucide-react";

export interface CPUArchComponent {
  id: string;
  name: string;
  subsystem: "Bus Interface Unit (BIU)" | "Execution Unit (EU)" | "System Interconnect / Bus";
  purpose: string;
  howItOperates: string;
  roleInProject: string;
  internalSpecs: string[];
}

export const CPU_COMPONENTS: CPUArchComponent[] = [
  {
    id: "biu",
    name: "Bus Interface Unit (BIU)",
    subsystem: "Bus Interface Unit (BIU)",
    purpose: "Handles all external memory and I/O bus transactions, instruction fetching, and physical address calculation.",
    howItOperates:
      "Generates 20-bit physical addresses using dedicated segment base adders (Physical = Segment * 16 + Offset), manages the 6-byte instruction prefetch queue, and interfaces directly with the external system bus.",
    roleInProject:
      "Fetches instructions (like IN AL, DX and OUT DX, AL) from memory, drives virtual I/O port addresses 80H and 81H onto the bus, and coordinates RD# / WR# strobe timing with the 8255 PPI.",
    internalSpecs: ["Segment Registers (CS, DS, SS, ES)", "Instruction Pointer (IP)", "6-Byte Prefetch Queue", "20-bit Bus Adder"],
  },
  {
    id: "eu",
    name: "Execution Unit (EU)",
    subsystem: "Execution Unit (EU)",
    purpose: "Executes decoded instructions received from the BIU queue and performs arithmetic and logic computations.",
    howItOperates:
      "Decodes opcodes from the prefetch queue using the instruction decoder, coordinates control timing signals, executes arithmetic/logical operations in the ALU, manipulates general registers, and updates status flags.",
    roleInProject:
      "Decodes the water controller instructions, evaluates bitwise masks (TEST AL, 02H and TEST AL, 01H), updates the Zero Flag, and alters program flow via conditional jumps.",
    internalSpecs: ["16-bit ALU", "Instruction Decoder", "General Purpose Registers (AX, BX, CX, DX)", "FLAGS Register"],
  },
  {
    id: "alu",
    name: "Arithmetic Logic Unit (ALU)",
    subsystem: "Execution Unit (EU)",
    purpose: "Performs 8-bit and 16-bit arithmetic (ADD, SUB) and logical (AND, OR, XOR, TEST) operations.",
    howItOperates:
      "Receives two operands from temporary registers or the internal data bus, performs the operation dictated by the instruction decoder, outputs the result to internal bus, and sets/clears condition flags accordingly.",
    roleInProject:
      "Computes bitwise AND between sensor input AL and bitmasks (02H and 01H) during TEST instructions to test high and low probe immersion without altering AL data.",
    internalSpecs: ["16-Bit Parallel Adder", "Bitwise Logic Array", "Zero / Sign / Parity Evaluators", "Carry / Overflow Generators"],
  },
  {
    id: "general-regs",
    name: "General-Purpose Registers (AX, BX, CX, DX)",
    subsystem: "Execution Unit (EU)",
    purpose: "Provide high-speed internal data storage for operands, accumulators, and I/O port addresses.",
    howItOperates:
      "Four 16-bit registers (AX, BX, CX, DX) addressable as full 16-bit words or individual 8-bit byte pairs (AH/AL, BH/BL, CH/CL, DH/DL). They connect directly to the ALU.",
    roleInProject:
      "AL receives the 8255 Port A sensor byte and outputs motor bytes. BL acts as memory holding pump status (01H = ON, 00H = OFF). DX holds I/O port addresses (80H, 81H, 83H).",
    internalSpecs: ["AX (AH:AL) - Accumulator", "BX (BH:BL) - Base Register", "CX (CH:CL) - Count Register", "DX (DH:DL) - Data / I/O Pointer"],
  },
  {
    id: "segment-regs",
    name: "Segment Registers (CS, DS, SS, ES)",
    subsystem: "Bus Interface Unit (BIU)",
    purpose: "Store 16-bit segment base addresses for the 1 Megabyte segmented memory model.",
    howItOperates:
      "CS defines Code Segment, DS defines Data Segment, SS defines Stack Segment, and ES defines Extra Segment. Each segment points to a 64KB logical segment boundary in RAM/ROM.",
    roleInProject:
      "CS holds the base segment address of the automatic water level controller firmware stored in system ROM, pairing with IP to fetch consecutive instructions.",
    internalSpecs: ["CS: Code Segment (Firmware ROM)", "DS: Data Segment (Variables/Tables)", "SS: Stack Segment (Call/Return Frames)", "ES: Extra Segment (Strings/Buffers)"],
  },
  {
    id: "ip",
    name: "Instruction Pointer (IP)",
    subsystem: "Bus Interface Unit (BIU)",
    purpose: "Holds the 16-bit offset of the next sequential instruction byte to be fetched by the BIU.",
    howItOperates:
      "Automatically increments as instructions are prefetched into the queue. Updated abruptly when jump, call, or return instructions (JMP, JZ, JNZ) are executed by the EU.",
    roleInProject:
      "Tracks position in the water controller polling loop. Jumps to TANK_LOW when water is low or TANK_FULL when full, and returns to CHECK via JMP CHECK.",
    internalSpecs: ["16-Bit Program Counter Offset", "Auto-incrementing Counter", "Branch Target Multiplexer", "Offset for Physical Addr = CS*16 + IP"],
  },
  {
    id: "flag-reg",
    name: "Flag Register (FLAGS)",
    subsystem: "Execution Unit (EU)",
    purpose: "Stores the status flags reflecting the outcome of ALU operations and control flags governing CPU behavior.",
    howItOperates:
      "A 16-bit register with 9 active bits. Condition flags: ZF (Zero), SF (Sign), PF (Parity), CF (Carry), OF (Overflow), AF (Aux Carry). Control flags: IF (Interrupt), DF (Direction), TF (Trap).",
    roleInProject:
      "The Zero Flag (ZF) is the linchpin of the controller. Set to 1 when TEST AL, 02H yields 0 (tank not full) and evaluated by JNZ / JZ to govern pump actuation.",
    internalSpecs: ["ZF: Set if result == 0", "SF: Set if MSB == 1", "PF: Set if lower byte has even parity", "CF & OF: Cleared unconditionally by TEST"],
  },
  {
    id: "decoder",
    name: "Instruction Decoder & Control Unit",
    subsystem: "Execution Unit (EU)",
    purpose: "Translates machine code opcodes into micro-operations and sequence control signals.",
    howItOperates:
      "Pulls instruction bytes from the prefetch queue, decodes the opcode, determines addressing modes, and drives micro-control signals to the ALU, registers, and bus interface.",
    roleInProject:
      "Translates assembly instructions MOV, IN, OUT, TEST, JZ, JNZ, and JMP into coordinated internal register transfers and I/O bus cycles.",
    internalSpecs: ["Opcode Register & PLA Decoder", "Microcode / Hardwired Timing Matrix", "Bus Request Synchronization", "State Sequencer (T1-T4 cycles)"],
  },
  {
    id: "prefetch-queue",
    name: "6-Byte Instruction Prefetch Queue",
    subsystem: "Bus Interface Unit (BIU)",
    purpose: "Implements instruction pipelining by fetching future instructions while the EU executes current ones.",
    howItOperates:
      "A First-In-First-Out (FIFO) buffer. Whenever 2 or more bytes are empty in the queue and the external bus is idle, the BIU performs autonomous instruction fetch bus cycles.",
    roleInProject:
      "Pipelining ensures near-zero latency when executing sequential sensor checking loops, prefetching TEST and conditional jump instructions ahead of execution.",
    internalSpecs: ["6-Byte First-In First-Out Buffer", "Autonomous BIU Fetch Mechanism", "Flushed immediately upon taken branch (JZ/JNZ/JMP)", "Pipelined Instruction Prefetch"],
  },
  {
    id: "system-bus",
    name: "Address & Data Bus (Multiplexed AD0-AD15, A16-A19)",
    subsystem: "System Interconnect / Bus",
    purpose: "Transfers addresses, data, and control strobes between the 8086 CPU, 8255 PPI, and system memory.",
    howItOperates:
      "Time-multiplexed bus: AD0-AD15 carry address lines in bus cycle T1, latched by external 74LS373 latches via ALE strobe, then carry 16-bit bidirectional data in cycles T2, T3, and T4.",
    roleInProject:
      "Connects the 8086 directly to the 8255 PPI. Sends I/O address 80H to select Port A for reading, and 81H to select Port B for writing motor actuation commands.",
    internalSpecs: ["20-Bit Physical Address Bus (1MB addressing)", "16-Bit Bidirectional Data Bus (AD0-AD15)", "Control Strobes: ALE, RD#, WR#, M/IO#", "Interface to 8255 PPI & 74LS138 Decoder"],
  },
];

export function CPU8086ArchitectureExplorer() {
  const [selectedId, setSelectedId] = useState<string>("biu");
  const selectedComponent = CPU_COMPONENTS.find((c) => c.id === selectedId) || CPU_COMPONENTS[0];

  return (
    <Card className="border-slate-800 bg-[#090e1a]/90 backdrop-blur-xl shadow-2xl">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <CardTitle>Intel 8086 Internal Architecture Explorer</CardTitle>
              <CardDescription>
                Interactive architectural schematic distinguishing the Bus Interface Unit (BIU) and Execution Unit (EU)
              </CardDescription>
            </div>
          </div>
          <Badge variant="cyan" size="sm">
            16-Bit Microprocessor Architecture
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Visual Architectural Block Layout (BIU on Top, EU on Bottom) */}
        <div className="p-4 sm:p-6 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-5">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span className="uppercase tracking-wider font-bold text-cyan-400">
              CLICK ANY ARCHITECTURAL BLOCK TO INSPECT DETAILED OPERATION
            </span>
            <span>Two Independent Pipelined Processing Units</span>
          </div>

          {/* 1. BUS INTERFACE UNIT (BIU) CONTAINER */}
          <div className="p-4 rounded-xl border border-sky-500/30 bg-sky-950/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-sky-400" />
                Bus Interface Unit (BIU) - External Bus Management & Prefetch
              </span>
              <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
                Interfaces with 8255 PPI & System Memory
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 font-mono text-xs">
              {[
                { id: "biu", title: "BIU Controller", subtitle: "Bus Cycles & Timing" },
                { id: "segment-regs", title: "Segment Regs", subtitle: "CS, DS, SS, ES" },
                { id: "ip", title: "Instruction Pointer (IP)", subtitle: "Next Instruction Offset" },
                { id: "prefetch-queue", title: "6-Byte Queue", subtitle: "Prefetched Instruction FIFO" },
              ].map((item) => {
                const isSelected = selectedId === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                      isSelected
                        ? "bg-sky-500 text-slate-950 font-bold border-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.4)]"
                        : "bg-slate-900/80 text-slate-300 border-slate-800 hover:border-sky-500/50 hover:bg-slate-850"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold">{item.title}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-slate-950" />}
                    </div>
                    <div className={`text-[10px] mt-0.5 ${isSelected ? "text-slate-900" : "text-slate-400"}`}>
                      {item.subtitle}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Internal Bus Bridge Indicator */}
          <div className="flex items-center justify-center gap-2 py-0.5">
            <div className="h-px bg-slate-800 flex-1" />
            <div className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 font-mono text-[10px] text-cyan-400 flex items-center gap-1.5">
              <span>Internal 16-Bit Bus & Instruction Stream Pipelining</span>
            </div>
            <div className="h-px bg-slate-800 flex-1" />
          </div>

          {/* 2. EXECUTION UNIT (EU) CONTAINER */}
          <div className="p-4 rounded-xl border border-cyan-500/30 bg-cyan-950/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                Execution Unit (EU) - Instruction Decoding & ALU Computation
              </span>
              <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
                Executes MOV, IN, OUT, TEST, JZ, JNZ, JMP
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 font-mono text-xs">
              {[
                { id: "eu", title: "EU Control System", subtitle: "Execution Coordinator" },
                { id: "decoder", title: "Instruction Decoder", subtitle: "Translates Opcodes" },
                { id: "alu", title: "16-Bit ALU", subtitle: "Arithmetic & Logic (TEST)" },
                { id: "general-regs", title: "General Regs", subtitle: "AX, BX, CX, DX (AL/BL/DX)" },
                { id: "flag-reg", title: "FLAGS Register", subtitle: "Zero Flag (ZF), SF, PF, CF" },
                { id: "system-bus", title: "Multiplexed Bus", subtitle: "AD0-AD15 to 8255 PPI" },
              ].map((item) => {
                const isSelected = selectedId === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                      isSelected
                        ? "bg-cyan-500 text-slate-950 font-bold border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                        : "bg-slate-900/80 text-slate-300 border-slate-800 hover:border-cyan-500/50 hover:bg-slate-850"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold">{item.title}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-slate-950" />}
                    </div>
                    <div className={`text-[10px] mt-0.5 ${isSelected ? "text-slate-900" : "text-slate-400"}`}>
                      {item.subtitle}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Selected Component Detailed Inspector Card */}
        <div className="p-5 sm:p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2.5">
                <h4 className="text-lg font-bold text-white font-mono">{selectedComponent.name}</h4>
                <Badge
                  variant={
                    selectedComponent.subsystem.includes("BIU")
                      ? "blue"
                      : selectedComponent.subsystem.includes("EU")
                      ? "cyan"
                      : "emerald"
                  }
                  size="sm"
                >
                  {selectedComponent.subsystem}
                </Badge>
              </div>
              <p className="text-xs text-slate-400 mt-1">{selectedComponent.purpose}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            {/* Operational Mechanics */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2">
              <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" />
                How It Operates (Architecture)
              </span>
              <p className="text-slate-300 font-sans leading-relaxed text-xs">
                {selectedComponent.howItOperates}
              </p>
            </div>

            {/* Role in AQUA8086 */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Role in AQUA8086 Water Controller
              </span>
              <p className="text-slate-300 font-sans leading-relaxed text-xs">
                {selectedComponent.roleInProject}
              </p>
            </div>
          </div>

          {/* Subsystem Specifications List */}
          <div className="pt-2">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-2">
              Internal Architecture Specifications:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {selectedComponent.internalSpecs.map((spec, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded bg-slate-900 border border-slate-850 font-mono text-[11px] text-slate-300"
                >
                  {spec}
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

