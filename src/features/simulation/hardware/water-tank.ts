/**
 * Water Tank Dynamic Physics Simulation
 * Updates the simulated fluid volume over time (independent of render frame rate).
 */

import { WaterTankState, SystemCondition } from "../types/simulation";

export const INITIAL_TANK_STATE: Readonly<WaterTankState> = {
  waterLevel: 10.0, // Initial level low to trigger pump upon execution
  isPumpOn: false,
  isDraining: false,
  fillRatePerSec: 7.5, // Fills ~7.5% per second when pump is active
  drainRatePerSec: 4.0, // Drains ~4% per second when draining is active
  systemCondition: "STANDBY",
};

/**
 * Updates the water level according to pump output state and draining user action over delta time.
 *
 * @param current Current tank state
 * @param isPumpOn Effective pump state driven by 8255 PB0
 * @param deltaTimeSec Elapsed time in seconds
 * @param isInconsistentSensor Sensor fault status
 */
export function updateWaterTankPhysics(
  current: WaterTankState,
  isPumpOn: boolean,
  deltaTimeSec: number,
  isInconsistentSensor: boolean = false
): WaterTankState {
  if (deltaTimeSec <= 0) return current;

  // Calculate net flow rate
  const fillDelta = isPumpOn ? current.fillRatePerSec * deltaTimeSec : 0;
  const drainDelta = current.isDraining ? current.drainRatePerSec * deltaTimeSec : 0;

  const netDelta = fillDelta - drainDelta;
  const newLevel = Math.max(0, Math.min(100, current.waterLevel + netDelta));

  // Determine system condition
  let systemCondition: SystemCondition = "STANDBY";
  if (isInconsistentSensor) {
    systemCondition = "INCONSISTENCY_WARNING";
  } else if (isPumpOn && netDelta > 0) {
    systemCondition = "FILLING";
  } else if (current.isDraining && netDelta < 0) {
    systemCondition = "DRAINING";
  } else if (isPumpOn && current.isDraining) {
    systemCondition = "FILLING";
  }

  return {
    ...current,
    waterLevel: Number(newLevel.toFixed(2)),
    isPumpOn,
    systemCondition,
  };
}

