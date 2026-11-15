/**
 * Virtual Intel 8086 CPU Execution Engine
 * Instruction-level educational simulation executing:
 * MOV, IN, OUT, TEST, JZ, JNZ, JMP, NOP.
 * Accurately tracks genuine 8086 instruction byte offsets and encoded lengths.
 */

import {
  CPURegisters,
  CPUFlags,
  ParsedInstruction,
  AssemblyProgram,
  ExecutionLogEntry,
} from "../types/simulation";
import { getRegisterValue, setRegisterValue, is8BitRegister } from "./memory";
import { evaluateTest } from "./flags";
import { parseNumericLiteral } from "./instruction-set";

export interface IOBusInterface {
  read(port: number): { value: number; warning?: string };
  write(port: number, value: number): { warning?: string; isPumpTriggered?: boolean };
}

export interface CPUStepResult {
  registers: CPURegisters;
  flags: CPUFlags;
  instructionExecuted?: ParsedInstruction;
  log?: ExecutionLogEntry;
  branchTaken?: boolean;
  busActivity?: {
    active: boolean;
    busType: "IN_READ" | "OUT_WRITE";
    portAddress: number;
    dataByte: number;
  };
  isHalted: boolean;
  error?: string;
}

/**
 * Resolves an operand token to its numeric value.
 * Token may be a register name (e.g., 'AL', 'DX') or numeric literal (e.g., '90H', '02H').
 */
function resolveOperandValue(regs: CPURegisters, token: string): number {
  const num = parseNumericLiteral(token);
  if (num !== null) {
    return num;
  }
  return getRegisterValue(regs, token);
}

/**
 * Executes a single 8086 instruction from the program at the current byte offset IP.
 */
