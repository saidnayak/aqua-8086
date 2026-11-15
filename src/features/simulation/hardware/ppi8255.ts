/**
 * Virtual Intel 8255 Programmable Peripheral Interface (PPI)
 * Implements Mode 0 parallel I/O with port direction validation, latches,
 * and virtual I/O mapping:
 * - Port A: 80H (Sensor input)
 * - Port B: 81H (Pump-control output)
 * - Port C: 82H (General-purpose output)
 * - Control Register: 83H
 */

import { PPI8255State } from "../types/simulation";

export const PPI_PORTS = {
  PORT_A: 0x80,
  PORT_B: 0x81,
  PORT_C: 0x82,
  CONTROL_REG: 0x83,
} as const;

export const INITIAL_PPI_STATE: Readonly<PPI8255State> = {
  controlWord: 0x00,
  isConfigured: false,
  portA: 0x00,
  portB: 0x00,
  portC: 0x00,
  portADirection: "input",
  portBDirection: "output",
  portCDirection: "output",
  groupAMode: 0,
  groupBMode: 0,
};

export interface PPIWriteResult {
  nextState: PPI8255State;
  warning?: string;
  isPumpTriggered?: boolean;
}

export interface PPIReadResult {
  value: number;
  warning?: string;
}

/**
 * Decodes the 8255 Control Word (e.g. 90H = 10010000B)
 * Bit 7: 1 = Mode Definition Active
 * Bit 6,5: Group A Mode (00 = Mode 0)
 * Bit 4: Port A (1 = Input, 0 = Output)
 * Bit 3: Port C Upper (1 = Input, 0 = Output)
 * Bit 2: Group B Mode (0 = Mode 0)
 * Bit 1: Port B (1 = Input, 0 = Output)
 * Bit 0: Port C Lower (1 = Input, 0 = Output)
 */
export function configurePPIControlWord(
  currentState: PPI8255State,
  controlWord: number
): PPI8255State {
  const byte = controlWord & 0xff;

  // Bit 7 must be 1 for Mode Set
  if ((byte & 0x80) === 0) {
    // Bit Set/Reset format (Mode 0 port C bit manipulation, not used in base setup)
    return currentState;
  }

  const groupAMode = (byte >> 5) & 0x03; // Bits 6,5
  const portAInput = (byte & 0x10) !== 0; // Bit 4
  const portCUpperInput = (byte & 0x08) !== 0; // Bit 3
  const groupBMode = (byte & 0x04) !== 0 ? 1 : 0; // Bit 2
  const portBInput = (byte & 0x02) !== 0; // Bit 1
  const portCLowerInput = (byte & 0x01) !== 0; // Bit 0

  return {
    ...currentState,
    controlWord: byte,
    isConfigured: true,
    groupAMode,
    groupBMode,
    portADirection: portAInput ? "input" : "output",
    portBDirection: portBInput ? "input" : "output",
    portCDirection: portCUpperInput || portCLowerInput ? "input" : "output",
    lastWrittenPort: PPI_PORTS.CONTROL_REG,
  };
}

/**
 * Handles an OUT instruction from the CPU to an I/O port.
 */
export function writePPIPort(
  currentState: PPI8255State,
  portAddress: number,
  value: number
): PPIWriteResult {
  const byte = value & 0xff;
  const port = portAddress & 0xff;

  if (port === PPI_PORTS.CONTROL_REG) {
    const nextState = configurePPIControlWord(currentState, byte);
    return { nextState };
  }

  if (port === PPI_PORTS.PORT_B) {
    if (!currentState.isConfigured) {
      return {
        nextState: { ...currentState, portB: byte, lastWrittenPort: port },
        warning: "Warning: Writing to Port B before 8255 PPI configuration (Control Word 90H)",
      };
    }
    if (currentState.portBDirection !== "output") {
      return {
        nextState: currentState,
        warning: `Error: Cannot write to Port B configured as ${currentState.portBDirection}`,
      };
    }
    return {
      nextState: {
        ...currentState,
        portB: byte,
        lastWrittenPort: port,
      },
      isPumpTriggered: (byte & 0x01) === 1,
    };
  }

  if (port === PPI_PORTS.PORT_A) {
    if (currentState.portADirection === "input") {
      return {
        nextState: currentState,
        warning: "Error: Cannot write to Port A configured as input port",
      };
    }
    return {
      nextState: { ...currentState, portA: byte, lastWrittenPort: port },
    };
  }

  if (port === PPI_PORTS.PORT_C) {
    return {
      nextState: { ...currentState, portC: byte, lastWrittenPort: port },
    };
  }

  return {
    nextState: currentState,
    warning: `Ignored OUT to unmapped port address: ${port.toString(16).toUpperCase()}H`,
  };
}

/**
 * Handles an IN instruction from the CPU from an I/O port.
 */
export function readPPIPort(currentState: PPI8255State, portAddress: number): PPIReadResult {
  const port = portAddress & 0xff;

  if (port === PPI_PORTS.PORT_A) {
    if (currentState.portADirection !== "input") {
      return {
        value: currentState.portA,
        warning: "Warning: Reading from Port A configured as output",
      };
    }
    return { value: currentState.portA & 0xff };
  }

  if (port === PPI_PORTS.PORT_B) {
    return { value: currentState.portB & 0xff };
  }

  if (port === PPI_PORTS.PORT_C) {
    return { value: currentState.portC & 0xff };
  }

  if (port === PPI_PORTS.CONTROL_REG) {
    return { value: currentState.controlWord & 0xff };
  }

  return {
    value: 0x00,
    warning: `Reading from unmapped port address: ${port.toString(16).toUpperCase()}H`,
  };
}

/**
 * Updates the physical inputs presented to Port A (sensors).
 */
export function updatePPIPortAInputs(currentState: PPI8255State, sensorByte: number): PPI8255State {
  return {
    ...currentState,
    portA: sensorByte & 0xff,
  };
}

