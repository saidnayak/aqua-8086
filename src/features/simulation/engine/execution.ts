/**
 * Simulation Pipeline Execution Coordinator
 * Glues CPU execution cycles, 8255 PPI bus interactions, water sensors,
 * and fluid mechanics into a deterministic, pure state transition pipeline.
 */

import {
  SimulationTelemetry,
  AssemblyProgram,
  CPURegisters,
  CPUFlags,
  PPI8255State,
  WaterSensorsState,
  WaterTankState,
} from "../types/simulation";
import { INITIAL_REGISTERS } from "./memory";
import { INITIAL_FLAGS } from "./flags";
import { stepCPU, IOBusInterface } from "./cpu8086";
import {
  INITIAL_PPI_STATE,
  readPPIPort,
  writePPIPort,
  updatePPIPortAInputs,
} from "../hardware/ppi8255";
import {
  computeWaterSensors,
} from "../hardware/water-sensors";
import {
  INITIAL_TANK_STATE,
  updateWaterTankPhysics,
} from "../hardware/water-tank";
import { isPumpActive } from "../hardware/pump-controller";

export interface IntegratedState {
  registers: CPURegisters;
  flags: CPUFlags;
  ppi: PPI8255State;
  sensors: WaterSensorsState;
  tank: WaterTankState;
  program: AssemblyProgram;
  stepCount: number;
  forceSensorInconsistency: boolean;
}

export function createInitialSimulationState(program: AssemblyProgram): IntegratedState {
  const initialSensors = computeWaterSensors(INITIAL_TANK_STATE.waterLevel, false);
  const initialPPI = updatePPIPortAInputs(INITIAL_PPI_STATE, initialSensors.portAValue);

  return {
    registers: { ...INITIAL_REGISTERS },
    flags: { ...INITIAL_FLAGS },
    ppi: initialPPI,
    sensors: initialSensors,
    tank: { ...INITIAL_TANK_STATE },
    program,
    stepCount: 0,
    forceSensorInconsistency: false,
  };
}

/**
 * Executes a single discrete instruction step in the simulation.
 */
export function executeSimulationStep(state: IntegratedState): {
  nextState: IntegratedState;
  telemetry: Partial<SimulationTelemetry>;
} {
  // 1. Ensure sensors and PPI Port A reflect current water level
  const sensors = computeWaterSensors(state.tank.waterLevel, state.forceSensorInconsistency);
  let currentPPI = updatePPIPortAInputs(state.ppi, sensors.portAValue);

  // 3. Prepare IOBus interface wired to the virtual 8255 PPI
  let busActivityLog: SimulationTelemetry["busActivity"] = {
    active: false,
    busType: "IDLE",
    portAddress: 0,
    dataByte: 0,
  };

  const ioBus: IOBusInterface = {
    read: (port) => {
      const result = readPPIPort(currentPPI, port);
      busActivityLog = {
        active: true,
        busType: "IN_READ",
        portAddress: port,
        dataByte: result.value,
      };
      return result;
    },
    write: (port, value) => {
      const result = writePPIPort(currentPPI, port, value);
      currentPPI = result.nextState;
      busActivityLog = {
        active: true,
        busType: "OUT_WRITE",
        portAddress: port,
        dataByte: value,
      };
      return result;
    },
  };

  // 4. Step the 8086 CPU
  const stepNumber = state.stepCount + 1;
  const cpuResult = stepCPU(state.registers, state.flags, state.program, ioBus, stepNumber);

  // 5. Check if Port B PB0 pump state changed after CPU step
  const updatedPumpIsOn = isPumpActive(currentPPI.portB);
  const updatedTank: WaterTankState = {
    ...state.tank,
    isPumpOn: updatedPumpIsOn,
    systemCondition: sensors.isInconsistent
      ? "INCONSISTENCY_WARNING"
      : updatedPumpIsOn
      ? "FILLING"
      : state.tank.isDraining
      ? "DRAINING"
      : "STANDBY",
  };

  const nextState: IntegratedState = {
    registers: cpuResult.registers,
    flags: cpuResult.flags,
    ppi: currentPPI,
    sensors,
    tank: updatedTank,
    program: state.program,
    stepCount: stepNumber,
    forceSensorInconsistency: state.forceSensorInconsistency,
  };

  return {
    nextState,
    telemetry: {
      activeInstruction: cpuResult.instructionExecuted,
      busActivity: busActivityLog,
      logs: cpuResult.log ? [cpuResult.log] : [],
    },
  };
}

/**
 * Updates simulation physics over elapsed time (delta seconds).
 */
export function executePhysicsTick(
  state: IntegratedState,
  deltaTimeSec: number
): IntegratedState {
  const pumpIsOn = isPumpActive(state.ppi.portB);
  const nextTank = updateWaterTankPhysics(
    state.tank,
    pumpIsOn,
    deltaTimeSec,
    state.sensors.isInconsistent
  );

  const nextSensors = computeWaterSensors(nextTank.waterLevel, state.forceSensorInconsistency);
  const nextPPI = updatePPIPortAInputs(state.ppi, nextSensors.portAValue);

  return {
    ...state,
    tank: nextTank,
    sensors: nextSensors,
    ppi: nextPPI,
  };
}

/**
 * Synchronizes the simulation engine to a specific Guided Demo stage (1..10)
 * by executing authentic 8086 instructions from initial reset state.
 */
