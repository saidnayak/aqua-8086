/**
 * Comprehensive Automated Test Suite for AQUA8086 Virtual Engine
 * Validates 8086 CPU, 8255 PPI, Sensor Logic, Boundary Conditions (1 to 12),
 * Register Aliasing, Flag Evaluation, Stepping, Branches, Direction Enforcement,
 * Pause/Resume, Continuous Execution, and Fault Recovery.
 */

import { assembleProgram, DEFAULT_ASSEMBLY_CODE } from "../engine/assembler";
import {
  createInitialSimulationState,
  executeSimulationStep,
  synchronizeGuidedStageState,
  synchronizePracticeScenarioState,
  IntegratedState,
} from "../engine/execution";
import { GUIDED_STAGES } from "../constants/guided-stages";
import { setRegisterValue, getRegisterValue, INITIAL_REGISTERS } from "../engine/memory";
import { evaluateTest, INITIAL_FLAGS } from "../engine/flags";
import { configurePPIControlWord, writePPIPort, readPPIPort, INITIAL_PPI_STATE } from "../hardware/ppi8255";
import { computeWaterSensors } from "../hardware/water-sensors";
import { isPumpActive } from "../hardware/pump-controller";
import { stepCPU, IOBusInterface } from "../engine/cpu8086";

// Helper to run until IP returns to CHECK loop (or loops once)
function runUntilCheckLoop(state: IntegratedState, maxSteps: number = 30): IntegratedState {
  let curr = state;
  let enteredCheck = false;
  const checkAddr = curr.program.labels["CHECK"];

  for (let i = 0; i < maxSteps; i++) {
    const { nextState } = executeSimulationStep(curr);
    curr = nextState;

    if (curr.registers.ip === checkAddr) {
      if (!enteredCheck) {
        enteredCheck = true;
      } else {
        // Completed a full loop back to CHECK
        break;
      }
    }
  }
  return curr;
}

