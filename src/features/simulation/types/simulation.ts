/**
 * AQUA8086 Virtual Hardware & Simulation Engine Types
 * Pure TypeScript types for 8086 CPU, 8255 PPI, Sensors, Tank Physics, and Simulation State.
 */

export type Register16 = "AX" | "BX" | "CX" | "DX" | "SP" | "BP" | "SI" | "DI" | "IP" | "CS" | "DS" | "SS" | "ES";
export type Register8 = "AL" | "AH" | "BL" | "BH" | "CL" | "CH" | "DL" | "DH";
export type RegisterName = Register16 | Register8;

export interface CPUFlags {
  zf: boolean; // Zero Flag
  sf: boolean; // Sign Flag
  pf: boolean; // Parity Flag
  cf: boolean; // Carry Flag
  of: boolean; // Overflow Flag
}

export interface CPURegisters {
  ax: number;
  bx: number;
  cx: number;
  dx: number;
  ip: number;
  cs: number;
  ds: number;
  ss: number;
  es: number;
  sp: number;
  bp: number;
  si: number;
  di: number;
}

export type ExecutionStatus = "IDLE" | "RUNNING" | "PAUSED" | "STEPPING" | "HALTED" | "ERROR";

export type Mnemonic = "MOV" | "IN" | "OUT" | "TEST" | "JZ" | "JNZ" | "JMP" | "NOP";

export interface ParsedInstruction {
  index: number;
  address: number;
  byteOffset: number;
  lengthInBytes: number;
  encodedBytes: string[];
  label?: string;
  mnemonic: Mnemonic;
  operands: string[];
  rawText: string;
  sourceLineNumber: number;
}

export interface AssemblyProgram {
  instructions: ParsedInstruction[];
  labels: Record<string, number>; // Label name -> byteOffset
  labelIndices: Record<string, number>; // Label name -> instruction index
  sourceCode: string;
  totalBytes: number;
}

export interface ExecutionLogEntry {
  id: string;
  stepNumber: number;
  ip: number;
  mnemonic: string;
  operands: string[];
  description: string;
  timestamp: number;
  type: "INFO" | "IO_READ" | "IO_WRITE" | "BRANCH" | "STATE_CHANGE" | "WARNING" | "ERROR";
}

export interface PPI8255State {
  controlWord: number; // Configured control word (e.g. 0x90)
  isConfigured: boolean;
  portA: number; // 80H - Sensor input
  portB: number; // 81H - Pump output
  portC: number; // 82H - General output
  portADirection: "input" | "output";
  portBDirection: "input" | "output";
  portCDirection: "input" | "output";
  groupAMode: number;
  groupBMode: number;
  lastReadPort?: number;
  lastWrittenPort?: number;
}

export interface WaterSensorsState {
  lowSensor: boolean; // PA0: true if level >= 25%
  highSensor: boolean; // PA1: true if level >= 85%
  portAValue: number; // Combined (PA1 << 1) | PA0
  isInconsistent: boolean; // PA0=false & PA1=true (0x02)
  faultMessage?: string;
}

export type SystemCondition = "FILLING" | "DRAINING" | "STANDBY" | "INCONSISTENCY_WARNING";

export interface WaterTankState {
  waterLevel: number; // 0 to 100 percentage
  isPumpOn: boolean; // Driven by PB0
  isDraining: boolean; // User-controlled water consumption
  fillRatePerSec: number; // % per second when pump is ON (e.g. 8)
  drainRatePerSec: number; // % per second when draining (e.g. 4)
  systemCondition: SystemCondition;
}

export interface SimulationTelemetry {
  cpuState: {
    registers: CPURegisters;
    flags: CPUFlags;
    status: ExecutionStatus;
    currentInstructionIndex: number;
    totalCycles: number;
  };
  ppiState: PPI8255State;
  sensorsState: WaterSensorsState;
  tankState: WaterTankState;
  activeInstruction?: ParsedInstruction;
  logs: ExecutionLogEntry[];
  busActivity: {
    active: boolean;
    busType: "IDLE" | "IN_READ" | "OUT_WRITE";
    portAddress: number;
    dataByte: number;
  };
}

