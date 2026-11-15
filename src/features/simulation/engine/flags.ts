/**
 * 8086 CPU Flag Register Calculations
 * Pure functions for setting and querying ZF, SF, PF, CF, and OF flags.
 */

import { CPUFlags } from "../types/simulation";

export const INITIAL_FLAGS: Readonly<CPUFlags> = {
  zf: false,
  sf: false,
  pf: false,
  cf: false,
  of: false,
};

/**
 * Calculates whether the lowest 8 bits of a number have an even number of set bits (Parity Flag).
 */
export function calculateParity(val: number): boolean {
  const byte = val & 0xff;
  let count = 0;
  for (let i = 0; i < 8; i++) {
    if ((byte & (1 << i)) !== 0) {
      count++;
    }
  }
  return count % 2 === 0;
}

/**
 * Evaluates the 8086 TEST instruction.
 * TEST performs a bitwise AND between two values without storing the result.
 * It updates ZF, SF, and PF based on the result, and unconditionally clears CF and OF.
 *
 * @param val1 Destination operand value
 * @param val2 Source operand value
 * @param bits Width (8 or 16 bits)
 * @param currentFlags Existing flag register
 */
export function evaluateTest(
  val1: number,
  val2: number,
  bits: 8 | 16 = 8,
  currentFlags: CPUFlags = INITIAL_FLAGS
): CPUFlags {
  const mask = bits === 16 ? 0xffff : 0xff;
  const signBit = bits === 16 ? 0x8000 : 0x80;
  const result = (val1 & val2) & mask;

  return {
    ...currentFlags,
    zf: result === 0,
    sf: (result & signBit) !== 0,
    pf: calculateParity(result),
    cf: false, // TEST always clears CF
    of: false, // TEST always clears OF
  };
}

