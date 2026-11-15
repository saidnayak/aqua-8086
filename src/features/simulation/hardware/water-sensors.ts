/**
 * Water Sensor Logic for AQUA8086
 * Computes digital logic levels for Low-level (PA0) and High-level (PA1) sensors
 * based on simulated tank fluid level.
 */

import { WaterSensorsState } from "../types/simulation";

export const SENSOR_THRESHOLDS = {
  LOW_LEVEL_PERCENT: 25.0,
  HIGH_LEVEL_PERCENT: 85.0,
} as const;

export const INITIAL_SENSORS_STATE: Readonly<WaterSensorsState> = {
  lowSensor: false,
  highSensor: false,
  portAValue: 0x00,
  isInconsistent: false,
};

/**
 * Computes sensor digital readings from water level percentage (0 to 100).
 *
 * PA0 (Low sensor):
 * - 1 when water >= 25%
 * - 0 when water < 25%
 *
 * PA1 (High sensor):
 * - 1 when water >= 85%
 * - 0 when water < 85%
 *
 * @param waterLevel Water level percentage (0 - 100)
 * @param forceInconsistent Optional override for testing fault injection (PA=0x02)
 */
export function computeWaterSensors(
  waterLevel: number,
  forceInconsistent: boolean = false
): WaterSensorsState {
  if (forceInconsistent) {
    return {
      lowSensor: false,
      highSensor: true,
      portAValue: 0x02, // PA1=1, PA0=0
      isInconsistent: true,
      faultMessage: "FAULT: Inconsistent sensor pattern detected (PA=02H). High sensor submerged while low sensor dry.",
    };
  }

  const lowSensor = waterLevel >= SENSOR_THRESHOLDS.LOW_LEVEL_PERCENT;
  const highSensor = waterLevel >= SENSOR_THRESHOLDS.HIGH_LEVEL_PERCENT;

  // Inverted scenario detection
  const isInconsistent = !lowSensor && highSensor;
  const bit0 = lowSensor ? 1 : 0;
  const bit1 = highSensor ? 1 : 0;
  const portAValue = (bit1 << 1) | bit0;

  return {
    lowSensor,
    highSensor,
    portAValue,
    isInconsistent,
    faultMessage: isInconsistent
      ? "FAULT: Inconsistent sensor state (PA=02H). High sensor active while low sensor inactive."
      : undefined,
  };
}