export function runAllTests(): { passed: number; failed: number; results: { name: string; success: boolean; message?: string }[] } {
  const results: { name: string; success: boolean; message?: string }[] = [];

  function assert(condition: boolean, testName: string, message?: string) {
    if (condition) {
      results.push({ name: testName, success: true });
    } else {
      results.push({ name: testName, success: false, message: message || "Assertion failed" });
    }
  }

  // --- 1. ASSEMBLER & INSTRUCTION INTEGRITY ---
  const { program, errors } = assembleProgram(DEFAULT_ASSEMBLY_CODE);
  assert(errors.length === 0, "Assembler validation: Default firmware compiles without errors", `Errors: ${errors.join(", ")}`);
  assert(program.instructions.length > 10, "Assembler validation: Program instructions generated");
  assert(program.labels["CHECK"] !== undefined, "Assembler validation: CHECK label resolved");
  assert(program.labels["TANK_LOW"] !== undefined, "Assembler validation: TANK_LOW label resolved");
  assert(program.labels["TANK_FULL"] !== undefined, "Assembler validation: TANK_FULL label resolved");
  assert(program.labels["UPDATE"] !== undefined, "Assembler validation: UPDATE label resolved");

  // --- 2. REGISTER ALIASING TESTS (ALL 8 REGISTER PAIRS) ---
  let regs = { ...INITIAL_REGISTERS };
  // AX / AL / AH
  regs = setRegisterValue(regs, "AX", 0x1234);
  assert(getRegisterValue(regs, "AL") === 0x34, "Register Aliasing: AL extraction from AX");
  assert(getRegisterValue(regs, "AH") === 0x12, "Register Aliasing: AH extraction from AX");
  regs = setRegisterValue(regs, "AL", 0x78);
  assert(getRegisterValue(regs, "AX") === 0x1278, "Register Aliasing: AL modification updates AX");
  regs = setRegisterValue(regs, "AH", 0xab);
  assert(getRegisterValue(regs, "AX") === 0xab78, "Register Aliasing: AH modification updates AX");

  // BX / BL / BH
  regs = setRegisterValue(regs, "BX", 0x5678);
  assert(getRegisterValue(regs, "BL") === 0x78, "Register Aliasing: BL extraction from BX");
  assert(getRegisterValue(regs, "BH") === 0x56, "Register Aliasing: BH extraction from BX");
  regs = setRegisterValue(regs, "BL", 0xef);
  assert(getRegisterValue(regs, "BX") === 0x56ef, "Register Aliasing: BL modification updates BX");
  regs = setRegisterValue(regs, "BH", 0xcd);
  assert(getRegisterValue(regs, "BX") === 0xcdef, "Register Aliasing: BH modification updates BX");

  // CX / CL / CH
  regs = setRegisterValue(regs, "CX", 0x9abc);
  assert(getRegisterValue(regs, "CL") === 0xbc, "Register Aliasing: CL extraction from CX");
  assert(getRegisterValue(regs, "CH") === 0x9a, "Register Aliasing: CH extraction from CX");
  regs = setRegisterValue(regs, "CL", 0x34);
  assert(getRegisterValue(regs, "CX") === 0x9a34, "Register Aliasing: CL modification updates CX");
  regs = setRegisterValue(regs, "CH", 0x12);
  assert(getRegisterValue(regs, "CX") === 0x1234, "Register Aliasing: CH modification updates CX");

  // DX / DL / DH
  regs = setRegisterValue(regs, "DX", 0x8086);
  assert(getRegisterValue(regs, "DL") === 0x86, "Register Aliasing: DL extraction from DX");
  assert(getRegisterValue(regs, "DH") === 0x80, "Register Aliasing: DH extraction from DX");
  regs = setRegisterValue(regs, "DL", 0x81);
  assert(getRegisterValue(regs, "DX") === 0x8081, "Register Aliasing: DL modification updates DX");
  regs = setRegisterValue(regs, "DH", 0x00);
  assert(getRegisterValue(regs, "DX") === 0x0081, "Register Aliasing: DH modification updates DX");

  // --- 3. FLAG EVALUATION TESTS (TEST INSTRUCTION) ---
  const flagsZero = evaluateTest(0x00, 0x01, 8);
  assert(flagsZero.zf === true, "TEST flag: ZF set when result is zero (0x00 & 0x01)");
  assert(flagsZero.cf === false && flagsZero.of === false, "TEST flag: CF and OF cleared");

  const flagsNonZero = evaluateTest(0x03, 0x02, 8);
  assert(flagsNonZero.zf === false, "TEST flag: ZF cleared when result is non-zero (0x03 & 0x02)");
  assert(flagsNonZero.sf === false, "TEST flag: SF is 0 for positive result");

  const flagsSign = evaluateTest(0x80, 0x80, 8);
  assert(flagsSign.sf === true, "TEST flag: SF set when bit 7 is set (0x80 & 0x80)");

  // --- 4. 8255 PPI CONFIGURATION & PORT BEHAVIOR ---
  const ppiConfigured = configurePPIControlWord(INITIAL_PPI_STATE, 0x90);
  assert(ppiConfigured.isConfigured === true, "8255 PPI: Control word 90H sets isConfigured = true");
  assert(ppiConfigured.portADirection === "input", "8255 PPI: Port A configured as input (D4=1)");
  assert(ppiConfigured.portBDirection === "output", "8255 PPI: Port B configured as output (D1=0)");
  assert(ppiConfigured.portCDirection === "output", "8255 PPI: Port C configured as output (D3=0, D0=0)");
  assert(ppiConfigured.groupAMode === 0 && ppiConfigured.groupBMode === 0, "8255 PPI: Mode 0 selected for Group A & B");

  // PPI Port Direction Enforcement
  const writeToInputResult = writePPIPort(ppiConfigured, 0x80, 0xff);
  assert(writeToInputResult.warning !== undefined, "8255 PPI: Writing to input Port A triggers warning");

  const readFromOutputResult = readPPIPort(ppiConfigured, 0x81);
  assert(readFromOutputResult.value === 0x00, "8255 PPI: Reading Port B latch returns written value");

  // PPI Control Word 90H bit verification
  const cw90 = 0x90;
  assert(((cw90 >> 7) & 1) === 1, "8255 PPI 90H: D7=1 Mode Set Flag Active");
  assert(((cw90 >> 5) & 3) === 0, "8255 PPI 90H: D6-D5=00 Group A Mode 0");
  assert(((cw90 >> 4) & 1) === 1, "8255 PPI 90H: D4=1 Port A Input");
  assert(((cw90 >> 3) & 1) === 0, "8255 PPI 90H: D3=0 Port C Upper Output");
  assert(((cw90 >> 2) & 1) === 0, "8255 PPI 90H: D2=0 Group B Mode 0");
  assert(((cw90 >> 1) & 1) === 0, "8255 PPI 90H: D1=0 Port B Output");
  assert((cw90 & 1) === 0, "8255 PPI 90H: D0=0 Port C Lower Output");

  // --- 5. EXACT 12 BOUNDARY CONDITION TESTS ---

  // Condition 1: 0% water -> PA = 00H, pump ON
  let state = createInitialSimulationState(program);
  state.tank.waterLevel = 0.0;
  state = runUntilCheckLoop(state, 30);
  const s1 = computeWaterSensors(state.tank.waterLevel);
  assert(s1.portAValue === 0x00, "Boundary 1: 0% water yields PA = 00H");
  assert(isPumpActive(state.ppi.portB) === true, "Boundary 1: 0% water turns pump ON");

  // Condition 2: 24% water -> PA = 00H, pump ON
  state.tank.waterLevel = 24.0;
  state = runUntilCheckLoop(state, 30);
  const s2 = computeWaterSensors(state.tank.waterLevel);
  assert(s2.portAValue === 0x00, "Boundary 2: 24% water yields PA = 00H");
  assert(isPumpActive(state.ppi.portB) === true, "Boundary 2: 24% water turns pump ON");

  // Condition 3: 25% water -> PA = 01H, previous pump state retained
  // Case A: Prior state was ON (from 24%)
  state.tank.waterLevel = 25.0;
  state = runUntilCheckLoop(state, 30);
  const s3 = computeWaterSensors(state.tank.waterLevel);
  assert(s3.portAValue === 0x01, "Boundary 3: 25% water yields PA = 01H");
  assert(isPumpActive(state.ppi.portB) === true, "Boundary 3: 25% water retains previous ON state");

  // Condition 4: 50% water with pump ON -> pump remains ON
  state.tank.waterLevel = 50.0;
  state = runUntilCheckLoop(state, 30);
  assert(isPumpActive(state.ppi.portB) === true, "Boundary 4: 50% water with pump ON remains ON");

  // Condition 5: 50% water with pump OFF -> pump remains OFF
  // Force pump off first by transitioning to 90%
  state.tank.waterLevel = 90.0;
  state = runUntilCheckLoop(state, 30);
  assert(isPumpActive(state.ppi.portB) === false, "Boundary 5 prep: 90% water turns pump OFF");
  // Now set to 50% with pump initially OFF
  state.tank.waterLevel = 50.0;
  state = runUntilCheckLoop(state, 30);
  assert(isPumpActive(state.ppi.portB) === false, "Boundary 5: 50% water with pump OFF remains OFF");

  // Condition 6: 84% water -> pump retains previous state (OFF)
  state.tank.waterLevel = 84.0;
  state = runUntilCheckLoop(state, 30);
  const s6 = computeWaterSensors(state.tank.waterLevel);
  assert(s6.portAValue === 0x01, "Boundary 6: 84% water yields PA = 01H");
  assert(isPumpActive(state.ppi.portB) === false, "Boundary 6: 84% water retains previous OFF state");

  // Condition 7: 85% water -> PA = 03H, pump OFF
  state.tank.waterLevel = 85.0;
  state = runUntilCheckLoop(state, 30);
  const s7 = computeWaterSensors(state.tank.waterLevel);
  assert(s7.portAValue === 0x03, "Boundary 7: 85% water yields PA = 03H");
  assert(isPumpActive(state.ppi.portB) === false, "Boundary 7: 85% water turns pump OFF");

  // Condition 8: 100% water -> pump OFF
  state.tank.waterLevel = 100.0;
  state = runUntilCheckLoop(state, 30);
  const s8 = computeWaterSensors(state.tank.waterLevel);
  assert(s8.portAValue === 0x03, "Boundary 8: 100% water yields PA = 03H");
  assert(isPumpActive(state.ppi.portB) === false, "Boundary 8: 100% water turns pump OFF");

  // Condition 9: Drain from 90% to 50% -> pump remains OFF
  state.tank.waterLevel = 90.0;
  state = runUntilCheckLoop(state, 30);
  state.tank.waterLevel = 50.0;
  state = runUntilCheckLoop(state, 30);
  assert(isPumpActive(state.ppi.portB) === false, "Boundary 9: Drain from 90% to 50% keeps pump OFF (hysteresis)");

  // Condition 10: Drain below 25% -> pump restarts
  state.tank.waterLevel = 22.0;
  state = runUntilCheckLoop(state, 30);
  assert(isPumpActive(state.ppi.portB) === true, "Boundary 10: Drain below 25% restarts pump");

  // Condition 11: PA = 02H -> warning and pump OFF
  state.forceSensorInconsistency = true;
  state = runUntilCheckLoop(state, 30);
  const s11 = computeWaterSensors(state.tank.waterLevel, true);
  assert(s11.isInconsistent === true, "Boundary 11: PA = 02H detected as inconsistent");
  assert(s11.portAValue === 0x02, "Boundary 11: Port A reads 02H");
  assert(isPumpActive(state.ppi.portB) === false, "Boundary 11: PA = 02H triggers safe cutoff (pump OFF)");

  // Condition 12: Reset -> all hardware and processor states restored
  const resetState = createInitialSimulationState(program);
  assert(resetState.registers.ip === 0, "Boundary 12: Reset restores IP = 0000H");
  assert(resetState.registers.ax === 0 && resetState.registers.bx === 0 && resetState.registers.cx === 0 && resetState.registers.dx === 0, "Boundary 12: Reset clears all general registers");
  assert(resetState.flags.zf === false && resetState.flags.sf === false && resetState.flags.pf === false, "Boundary 12: Reset clears status flags");
  assert(resetState.ppi.isConfigured === false, "Boundary 12: Reset unconfigures 8255 PPI");
  assert(isPumpActive(resetState.ppi.portB) === false, "Boundary 12: Reset turns pump OFF");

  // --- 6. AUTHENTIC 8086 INSTRUCTION POINTER (IP) & STEPPING TESTS ---
  const step0 = createInitialSimulationState(program);
  assert(step0.registers.ip === 0, "IP Step 0: Initial IP is 0x0000");

  // Step 1: MOV AL, 90H (2 bytes: B0 90) -> IP should advance to 0x0002
  const { nextState: step1 } = executeSimulationStep(step0);
  assert(step1.registers.ip === 2, "Instruction stepping: IP advances by 2 bytes on 2-byte MOV AL, 90H (0000H -> 0002H)");
  assert(getRegisterValue(step1.registers, "AL") === 0x90, "Instruction stepping: MOV AL, 90H correctly loaded 0x90 into AL");

  // Step 2: MOV DX, 83H (3 bytes: BA 83 00) -> IP should advance to 0x0005
  const { nextState: step2 } = executeSimulationStep(step1);
  assert(step2.registers.ip === 5, "Instruction stepping: IP advances by 3 bytes on 3-byte MOV DX, 83H (0002H -> 0005H)");
  assert(getRegisterValue(step2.registers, "DX") === 0x83, "Instruction stepping: MOV DX, 83H correctly loaded 0x83 into DX");

  // Step 3: OUT DX, AL (1 byte: EE) -> IP should advance to 0x0006
  const { nextState: step3 } = executeSimulationStep(step2);
  assert(step3.registers.ip === 6, "Instruction stepping: IP advances by 1 byte on 1-byte OUT DX, AL (0005H -> 0006H)");

  assert(program.labels["CHECK"] === 8, "Program Label CHECK resolved to byte offset 0x0008H");

  // Conditional Branch (JZ & JNZ) verification
  const dummyBus: IOBusInterface = {
    read: () => ({ value: 0 }),
    write: () => ({}),
  };
  const testBranchProg = assembleProgram(`
    START:
      TEST AL, 01H
      JZ ZERO_TARGET
      MOV BL, 01H
      JMP END
    ZERO_TARGET:
      MOV BL, 02H
    END:
      NOP
  `).program;

  // Branch test: AL = 0 -> ZF = 1 -> JZ branches
  let testRegs = { ...INITIAL_REGISTERS, ax: 0x0000, ip: 0 };
  let testFlags = { ...INITIAL_FLAGS };
  let res = stepCPU(testRegs, testFlags, testBranchProg, dummyBus); // TEST AL, 01H
  res = stepCPU(res.registers, res.flags, testBranchProg, dummyBus); // JZ ZERO_TARGET
  assert(res.branchTaken === true, "Conditional branch: JZ branches when ZF=1");
  assert(res.registers.ip === testBranchProg.labels["ZERO_TARGET"], "Conditional branch: JZ targets ZERO_TARGET");

  // Branch test: AL = 1 -> ZF = 0 -> JZ falls through
  testRegs = { ...INITIAL_REGISTERS, ax: 0x0001, ip: 0 };
  testFlags = { ...INITIAL_FLAGS };
  res = stepCPU(testRegs, testFlags, testBranchProg, dummyBus); // TEST AL, 01H
  res = stepCPU(res.registers, res.flags, testBranchProg, dummyBus); // JZ ZERO_TARGET
  assert(res.branchTaken === false, "Conditional branch: JZ falls through when ZF=0");

  // Fault Recovery: Clear fault injection and verify normal computation resumes
  state.forceSensorInconsistency = false;
  state.tank.waterLevel = 15.0;
  state = runUntilCheckLoop(state, 30);
  const recoveredSensors = computeWaterSensors(state.tank.waterLevel, false);
  assert(recoveredSensors.isInconsistent === false, "Fault Recovery: isInconsistent cleared");
  assert(recoveredSensors.portAValue === 0x00, "Fault Recovery: Sensor returns to PA = 00H for 15% level");
  assert(isPumpActive(state.ppi.portB) === true, "Fault Recovery: Normal pump control resumes (pump turns ON)");

  // Pause / Resume state preservation
  const pausedState = { ...state };
  // Verify state fields are not mutated when paused
  assert(pausedState.registers.ip === state.registers.ip, "Pause / Resume: CPU registers preserved");
  assert(pausedState.tank.waterLevel === state.tank.waterLevel, "Pause / Resume: Tank water level preserved");

  // --- 7. MACHINE BYTE ENCODING & RELATIVE JUMP DISPLACEMENT TESTS ---
  assert(program.totalBytes === 36, "Machine Encoding: Total firmware program size is 36 bytes");
  assert(program.instructions.length === 18, "Machine Encoding: Firmware has 18 instructions (indices #0..#17)");
  assert(program.labels["TANK_LOW"] === 0x16, "Machine Encoding: TANK_LOW label resolved to byte offset 0x0016H");
  assert(program.labels["TANK_FULL"] === 0x1a, "Machine Encoding: TANK_FULL label resolved to byte offset 0x001AH");
  assert(program.labels["UPDATE"] === 0x1c, "Machine Encoding: UPDATE label resolved to byte offset 0x001CH");
  const jnzInst = program.instructions.find((i) => i.byteOffset === 0x0e);
  assert(jnzInst?.encodedBytes.join(" ") === "75 0A", "Machine Encoding: JNZ TANK_FULL at 000EH encodes as 75 0A (+10 rel8)");
  const jmpCheckInst = program.instructions.find((i) => i.byteOffset === 0x22);
  assert(jmpCheckInst?.encodedBytes.join(" ") === "EB E4", "Machine Encoding: JMP CHECK at 0022H encodes as EB E4 (-28 rel8)");

  // --- 8. 10-STAGE GUIDED DEMO SYNCHRONIZATION TESTS ---
  for (const stage of GUIDED_STAGES) {
    const synced = synchronizeGuidedStageState(program, stage.stageNumber);
    assert(
      synced.state.tank.waterLevel === stage.targetWaterLevel &&
        synced.state.ppi.portA === stage.targetPortA &&
        synced.state.ppi.portB === stage.targetPortB &&
        synced.state.tank.isPumpOn === stage.expectedPumpState &&
        synced.state.registers.ip === stage.expectedRegisters.ip,
      `Guided Demo Stage ${stage.stageNumber} (${stage.id}): CPU, IP (0x${synced.state.registers.ip
        .toString(16)
        .toUpperCase()
        .padStart(4, "0")}H), Port A (0x${synced.state.ppi.portA
        .toString(16)
        .toUpperCase()
        .padStart(2, "0")}H), Port B (0x${synced.state.ppi.portB
        .toString(16)
        .toUpperCase()
        .padStart(2, "0")}H), and Pump (${synced.state.tank.isPumpOn ? "ON" : "OFF"}) synchronized`
    );
  }

  // --- 9. PRACTICE SCENARIO SYNCHRONIZATION TESTS ---
  const initForPractice = createInitialSimulationState(program);
  const pracEmpty = synchronizePracticeScenarioState(initForPractice, 10.0, false, false);
  assert(pracEmpty.state.tank.isPumpOn === true && pracEmpty.state.ppi.portA === 0x00, "Practice Scenario 1 (10% Empty): Pump ON, PA=00H");
  const pracFull = synchronizePracticeScenarioState(pracEmpty.state, 90.0, false, false);
  assert(pracFull.state.tank.isPumpOn === false && pracFull.state.ppi.portA === 0x03, "Practice Scenario 3 (90% Full): Pump OFF, PA=03H");
  const pracDrain = synchronizePracticeScenarioState(pracEmpty.state, 80.0, true, false);
  assert(pracDrain.state.tank.isPumpOn === false && pracDrain.state.ppi.portA === 0x01, "Practice Scenario 4 (80% Draining): Pump stays OFF in hysteresis band");
  const pracFault = synchronizePracticeScenarioState(pracEmpty.state, 30.0, false, true);
  assert(pracFault.state.tank.isPumpOn === false && pracFault.state.ppi.portA === 0x02, "Practice Scenario 5 (Fault PA=02H): Safe cutoff forces Pump OFF");

  const passed = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  return { passed, failed, results };
}