export function synchronizeGuidedStageState(
  program: AssemblyProgram,
  stageNumber: number
): {
  state: IntegratedState;
  busActivity: SimulationTelemetry["busActivity"];
  logs: SimulationTelemetry["logs"];
} {
  let curr = createInitialSimulationState(program);
  let lastBusActivity: SimulationTelemetry["busActivity"] = {
    active: false,
    busType: "IDLE",
    portAddress: 0,
    dataByte: 0,
  };
  const collectedLogs: SimulationTelemetry["logs"] = [];

  const setLevel = (level: number, isDraining: boolean = false) => {
    const sensors = computeWaterSensors(level, false);
    const ppi = updatePPIPortAInputs(curr.ppi, sensors.portAValue);
    curr = {
      ...curr,
      sensors,
      ppi,
      tank: {
        ...curr.tank,
        waterLevel: level,
        isDraining,
      },
    };
  };

  const stepN = (count: number) => {
    for (let i = 0; i < count; i++) {
      const { nextState, telemetry } = executeSimulationStep(curr);
      curr = nextState;
      if (telemetry.busActivity) {
        lastBusActivity = telemetry.busActivity;
      }
      if (telemetry.logs && telemetry.logs.length > 0) {
        collectedLogs.unshift(...telemetry.logs);
      }
    }
  };

  // Stage 1: 15% water, execute MOV AL, 90H; MOV DX, 83H; OUT DX, AL (3 instructions -> IP=0x0006H)
  setLevel(15.0, false);
  if (stageNumber >= 1) stepN(3);

  // Stage 2: execute MOV BL, 00H; CHECK: MOV DX, 80H (2 instructions -> IP=0x000BH)
  if (stageNumber >= 2) stepN(2);

  // Stage 3: execute IN AL, DX (1 instruction -> IP=0x000CH)
  if (stageNumber >= 3) stepN(1);

  // Stage 4: execute TEST AL, 02H; JNZ TANK_FULL (2 instructions -> IP=0x0010H)
  if (stageNumber >= 4) stepN(2);

  // Stage 5: execute TEST AL, 01H; JZ TANK_LOW; MOV BL, 01H; JMP UPDATE (4 instructions -> IP=0x001CH)
  if (stageNumber >= 5) stepN(4);

  // Stage 6: execute MOV DX, 81H; MOV AL, BL; OUT DX, AL (3 instructions -> IP=0x0022H, Pump ON)
  if (stageNumber >= 6) stepN(3);

  // Stage 7: Water rises to 35%, execute JMP CHECK; MOV DX, 80H; IN AL, DX (3 instructions -> IP=0x000CH)
  if (stageNumber >= 7) {
    setLevel(35.0, false);
    stepN(3);
  }

  // Stage 8: Water reaches 50% (Hysteresis), execute through OUT DX, AL (8 instructions -> IP=0x0022H, Pump stays ON)
  if (stageNumber >= 8) {
    setLevel(50.0, false);
    stepN(8);
  }

  // Stage 9: Water reaches 90% (Full Tank), execute full cutoff path through OUT DX, AL (9 instructions -> IP=0x0022H, Pump OFF)
  if (stageNumber >= 9) {
    setLevel(90.0, false);
    stepN(9);
  }

  // Stage 10: Water drains to 20%, execute full refill cycle back to CHECK (13 instructions -> IP=0x0008H, Pump restarts ON)
  if (stageNumber >= 10) {
    setLevel(20.0, true);
    stepN(13);
  }

  return {
    state: curr,
    busActivity: lastBusActivity,
    logs: collectedLogs.slice(0, 80),
  };
}

/**
 * Synchronizes the simulation engine when applying an interactive Practice Scenario
 * by running one complete 8086 polling loop at the scenario's target conditions.
 */
export function synchronizePracticeScenarioState(
  currState: IntegratedState,
  waterLevel: number,
  isDraining: boolean,
  injectFault: boolean
): {
  state: IntegratedState;
  busActivity: SimulationTelemetry["busActivity"];
  logs: SimulationTelemetry["logs"];
} {
  let curr = { ...currState };
  const collectedLogs: SimulationTelemetry["logs"] = [];
  let lastBusActivity: SimulationTelemetry["busActivity"] = {
    active: false,
    busType: "IDLE",
    portAddress: 0,
    dataByte: 0,
  };

  const runLoopToCheck = () => {
    const checkOffset = curr.program.labels["CHECK"] ?? 8;
    let enteredCheck = curr.registers.ip === checkOffset;
    for (let i = 0; i < 25; i++) {
      const { nextState, telemetry } = executeSimulationStep(curr);
      curr = nextState;
      if (telemetry.busActivity) {
        lastBusActivity = telemetry.busActivity;
      }
      if (telemetry.logs && telemetry.logs.length > 0) {
        collectedLogs.unshift(...telemetry.logs);
      }
      if (curr.registers.ip === checkOffset) {
        if (!enteredCheck) {
          enteredCheck = true;
        } else {
          break;
        }
      }
    }
  };

  // For autonomous drain scenario (80% draining), ensure pump starts in OFF state from full cutoff
  if (isDraining && waterLevel >= 25 && waterLevel < 85 && !injectFault) {
    curr.forceSensorInconsistency = false;
    curr.tank = { ...curr.tank, waterLevel: 90.0, isDraining: false };
    runLoopToCheck();
  }

  const clampedLevel = Math.max(0, Math.min(100, Number(waterLevel.toFixed(1))));
  const sensors = computeWaterSensors(clampedLevel, injectFault);
  const ppi = updatePPIPortAInputs(curr.ppi, sensors.portAValue);

  curr = {
    ...curr,
    forceSensorInconsistency: injectFault,
    sensors,
    ppi,
    tank: {
      ...curr.tank,
      waterLevel: clampedLevel,
      isDraining,
    },
  };

  runLoopToCheck();

  return {
    state: curr,
    busActivity: lastBusActivity,
    logs: collectedLogs.slice(0, 80),
  };
}
