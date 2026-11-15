/**
 * AQUA8086 Simulation Specifications & Data Models
 * 
 * This module defines the architecture contracts, state structures,
 * and logic truth tables for the Intel 8086 automatic water level controller.
 * All simulation logic remains pure and decoupled from React presentation components.
 */

export interface SystemState {
  waterLevelPercentage: number;
  isPumpRunning: boolean;
  lowSensorActive: boolean; // True if water is touching low sensor
  highSensorActive: boolean; // True if water is touching high sensor
  portAValue: number; // 8-bit input from sensors
  portBValue: number; // 8-bit output to actuators
  controlWord: number; // 8255 control word (0x90)
  registers: {
    ax: number;
    bx: number;
    cx: number;
    dx: number;
    ip: number;
    cs: number;
    flags: {
      zf: boolean;
      cf: boolean;
      sf: boolean;
      of: boolean;
    };
  };
  cycleCount: number;
  lastOperation: string;
}

export const INITIAL_SIMULATION_SPEC: Readonly<SystemState> = {
  waterLevelPercentage: 10.0,
  isPumpRunning: false,
  lowSensorActive: false,
  highSensorActive: false,
  portAValue: 0x00, // PA0=0 (dry), PA1=0 (dry)
  portBValue: 0x00, // PB0=0 (pump off)
  controlWord: 0x90, // Mode 0: Port A In, Port B Out
  registers: {
    ax: 0x0000,
    bx: 0x0000,
    cx: 0x0000,
    dx: 0x0083, // Pointing to Control Port (83H)
    ip: 0x0000,
    cs: 0x1000,
    flags: {
      zf: false,
      cf: false,
      sf: false,
      of: false,
    },
  },
  cycleCount: 0,
  lastOperation: "SYSTEM_INITIALIZED",
};

export const SENSOR_TRUTH_TABLE = [
  {
    waterRange: "0% - 24%",
    condition: "Tank Below Low Threshold (< 25%)",
    pa0: 0, // Dry
    pa1: 0, // Dry
    portAHex: "0x00H",
    action: "JZ TANK_LOW -> BL = 01H (Pump ON)",
    pb0: 1,
    statusText: "Filling Active",
  },
  {
    waterRange: "25% - 84% (Filling)",
    condition: "Mid Hysteresis Band (Rising)",
    pa0: 1, // Submerged
    pa1: 0, // Dry
    portAHex: "0x01H",
    action: "JMP UPDATE -> Retain BL = 01H (Pump ON)",
    pb0: 1,
    statusText: "Replenishing",
  },
  {
    waterRange: "85% - 100%",
    condition: "Tank Full Cutoff (>= 85%)",
    pa0: 1, // Submerged
    pa1: 1, // Submerged
    portAHex: "0x03H",
    action: "JNZ TANK_FULL -> BL = 00H (Pump OFF)",
    pb0: 0,
    statusText: "Cutoff Limit Reached",
  },
  {
    waterRange: "25% - 84% (Draining)",
    condition: "Mid Hysteresis Band (Draining)",
    pa0: 1, // Submerged
    pa1: 0, // Dry
    portAHex: "0x01H",
    action: "JMP UPDATE -> Retain BL = 00H (Pump OFF)",
    pb0: 0,
    statusText: "Standby Hold",
  },
  {
    waterRange: "Hardware Fault",
    condition: "Inconsistent Sensor Anomaly (PA1=1, PA0=0)",
    pa0: 0, // Dry
    pa1: 1, // Submerged
    portAHex: "0x02H",
    action: "JNZ TANK_FULL -> Safe Cutoff (Pump OFF)",
    pb0: 0,
    statusText: "Fault Safe Shutdown",
  },
];