export function stepCPU(
  registers: CPURegisters,
  flags: CPUFlags,
  program: AssemblyProgram,
  ioBus: IOBusInterface,
  stepNumber: number = 1
): CPUStepResult {
  const ip = registers.ip;

  // Find instruction located at current byte offset IP
  const instruction = program.instructions.find((inst) => inst.byteOffset === ip);

  if (!instruction) {
    return {
      registers,
      flags,
      isHalted: true,
      error: `Execution terminated: No instruction found at IP=0x${ip
        .toString(16)
        .toUpperCase()
        .padStart(4, "0")}H (Total program: ${program.totalBytes} bytes, ${
        program.instructions.length
      } instructions)`,
    };
  }

  const { mnemonic, operands, lengthInBytes, byteOffset } = instruction;

  let nextRegs = { ...registers };
  let nextFlags = { ...flags };
  let nextIP = ip + lengthInBytes; // Sequential advance by encoded instruction byte length
  let branchTaken: boolean | undefined = undefined;
  let logType: ExecutionLogEntry["type"] = "INFO";
  let logDesc = "";
  let busActivity: CPUStepResult["busActivity"] = undefined;

  switch (mnemonic) {
    case "MOV": {
      // MOV dest, src (does not modify flags)
      const [destToken, srcToken] = operands;
      if (!destToken || !srcToken) {
        throw new Error(`MOV requires destination and source operands`);
      }

      const srcValue = resolveOperandValue(nextRegs, srcToken);
      nextRegs = setRegisterValue(nextRegs, destToken, srcValue);

      logDesc = `MOV ${destToken}, ${srcToken} -> ${destToken} = 0x${srcValue
        .toString(16)
        .toUpperCase()
        .padStart(is8BitRegister(destToken) ? 2 : 4, "0")} (IP: 0x${byteOffset
        .toString(16)
        .toUpperCase()
        .padStart(4, "0")}H -> 0x${nextIP.toString(16).toUpperCase().padStart(4, "0")}H, +${lengthInBytes}B)`;
      logType = "STATE_CHANGE";
      break;
    }

    case "IN": {
      // IN AL, DX or IN AL, port8
      const [destToken, portToken] = operands;
      if (destToken.toUpperCase() !== "AL") {
        throw new Error(`IN currently only supports target AL in educational mode`);
      }

      const portAddress = resolveOperandValue(nextRegs, portToken);
      const readResult = ioBus.read(portAddress);

      nextRegs = setRegisterValue(nextRegs, "AL", readResult.value);

      busActivity = {
        active: true,
        busType: "IN_READ",
        portAddress,
        dataByte: readResult.value,
      };

      logDesc = `IN AL, ${portToken} (Port 0x${portAddress
        .toString(16)
        .toUpperCase()}H) -> Latched 0x${readResult.value
        .toString(16)
        .toUpperCase()
        .padStart(2, "0")} into AL (IP +${lengthInBytes}B)`;
      logType = "IO_READ";
      break;
    }

    case "OUT": {
      // OUT DX, AL or OUT port8, AL
      const [portToken, srcToken] = operands;
      if (srcToken.toUpperCase() !== "AL") {
        throw new Error(`OUT currently only supports source AL in educational mode`);
      }

      const portAddress = resolveOperandValue(nextRegs, portToken);
      const dataByte = getRegisterValue(nextRegs, "AL");
      ioBus.write(portAddress, dataByte);

      busActivity = {
        active: true,
        busType: "OUT_WRITE",
        portAddress,
        dataByte,
      };

      logDesc = `OUT ${portToken}, AL -> Wrote 0x${dataByte
        .toString(16)
        .toUpperCase()
        .padStart(2, "0")} to Port 0x${portAddress
        .toString(16)
        .toUpperCase()}H (IP +${lengthInBytes}B)`;
      logType = "IO_WRITE";
      break;
    }

    case "TEST": {
      // TEST dest, src (performs bitwise AND without storing result; updates ZF, SF, PF; clears CF, OF)
      const [destToken, srcToken] = operands;
      const val1 = resolveOperandValue(nextRegs, destToken);
      const val2 = resolveOperandValue(nextRegs, srcToken);
      const width = is8BitRegister(destToken) ? 8 : 16;

      nextFlags = evaluateTest(val1, val2, width, nextFlags);

      logDesc = `TEST ${destToken}, ${srcToken} -> Result: 0x${(val1 & val2)
        .toString(16)
        .toUpperCase()} (ZF=${nextFlags.zf ? 1 : 0}, SF=${nextFlags.sf ? 1 : 0}, PF=${
        nextFlags.pf ? 1 : 0
      }) (IP +${lengthInBytes}B)`;
      logType = "STATE_CHANGE";
      break;
    }

    case "JZ": {
      // Jump if Zero (ZF = 1)
      const [targetLabel] = operands;
      const targetByteOffset = program.labels[targetLabel.toUpperCase()];

      if (targetByteOffset === undefined) {
        throw new Error(`Undefined jump label: ${targetLabel}`);
      }

      if (nextFlags.zf) {
        nextIP = targetByteOffset;
        branchTaken = true;
        logDesc = `JZ ${targetLabel} -> ZF=1, Branch TAKEN to byte offset 0x${targetByteOffset
          .toString(16)
          .toUpperCase()
          .padStart(4, "0")}H`;
      } else {
        branchTaken = false;
        logDesc = `JZ ${targetLabel} -> ZF=0, Branch NOT taken (Advance to IP=0x${nextIP
          .toString(16)
          .toUpperCase()
          .padStart(4, "0")}H, +${lengthInBytes}B)`;
      }
      logType = "BRANCH";
      break;
    }

    case "JNZ": {
      // Jump if Not Zero (ZF = 0)
      const [targetLabel] = operands;
      const targetByteOffset = program.labels[targetLabel.toUpperCase()];

      if (targetByteOffset === undefined) {
        throw new Error(`Undefined jump label: ${targetLabel}`);
      }

      if (!nextFlags.zf) {
        nextIP = targetByteOffset;
        branchTaken = true;
        logDesc = `JNZ ${targetLabel} -> ZF=0, Branch TAKEN to byte offset 0x${targetByteOffset
          .toString(16)
          .toUpperCase()
          .padStart(4, "0")}H`;
      } else {
        branchTaken = false;
        logDesc = `JNZ ${targetLabel} -> ZF=1, Branch NOT taken (Advance to IP=0x${nextIP
          .toString(16)
          .toUpperCase()
          .padStart(4, "0")}H, +${lengthInBytes}B)`;
      }
      logType = "BRANCH";
      break;
    }

    case "JMP": {
      // Unconditional Jump
      const [targetLabel] = operands;
      const targetByteOffset = program.labels[targetLabel.toUpperCase()];

      if (targetByteOffset === undefined) {
        throw new Error(`Undefined jump label: ${targetLabel}`);
      }

      nextIP = targetByteOffset;
      branchTaken = true;
      logDesc = `JMP ${targetLabel} -> Jump unconditionally to byte offset 0x${targetByteOffset
        .toString(16)
        .toUpperCase()
        .padStart(4, "0")}H`;
      logType = "BRANCH";
      break;
    }

    case "NOP": {
      logDesc = `NOP (No Operation, IP +1B)`;
      break;
    }
  }

  // Update Instruction Pointer with authentic byte offset
  nextRegs.ip = nextIP;

  const log: ExecutionLogEntry = {
    id: `log-${stepNumber}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    stepNumber,
    ip: byteOffset,
    mnemonic,
    operands,
    description: logDesc,
    timestamp: Date.now(),
    type: logType,
  };

  return {
    registers: nextRegs,
    flags: nextFlags,
    instructionExecuted: instruction,
    log,
    branchTaken,
    busActivity,
    isHalted: false,
  };
}
