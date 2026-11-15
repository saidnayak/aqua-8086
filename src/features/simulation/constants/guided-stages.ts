/**
 * Guided Demonstration Stages Specification for AQUA8086
 * Exactly 10 stages teaching the full closed-loop control sequence.
 */

export interface GuidedStage {
  stageNumber: number;
  id: string;
  title: string;
  studentExplanation: string;
  technicalExplanation: string;
  highlightedComponent: "processor" | "ppi" | "low-sensor" | "high-sensor" | "pump" | "tank" | "bus";
  relevantInstruction: string;
  targetWaterLevel: number;
  targetPortA: number;
  targetPortB: number;
  expectedPumpState: boolean;
  expectedRegisters: {
    ax?: number;
    al?: number;
    bx?: number;
    bl?: number;
    dx?: number;
    ip?: number;
  };
  expectedFlags: {
    zf?: boolean;
  };
  signalFlowType: "IDLE" | "INPUT" | "PROCESSING" | "OUTPUT" | "PUMP_ACTIVE" | "DRAINING";
}

export const GUIDED_STAGES: GuidedStage[] = [
  {
    stageNumber: 1,
    id: "system-init",
    title: "Stage 1: System Initialization & Architecture",
    studentExplanation:
      "Welcome to AQUA8086. We have a water reservoir with two probes: a low sensor at 25% and a high sensor at 85%. The 8086 microprocessor runs firmware configured to communicate with the 8255 Programmable Peripheral Interface (PPI). Before sensing water, the CPU sends control word 90H to initialize the 8255.",
    technicalExplanation:
      "CPU executes MOV AL, 90H; MOV DX, 83H; OUT DX, AL. This writes 90H (10010000B) into the 8255 Control Register at virtual address 83H, configuring Port A (80H) in Mode 0 Basic Input and Port B (81H) in Mode 0 Basic Output.",
    highlightedComponent: "ppi",
    relevantInstruction: "OUT DX, AL (Control Word 90H -> Port 83H)",
    targetWaterLevel: 15.0,
    targetPortA: 0x00,
    targetPortB: 0x00,
    expectedPumpState: false,
    expectedRegisters: { al: 0x90, dx: 0x83, bl: 0x00, ip: 0x06 },
    expectedFlags: { zf: false },
    signalFlowType: "PROCESSING",
  },
  {
    stageNumber: 2,
    id: "sensor-input",
    title: "Stage 2: Sensor Input Detection (< 25%)",
    studentExplanation:
      "The reservoir starts empty (around 15% water). Because the water level is below 25%, both the low probe and high probe are out of the water (dry). Both sensor lines output logic 0 to Port A of the 8255, giving Port A = 00H.",
    technicalExplanation:
      "Water level = 15% < 25%. Low sensor probe PA0 = 0 and high sensor probe PA1 = 0. The 8255 PPI latches PA7-PA0 = 00000000B (00H). The sensor lines buffer clean digital levels into the 8255 input buffer ready for bus acquisition.",
    highlightedComponent: "low-sensor",
    relevantInstruction: "MOV DX, 80H (Prepare Port A Sensor Address)",
    targetWaterLevel: 15.0,
    targetPortA: 0x00,
    targetPortB: 0x00,
    expectedPumpState: false,
    expectedRegisters: { dx: 0x80, ip: 0x0b },
    expectedFlags: { zf: false },
    signalFlowType: "INPUT",
  },
  {
    stageNumber: 3,
    id: "processor-read",
    title: "Stage 3: Processor Read Operation (IN AL, DX)",
    studentExplanation:
      "Now the 8086 microprocessor reads the sensors. It executes the IN AL, DX instruction. Data travels across the data bus from Port A of the 8255 directly into the 8086 Accumulator (AL register). AL now holds 00H.",
    technicalExplanation:
      "Execution of IN AL, DX triggers an I/O Read bus cycle: 8086 places 80H on the address bus, activates RD# strobe, the 8255 places the Port A byte onto AD7-AD0, and the CPU latches 00H into register AL.",
    highlightedComponent: "processor",
    relevantInstruction: "IN AL, DX (Read Port A into AL)",
    targetWaterLevel: 15.0,
    targetPortA: 0x00,
    targetPortB: 0x00,
    expectedPumpState: false,
    expectedRegisters: { al: 0x00, dx: 0x80, ip: 0x0c },
    expectedFlags: { zf: false },
    signalFlowType: "INPUT",
  },
  {
    stageNumber: 4,
    id: "processor-decision",
    title: "Stage 4: Processor High-Level Decision (TEST AL, 02H)",
    studentExplanation:
      "The 8086 checks if the tank is full by inspecting bit 1 (PA1, the high sensor). It performs TEST AL, 02H. Because AL is 00H, bit 1 is 0. The result is zero, which sets the Zero Flag (ZF = 1). The JNZ TANK_FULL branch is NOT taken.",
    technicalExplanation:
      "Bitwise AND of AL (00000000B) and mask 02H (00000010B) produces 00H. The ALU updates status flags: ZF=1, SF=0, PF=1, CF=0, OF=0. Instruction JNZ TANK_FULL evaluates ZF; since ZF=1 (Not Zero is false), branch is not taken and execution proceeds sequentially to 0010H.",
    highlightedComponent: "processor",
    relevantInstruction: "TEST AL, 02H & JNZ TANK_FULL",
    targetWaterLevel: 15.0,
    targetPortA: 0x00,
    targetPortB: 0x00,
    expectedPumpState: false,
    expectedRegisters: { al: 0x00, ip: 0x10 },
    expectedFlags: { zf: true },
    signalFlowType: "PROCESSING",
  },
  {
    stageNumber: 5,
    id: "low-level-condition",
    title: "Stage 5: Low-Level Condition Evaluation (TEST AL, 01H)",
    studentExplanation:
      "Next, the 8086 checks bit 0 (PA0, the low sensor) with TEST AL, 01H. Since bit 0 is also 0, the result is zero (ZF = 1). The instruction JZ TANK_LOW branches to the refill routine! The CPU sets BL = 01H, signaling that the pump must turn ON.",
    technicalExplanation:
      "TEST AL, 01H performs 00H & 01H = 00H -> ZF=1. JZ TANK_LOW checks ZF=1 and jumps to byte offset 0016H (TANK_LOW). The CPU executes MOV BL, 01H, loading the pump activation code into BL and jumping to UPDATE (001CH).",
    highlightedComponent: "processor",
    relevantInstruction: "JZ TANK_LOW -> MOV BL, 01H",
    targetWaterLevel: 15.0,
    targetPortA: 0x00,
    targetPortB: 0x00,
    expectedPumpState: false,
    expectedRegisters: { bl: 0x01, ip: 0x1c },
    expectedFlags: { zf: true },
    signalFlowType: "PROCESSING",
  },
  {
    stageNumber: 6,
    id: "output-operation",
    title: "Stage 6: Output Actuation (OUT DX, AL -> PB0 = 1)",
    studentExplanation:
      "The CPU prepares to actuate the pump. It targets Port B (address 81H), transfers BL into AL, and executes OUT DX, AL. The 8255 receives 01H on Port B. Pin PB0 goes HIGH (+5V), energizing the relay and turning on the water pump!",
    technicalExplanation:
      "Instructions: MOV DX, 81H; MOV AL, BL; OUT DX, AL. The OUT instruction generates an I/O Write cycle. Address 81H is decoded by 8255, WR# strobe latches data 01H into Port B output buffer. PB0 bit 0 transitions to 1, driving the optocoupler and relay circuit.",
    highlightedComponent: "pump",
    relevantInstruction: "OUT DX, AL (Port 81H = 01H -> Pump Relay ON)",
    targetWaterLevel: 15.0,
    targetPortA: 0x00,
    targetPortB: 0x01,
    expectedPumpState: true,
    expectedRegisters: { al: 0x01, bl: 0x01, dx: 0x81, ip: 0x22 },
    expectedFlags: { zf: true },
    signalFlowType: "OUTPUT",
  },
  {
    stageNumber: 7,
    id: "water-filling",
    title: "Stage 7: Water Filling & Closed-Loop Polling",
    studentExplanation:
      "The pump is active and pumping water into the reservoir. As water enters, the level climbs continuously. Meanwhile, the 8086 loops back to CHECK (JMP CHECK) and continuously reads sensor inputs to observe the rising water.",
    technicalExplanation:
      "The pump runs at ~7.5% per second. In the CPU, JMP CHECK unconditionally returns IP to byte offset 0008H (CHECK label). The 8086 repeatedly polls Port A (IN AL, DX). The hardware closed loop is now actively running in real time.",
    highlightedComponent: "tank",
    relevantInstruction: "JMP CHECK (Continuous Closed-Loop Polling)",
    targetWaterLevel: 35.0,
    targetPortA: 0x01,
    targetPortB: 0x01,
    expectedPumpState: true,
    expectedRegisters: { al: 0x01, bl: 0x01, dx: 0x80, ip: 0x0c },
    expectedFlags: { zf: true },
    signalFlowType: "PUMP_ACTIVE",
  },
  {
    stageNumber: 8,
    id: "middle-water-level",
    title: "Stage 8: Middle Water Level & Hysteresis Zone (~50%)",
    studentExplanation:
      "The water has reached 50%. The low probe is submerged (PA0 = 1), but the high probe is still dry (PA1 = 0), so Port A reads 01H. Notice that the pump remains ON! This is hysteresis: neither TANK_FULL nor TANK_LOW is triggered, so the CPU retains BL=01H, preventing rapid on-off switching.",
    technicalExplanation:
      "At waterLevel = 50%, Port A = 01H (PA1=0, PA0=1). TEST AL, 02H yields 0 -> JNZ TANK_FULL is false. TEST AL, 01H yields 1 -> JZ TANK_LOW is false (ZF=0). Execution falls through to JMP UPDATE (001CH) without modifying BL. BL retains 01H, maintaining Port B = 01H.",
    highlightedComponent: "low-sensor",
    relevantInstruction: "JMP UPDATE (Retain BL = 01H: Hysteresis Memory)",
    targetWaterLevel: 50.0,
    targetPortA: 0x01,
    targetPortB: 0x01,
    expectedPumpState: true,
    expectedRegisters: { al: 0x01, bl: 0x01, dx: 0x81, ip: 0x22 },
    expectedFlags: { zf: false },
    signalFlowType: "PUMP_ACTIVE",
  },
  {
    stageNumber: 9,
    id: "full-tank",
    title: "Stage 9: Tank Full Threshold Reached (>= 85%)",
    studentExplanation:
      "The water reaches 90%. Both probes are now submerged! Port A reports 03H (PA0=1, PA1=1). The 8086 tests bit 1 (TEST AL, 02H). Because bit 1 is set, ZF=0. The branch JNZ TANK_FULL is TAKEN! The CPU loads BL = 00H and executes OUT DX, AL. PB0 becomes 0, stopping the pump immediately!",
    technicalExplanation:
      "Water level >= 85% -> Port A = 03H. TEST AL, 02H evaluates 03H & 02H = 02H (non-zero, ZF=0). Instruction JNZ TANK_FULL branches directly to byte offset 001AH (TANK_FULL). Instruction MOV BL, 00H clears pump control bit. Then UPDATE writes 00H to Port B (81H), clearing PB0 to 0.",
    highlightedComponent: "high-sensor",
    relevantInstruction: "JNZ TANK_FULL -> MOV BL, 00H -> OUT DX, AL",
    targetWaterLevel: 90.0,
    targetPortA: 0x03,
    targetPortB: 0x00,
    expectedPumpState: false,
    expectedRegisters: { al: 0x00, bl: 0x00, dx: 0x81, ip: 0x22 },
    expectedFlags: { zf: false },
    signalFlowType: "OUTPUT",
  },
  {
    stageNumber: 10,
    id: "complete-cycle",
    title: "Stage 10: Complete Feedback Cycle & Water Consumption",
    studentExplanation:
      "As water is consumed from the tank, the level drops through 70% and 50%. The pump stays completely OFF because the tank has not reached the lower threshold yet. Only when water drops below 25% does the processor detect PA = 00H again and automatically restart the pump. The system is fully automated and infinite!",
    technicalExplanation:
      "During draining, the hysteresis band holds BL=00H while water level remains between 85% and 25%. Once level drops < 25%, low probe dries out, Port A becomes 00H, TEST AL, 01H sets ZF=1, JZ TANK_LOW branches to 0016H to set BL=01H, and the cycle repeats indefinitely.",
    highlightedComponent: "tank",
    relevantInstruction: "CHECK -> SENSE -> ACTUATE -> LOOP (Autonomous)",
    targetWaterLevel: 20.0,
    targetPortA: 0x00,
    targetPortB: 0x01,
    expectedPumpState: true,
    expectedRegisters: { al: 0x01, bl: 0x01, dx: 0x81, ip: 0x08 },
    expectedFlags: { zf: true },
    signalFlowType: "DRAINING",
  },
];