export const ASSEMBLY_PROGRAM_LISTING = [
  {
    address: "0x0000H (#0)",
    bytes: "B0 90 (2B)",
    mnemonic: "MOV AL, 90H",
    comment: "Load 8255 Control Word 90H (10010000B: Mode 0, Port A=In, Port B=Out) into AL",
  },
  {
    address: "0x0002H (#1)",
    bytes: "BA 83 00 (3B)",
    mnemonic: "MOV DX, 83H",
    comment: "Load DX with 8255 Control Word Register I/O port address (83H)",
  },
  {
    address: "0x0005H (#2)",
    bytes: "EE (1B)",
    mnemonic: "OUT DX, AL",
    comment: "Write Control Word 90H from AL to Port 83H to configure 8255 PPI",
  },
  {
    address: "0x0006H (#3)",
    bytes: "B3 00 (2B)",
    mnemonic: "MOV BL, 00H",
    comment: "Initialize Base Register Low BL = 00H (Pump initially OFF)",
  },
  {
    address: "0x0008H (#4)",
    bytes: "BA 80 00 (3B)",
    mnemonic: "CHECK: MOV DX, 80H",
    comment: "Point DX to 8255 Port A (80H) where water sensor probes PA0 & PA1 are wired",
  },
  {
    address: "0x000BH (#5)",
    bytes: "EC (1B)",
    mnemonic: "IN AL, DX",
    comment: "Read 8-bit sensor status byte from Port A (80H) into accumulator AL",
  },
  {
    address: "0x000CH (#6)",
    bytes: "A8 02 (2B)",
    mnemonic: "TEST AL, 02H",
    comment: "Bitwise AND of AL with 02H to test High Sensor bit PA1 (1 = >=85% or fault)",
  },
  {
    address: "0x000EH (#7)",
    bytes: "75 0A (2B)",
    mnemonic: "JNZ TANK_FULL",
    comment: "If PA1 = 1 (ZF=0), jump to TANK_FULL (0x001AH) to shut off the pump",
  },
  {
    address: "0x0010H (#8)",
    bytes: "A8 01 (2B)",
    mnemonic: "TEST AL, 01H",
    comment: "Bitwise AND of AL with 01H to test Low Sensor bit PA0 (0 = <25% dry)",
  },
  {
    address: "0x0012H (#9)",
    bytes: "74 02 (2B)",
    mnemonic: "JZ TANK_LOW",
    comment: "If PA0 = 0 (ZF=1), jump to TANK_LOW (0x0016H) to turn ON the pump",
  },
  {
    address: "0x0014H (#10)",
    bytes: "EB 06 (2B)",
    mnemonic: "JMP UPDATE",
    comment: "Mid-level hysteresis zone (25%-84%): jump to UPDATE (0x001CH) retaining BL",
  },
  {
    address: "0x0016H (#11)",
    bytes: "B3 01 (2B)",
    mnemonic: "TANK_LOW: MOV BL, 01H",
    comment: "Set pump state register BL = 01H (Command Pump ON)",
  },
  {
    address: "0x0018H (#12)",
    bytes: "EB 02 (2B)",
    mnemonic: "JMP UPDATE",
    comment: "Jump unconditionally to UPDATE (0x001CH) to output new pump state",
  },
  {
    address: "0x001AH (#13)",
    bytes: "B3 00 (2B)",
    mnemonic: "TANK_FULL: MOV BL, 00H",
    comment: "Clear pump state register BL = 00H (Command Pump OFF)",
  },
  {
    address: "0x001CH (#14)",
    bytes: "BA 81 00 (3B)",
    mnemonic: "UPDATE: MOV DX, 81H",
    comment: "Point DX to 8255 Port B (81H) connected to the motor relay driver",
  },
  {
    address: "0x001FH (#15)",
    bytes: "8A C3 (2B)",
    mnemonic: "MOV AL, BL",
    comment: "Copy pump command state from BL into accumulator AL for I/O output",
  },
  {
    address: "0x0021H (#16)",
    bytes: "EE (1B)",
    mnemonic: "OUT DX, AL",
    comment: "Write AL to Port B (81H), driving PB0 relay line (1 = Pump ON, 0 = Pump OFF)",
  },
  {
    address: "0x0022H (#17)",
    bytes: "EB E4 (2B)",
    mnemonic: "JMP CHECK",
    comment: "Jump back to CHECK (0x0008H) for continuous closed-loop monitoring (Total: 36B)",
  },
];

