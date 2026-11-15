"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  SimulationTelemetry,
  ExecutionStatus,
  ExecutionLogEntry,
  AssemblyProgram,
} from "../types/simulation";
import { assembleProgram, DEFAULT_ASSEMBLY_CODE } from "../engine/assembler";
import {
  IntegratedState,
  createInitialSimulationState,
  executeSimulationStep,
  executePhysicsTick,
  synchronizeGuidedStageState,
  synchronizePracticeScenarioState,
} from "../engine/execution";
import { computeWaterSensors } from "../hardware/water-sensors";
import { updatePPIPortAInputs } from "../hardware/ppi8255";

export function useSimulation() {
  const [program] = useState<AssemblyProgram>(() => {
    const res = assembleProgram(DEFAULT_ASSEMBLY_CODE);
    return res.program;
  });

  const [state, setState] = useState<IntegratedState>(() =>
    createInitialSimulationState(program)
  );
  const [status, setStatus] = useState<ExecutionStatus>("PAUSED");
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1.0);
  const [logs, setLogs] = useState<ExecutionLogEntry[]>([]);
  const [busActivity, setBusActivity] = useState<SimulationTelemetry["busActivity"]>({
    active: false,
    busType: "IDLE",
    portAddress: 0,
    dataByte: 0,
  });

  // Animation and physics refs synced in effect
  const stateRef = useRef(state);
  const statusRef = useRef(status);
  const speedRef = useRef(speedMultiplier);

  useEffect(() => {
    stateRef.current = state;
    statusRef.current = status;
    speedRef.current = speedMultiplier;
  });

  const lastTimeRef = useRef<number>(0);
  const cpuStepAccumulatorRef = useRef<number>(0);

  // Single discrete step callback
  const step = useCallback(() => {
    setState((curr) => {
      const { nextState, telemetry } = executeSimulationStep(curr);

      if (telemetry.logs && telemetry.logs.length > 0) {
        setLogs((prevLogs) => [...telemetry.logs!, ...prevLogs.slice(0, 79)]);
      }

      if (telemetry.busActivity) {
        setBusActivity(telemetry.busActivity);
      }

      return nextState;
    });
  }, []);

  // Run / Pause / Reset handlers
  const start = useCallback(() => {
    setStatus("RUNNING");
  }, []);

  const pause = useCallback(() => {
    setStatus("PAUSED");
  }, []);

  const togglePlay = useCallback(() => {
    setStatus((prev) => (prev === "RUNNING" ? "PAUSED" : "RUNNING"));
  }, []);

  const reset = useCallback(() => {
    setStatus("PAUSED");
    const fresh = createInitialSimulationState(program);
    setState(fresh);
    setLogs([
      {
        id: `reset-${Date.now()}`,
        stepNumber: 0,
        ip: 0,
        mnemonic: "RESET",
        operands: [],
        description: "Processor and Virtual Hardware reset to initial state (IP=0000H, Port A=00H, Port B=00H)",
        timestamp: Date.now(),
        type: "INFO",
      },
    ]);
    setBusActivity({
      active: false,
      busType: "IDLE",
      portAddress: 0,
      dataByte: 0,
    });
  }, [program]);

  // Manual water level adjustment
  const setWaterLevel = useCallback((level: number) => {
    setState((curr) => {
      const clamped = Math.max(0, Math.min(100, Number(level.toFixed(1))));
      const nextSensors = computeWaterSensors(clamped, curr.forceSensorInconsistency);
      const nextPPI = updatePPIPortAInputs(curr.ppi, nextSensors.portAValue);
      return {
        ...curr,
        sensors: nextSensors,
        ppi: nextPPI,
        tank: {
          ...curr.tank,
          waterLevel: clamped,
        },
      };
    });
  }, []);

  // Drain water toggle
  const toggleDrain = useCallback(() => {
    setState((curr) => ({
      ...curr,
      tank: {
        ...curr.tank,
        isDraining: !curr.tank.isDraining,
      },
    }));
  }, []);

  const setDraining = useCallback((isDraining: boolean) => {
    setState((curr) => ({
      ...curr,
      tank: {
        ...curr.tank,
        isDraining,
      },
    }));
  }, []);

  // Inconsistent sensor fault injection toggle (PA = 0x02)
  const setForceSensorInconsistency = useCallback((force: boolean) => {
    setState((curr) => {
      const nextSensors = computeWaterSensors(curr.tank.waterLevel, force);
      const nextPPI = updatePPIPortAInputs(curr.ppi, nextSensors.portAValue);
      return {
        ...curr,
        forceSensorInconsistency: force,
        sensors: nextSensors,
        ppi: nextPPI,
      };
    });
  }, []);

  // Synchronize engine to a specific Guided Demo Stage (1..10)
  const syncToGuidedStage = useCallback(
    (stageNumber: number) => {
      setStatus("PAUSED");
      const result = synchronizeGuidedStageState(program, stageNumber);
      setState(result.state);
      setBusActivity(result.busActivity);
      setLogs(result.logs);
    },
    [program]
  );

  // Synchronize engine to an interactive Practice Scenario
  const applyPracticeScenario = useCallback(
    (waterLevel: number, isDraining: boolean, injectFault: boolean) => {
      setStatus("PAUSED");
      setState((curr) => {
        const result = synchronizePracticeScenarioState(
          curr,
          waterLevel,
          isDraining,
          injectFault
        );
        setBusActivity(result.busActivity);
        setLogs((prev) => [...result.logs, ...prev].slice(0, 80));
        return result.state;
      });
    },
    []
  );

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  // Integrated Animation & Physics Loop (Runs via requestAnimationFrame)
  useEffect(() => {
    let animId: number;

    const loop = (timestamp: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = timestamp;
      }
      const rawDelta = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      // Clamp delta time to avoid large physics leaps on tab change
      const dt = Math.min(rawDelta, 0.1);

      const isRunning = statusRef.current === "RUNNING";
      const speed = speedRef.current;

      // 1. Advance water tank fluid dynamics
      setState((curr) => executePhysicsTick(curr, dt * speed));

      // 2. Advance CPU instruction clock cycle when running
      if (isRunning) {
        // Base CPU speed: ~5 instructions per second at 1x
        const instructionsPerSec = 4.0 * speed;
        cpuStepAccumulatorRef.current += dt * instructionsPerSec;

        if (cpuStepAccumulatorRef.current >= 1.0) {
          const stepsToExecute = Math.min(Math.floor(cpuStepAccumulatorRef.current), 5);
          cpuStepAccumulatorRef.current -= stepsToExecute;

          for (let i = 0; i < stepsToExecute; i++) {
            step();
          }
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [step]);

  // Active instruction helper matching authentic byte offset IP
  const activeInstruction =
    program.instructions.find((inst) => inst.byteOffset === state.registers.ip) ??
    (state.registers.ip >= 0 && state.registers.ip < program.instructions.length
      ? program.instructions[state.registers.ip]
      : undefined);

  return {
    state,
    status,
    speedMultiplier,
    program,
    activeInstruction,
    logs,
    busActivity,
    // Actions
    step,
    start,
    pause,
    togglePlay,
    reset,
    setWaterLevel,
    toggleDrain,
    setDraining,
    setSpeedMultiplier,
    setForceSensorInconsistency,
    syncToGuidedStage,
    applyPracticeScenario,
    clearLogs,
  };
}
