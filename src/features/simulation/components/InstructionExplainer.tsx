"use client";

import React from "react";
import { Terminal, Info, Flag, ArrowRight, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { ParsedInstruction, CPURegisters, CPUFlags } from "../types/simulation";

interface InstructionExplainerProps {
  instruction?: ParsedInstruction;
  registers: CPURegisters;
  flags: CPUFlags;
  portAValue: number;
}

interface ExplanationDetail {
  mnemonic: string;
  operandsText: string;
  meaning: string;
  dataUsed: string;
  operation: string;
  flagChange: string;
  whatHappensNext: string;
  whyRequired: string;
}

function getInstructionExplanation(
  instruction: ParsedInstruction | undefined,
  registers: CPURegisters,
  flags: CPUFlags,
  portAValue: number
): ExplanationDetail {
  if (!instruction) {
    return {
      mnemonic: "STANDBY",
      operandsText: "None",
      meaning: "Processor idling or waiting for start trigger",
      dataUsed: "None",
      operation: "Clock idle",
      flagChange: "No flags affected",
      whatHappensNext: "Advances to the first instruction at IP=0000H upon run trigger",
      whyRequired: "Provides a safe initial standby condition before executing firmware routines.",
    };
  }

  const { mnemonic, operands } = instruction;
  const operandsText = operands.join(", ");
  const opStr = `${mnemonic} ${operandsText}`.toUpperCase();

  if (opStr.includes("MOV AL, 90H")) {
    return {
      mnemonic,
      operandsText,
      meaning: "Load Immediate Byte into AL (2 Bytes: B0 90)",
      dataUsed: "Immediate hex literal 90H (10010000B)",
      operation: "AL ← 90H. Copies configuration control byte into accumulator register AL (IP +2B).",
      flagChange: "None. MOV instruction does not modify any condition flags.",
      whatHappensNext: "Next instruction MOV DX, 83H (0x0002H) prepares the 8255 Control Register address.",
      whyRequired:
        "Prepares the 8255 control word (Mode 0: Port A input, Port B output) in AL before sending it out.",
    };
  }

  if (opStr.includes("MOV DX, 83H")) {
    return {
      mnemonic,
      operandsText,
      meaning: "Load Immediate Address into DX (3 Bytes: BA 83 00)",
      dataUsed: "Immediate hex address 83H",
      operation: "DX ← 0083H. Loads virtual I/O port address of the 8255 Control Word Register (IP +3B).",
      flagChange: "None. MOV does not modify flags.",
      whatHappensNext: "Next instruction OUT DX, AL (0x0005H) will transmit the control word to the 8255.",
      whyRequired:
        "The 8086 requires register DX to hold variable 16-bit I/O port addresses when utilizing indirect port addressing.",
    };
  }

  if (opStr.includes("OUT DX, AL") && registers.dx === 0x83) {
    return {
      mnemonic,
      operandsText,
      meaning: "Output Byte to I/O Port (Configure 8255, 1 Byte: EE)",
      dataUsed: "AL = 90H, DX = 83H",
      operation: "Port[DX] ← AL. Generates an I/O Write bus cycle latching 90H into 8255 CWR (IP +1B).",
      flagChange: "None. OUT instruction does not affect status flags.",
      whatHappensNext: "Proceeds to 0x0006H to initialize BL to 00H (pump initially OFF).",
      whyRequired:
        "Configures 8255 hardware into Mode 0: Port A as sensor input and Port B as pump driver output.",
    };
  }

  if (opStr.includes("MOV BL, 00H")) {
    return {
      mnemonic,
      operandsText,
      meaning: "Clear Base Register Low (Pump Standby, 2 Bytes: B3 00)",
      dataUsed: "Immediate 00H",
      operation: "BL ← 00H. Sets internal pump status latch to 0 (OFF) (IP +2B).",
      flagChange: "None.",
      whatHappensNext: "Enters the main polling loop at label CHECK (0x0008H) or UPDATE (0x001CH).",
      whyRequired:
        "Ensures the water pump is safely in the OFF state upon system initialization or after reaching full threshold.",
    };
  }

  if (opStr.includes("MOV DX, 80H")) {
    return {
      mnemonic,
      operandsText,
      meaning: "Target Port A Address (3 Bytes: BA 80 00)",
      dataUsed: "Immediate 80H (Port A sensor input address)",
      operation: "DX ← 0080H. Points DX register to 8255 Port A (IP +3B).",
      flagChange: "None.",
      whatHappensNext: "Executes IN AL, DX (0x000BH) to sample water level probes.",
      whyRequired: "Sets the I/O bus pointer so the next IN instruction reads the water sensors.",
    };
  }

  if (opStr.includes("IN AL, DX")) {
    return {
      mnemonic,
      operandsText,
      meaning: "Read Sensor Input Byte from Port A (1 Byte: EC)",
      dataUsed: `Port A = 0x${portAValue.toString(16).toUpperCase().padStart(2, "0")}H (PA1=${(portAValue >> 1) & 1}, PA0=${portAValue & 1})`,
      operation: "AL ← Port[DX]. 8086 initiates an I/O Read cycle latching sensor lines into AL (IP +1B).",
      flagChange: "None. IN instruction transfers data without updating flags.",
      whatHappensNext: "Executes TEST AL, 02H (0x000CH) to test if the high-level water probe is submerged.",
      whyRequired:
        "Brings physical water level sensor data into the microprocessor Accumulator so algorithmic threshold tests can be evaluated.",
    };
  }

  if (opStr.includes("TEST AL, 02H")) {
    const isHighActive = (portAValue & 0x02) !== 0;
    return {
      mnemonic,
      operandsText,
      meaning: "Bitwise Test for High Water Sensor (2 Bytes: A8 02)",
      dataUsed: `AL = 0x${(registers.ax & 0xff).toString(16).toUpperCase().padStart(2, "0")}H, Mask = 02H (00000010B)`,
      operation: "AL & 02H. Evaluates bit 1 (PA1) without altering the contents of AL (IP +2B).",
      flagChange: `ZF = ${isHighActive ? "0 (Not Zero)" : "1 (Zero)"}, SF = 0, PF = ${flags.pf ? "1" : "0"}, CF = 0, OF = 0`,
      whatHappensNext: isHighActive
        ? "JNZ TANK_FULL will evaluate ZF=0 and TAKE the branch to 0x001AH to turn off the pump!"
        : "JNZ TANK_FULL will evaluate ZF=1 and FALL THROUGH to 0x0010H to test the low water sensor.",
      whyRequired:
        "Allows the processor to determine if the water has reached the upper 85% threshold so it can prevent tank overflow.",
    };
  }

  if (opStr.includes("JNZ TANK_FULL")) {
    const branchTaken = !flags.zf;
    return {
      mnemonic,
      operandsText,
      meaning: "Jump if Not Zero (2 Bytes: 75 0A)",
      dataUsed: `Zero Flag (ZF) = ${flags.zf ? 1 : 0}`,
      operation: branchTaken
        ? "IP ← 0x001AH (TANK_FULL, Branch TAKEN)"
        : "IP ← IP + 2 = 0x0010H (Branch NOT taken)",
      flagChange: "None. Jump instructions do not modify flags.",
      whatHappensNext: branchTaken
        ? "Branches to TANK_FULL (0x001AH) to load BL = 00H and shut down pump."
        : "Proceeds to TEST AL, 01H (0x0010H) to check if the tank is empty.",
      whyRequired:
        "Implements the conditional high-threshold cutoff decision in the automatic feedback control loop.",
    };
  }

  if (opStr.includes("TEST AL, 01H")) {
    const isLowActive = (portAValue & 0x01) !== 0;
    return {
      mnemonic,
      operandsText,
      meaning: "Bitwise Test for Low Water Sensor (2 Bytes: A8 01)",
      dataUsed: `AL = 0x${(registers.ax & 0xff).toString(16).toUpperCase().padStart(2, "0")}H, Mask = 01H (00000001B)`,
      operation: "AL & 01H. Evaluates bit 0 (PA0) without modifying AL (IP +2B).",
      flagChange: `ZF = ${isLowActive ? "0 (Low probe submerged)" : "1 (Low probe dry / tank empty)"}`,
      whatHappensNext: !isLowActive
        ? "JZ TANK_LOW will evaluate ZF=1 and TAKE the branch to 0x0016H to turn ON the pump!"
        : "JZ TANK_LOW will evaluate ZF=0 and FALL THROUGH to 0x0014H to retain the existing pump state (Hysteresis).",
      whyRequired:
        "Detects when the reservoir falls below the lower threshold (25%) so the 8086 can command the pump to turn on.",
    };
  }

  if (opStr.includes("JZ TANK_LOW")) {
    const branchTaken = flags.zf;
    return {
      mnemonic,
      operandsText,
      meaning: "Jump if Zero (2 Bytes: 74 02)",
      dataUsed: `Zero Flag (ZF) = ${flags.zf ? 1 : 0}`,
      operation: branchTaken
        ? "IP ← 0x0016H (TANK_LOW, Branch TAKEN)"
        : "IP ← IP + 2 = 0x0014H (Branch NOT taken)",
      flagChange: "None.",
      whatHappensNext: branchTaken
        ? "Jumps to TANK_LOW (0x0016H) to load BL = 01H (activate pump)."
        : "Falls through to JMP UPDATE (0x0014H), retaining existing BL state (Hysteresis zone).",
      whyRequired:
        "Directs program flow to activate the pump when water has depleted below the lower probe.",
    };
  }

  if (opStr.includes("MOV BL, 01H")) {
    return {
      mnemonic,
      operandsText,
      meaning: "Set Pump State Flag to Active (2 Bytes: B3 01)",
      dataUsed: "Immediate 01H",
      operation: "BL ← 01H. Loads active pump command into register BL (IP +2B).",
      flagChange: "None.",
      whatHappensNext: "Jumps unconditionally to UPDATE (0x001CH) to write the new motor command to Port B.",
      whyRequired:
        "Prepares the digital HIGH (+5V) signal for the pump relay driver in register BL.",
    };
  }

  if (opStr.includes("MOV DX, 81H")) {
    return {
      mnemonic,
      operandsText,
      meaning: "Target Port B Motor Driver Address (3 Bytes: BA 81 00)",
      dataUsed: "Immediate 81H (Port B output address)",
      operation: "DX ← 0081H. Points DX to 8255 Port B (IP +3B).",
      flagChange: "None.",
      whatHappensNext: "Executes MOV AL, BL (0x001FH) and OUT DX, AL (0x0021H) to actuate the pump relay.",
      whyRequired: "Targets the 8255 output port connected to the motor driver optocoupler.",
    };
  }

  if (opStr.includes("MOV AL, BL")) {
    return {
      mnemonic,
      operandsText,
      meaning: "Transfer Pump Control Byte to AL (2 Bytes: 8A C3)",
      dataUsed: `BL = 0x${(registers.bx & 0xff).toString(16).toUpperCase().padStart(2, "0")}H`,
      operation: "AL ← BL. Copies the decided motor command from BL into accumulator AL (IP +2B).",
      flagChange: "None.",
      whatHappensNext: "Executes OUT DX, AL (0x0021H) to send the byte out through the 8255 PPI.",
      whyRequired:
        "The 8086 OUT instruction requires the data byte to originate from register AL.",
    };
  }

  if (opStr.includes("OUT DX, AL") && registers.dx === 0x81) {
    const isPumpTriggered = (registers.ax & 0x01) === 1;
    return {
      mnemonic,
      operandsText,
      meaning: "Output Command to Port B (Actuate Pump, 1 Byte: EE)",
      dataUsed: `AL = 0x${(registers.ax & 0xff).toString(16).toUpperCase().padStart(2, "0")}H, DX = 81H`,
      operation: `Port[81H] ← AL. Writes ${isPumpTriggered ? "01H (PB0=1: Relay ON)" : "00H (PB0=0: Relay OFF)"} to 8255 Port B (IP +1B).`,
      flagChange: "None.",
      whatHappensNext: "Executes JMP CHECK (0x0022H) to repeat the closed-loop polling sequence.",
      whyRequired:
        "Physically transitions the motor relay state via the 8255 Port B output pin PB0.",
    };
  }

  if (opStr.includes("JMP UPDATE")) {
    return {
      mnemonic,
      operandsText,
      meaning: "Unconditional Jump to UPDATE Output Stage (2 Bytes: EB rel8)",
      dataUsed: "UPDATE label target byte offset (0x001CH, Instruction #14)",
      operation: "IP ← 0x001CH (UPDATE). Jumps directly to Port B output emission stage.",
      flagChange: "None.",
      whatHappensNext: "Executes MOV DX, 81H at 0x001CH to emit BL to 8255 Port B.",
      whyRequired:
        "Preserves the current or newly updated pump state in BL and directs execution to update the 8255 output latch.",
    };
  }

  if (opStr.includes("JMP CHECK")) {
    return {
      mnemonic,
      operandsText,
      meaning: "Unconditional Jump to CHECK Loop (2 Bytes: EB E4)",
      dataUsed: "CHECK label target byte offset (0x0008H, Instruction #4)",
      operation: "IP ← 0x0008H (CHECK). Loops back to re-sample water sensors.",
      flagChange: "None.",
      whatHappensNext: "Instruction Pointer jumps to 0x0008H (CHECK), restarting the sensor read cycle.",
      whyRequired:
        "Forms the infinite closed-loop polling cycle that makes the water controller fully automatic and continuous.",
    };
  }

  // Fallback generic explanation
  return {
    mnemonic,
    operandsText,
    meaning: `Execute ${mnemonic} Instruction`,
    dataUsed: operands.join(", ") || "None",
    operation: `${mnemonic} operation with operands ${operands.join(", ")}`,
    flagChange: "Evaluated according to standard 8086 instruction rules",
    whatHappensNext: "Advances instruction pointer to next sequential or branch instruction",
    whyRequired: "Forms an integral step in the 8086 water controller assembly routine.",
  };
}

export function InstructionExplainer({
  instruction,
  registers,
  flags,
  portAValue,
}: InstructionExplainerProps) {
  const detail = getInstructionExplanation(instruction, registers, flags, portAValue);

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-[#090e1a]/95 border border-slate-800 backdrop-blur-xl shadow-2xl space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold font-mono text-white">
              Educational Instruction Explainer (Student Guide)
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              In-depth breakdown of the actively executing 8086 assembly instruction
            </p>
          </div>
        </div>

        {instruction && (
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-slate-400">Active Instruction:</span>
            <Badge variant="cyan" size="sm">
              {detail.mnemonic} {detail.operandsText}
            </Badge>
          </div>
        )}
      </div>

      {/* 6 Core Educational Dimensions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 font-mono text-xs">
        {/* 1. What the instruction means */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-850 space-y-1.5">
          <span className="text-[10px] uppercase font-bold text-cyan-400 flex items-center gap-1">
            <Info className="w-3 h-3" /> 1. Instruction Meaning
          </span>
          <div className="text-slate-200 font-sans font-semibold text-xs">
            {detail.meaning}
          </div>
        </div>

        {/* 2. What data it uses */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-850 space-y-1.5">
          <span className="text-[10px] uppercase font-bold text-sky-400 flex items-center gap-1">
            <Terminal className="w-3 h-3" /> 2. Data & Operands Used
          </span>
          <div className="text-slate-300 font-mono text-[11px] truncate">
            {detail.dataUsed}
          </div>
        </div>

        {/* 3. What operation happens */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-850 space-y-1.5">
          <span className="text-[10px] uppercase font-bold text-emerald-400 flex items-center gap-1">
            <ArrowRight className="w-3 h-3" /> 3. Hardware Operation
          </span>
          <div className="text-slate-300 font-sans text-xs">
            {detail.operation}
          </div>
        </div>

        {/* 4. Flag Changes */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-850 space-y-1.5">
          <span className="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1">
            <Flag className="w-3 h-3" /> 4. Status Flag Impact
          </span>
          <div className="text-slate-300 font-mono text-[11px]">
            {detail.flagChange}
          </div>
        </div>

        {/* 5. What happens next */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-850 space-y-1.5">
          <span className="text-[10px] uppercase font-bold text-blue-400 flex items-center gap-1">
            <ArrowRight className="w-3 h-3" /> 5. Sequential Next Step
          </span>
          <div className="text-slate-300 font-sans text-xs">
            {detail.whatHappensNext}
          </div>
        </div>

        {/* 6. Why required in AQUA8086 */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-850 space-y-1.5">
          <span className="text-[10px] uppercase font-bold text-rose-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> 6. Role in Controller
          </span>
          <div className="text-slate-300 font-sans text-xs">
            {detail.whyRequired}
          </div>
        </div>
      </div>
    </div>
  );
}
