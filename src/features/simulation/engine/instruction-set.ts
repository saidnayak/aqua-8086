/**
 * 8086 Instruction Set Architecture Definitions & Machine Byte Encodings
 * Supported mnemonics: MOV, IN, OUT, TEST, JZ, JNZ, JMP, NOP.
 * Computes authentic byte lengths and machine encodings for the 8086 educational subset.
 */

import { Mnemonic } from "../types/simulation";
import { is8BitRegister } from "./memory";

export const SUPPORTED_MNEMONICS: readonly Mnemonic[] = [
  "MOV",
  "IN",
  "OUT",
  "TEST",
  "JZ",
  "JNZ",
  "JMP",
  "NOP",
];

export function isSupportedMnemonic(name: string): name is Mnemonic {
  return SUPPORTED_MNEMONICS.includes(name.toUpperCase() as Mnemonic);
}

/**
 * Parses numeric literals in formats:
 * - Hexadecimal with 'H' suffix (e.g., 90H, 83h, 0FFH)
 * - Hexadecimal with '0x' prefix (e.g., 0x90)
 * - Binary with 'B' suffix (e.g., 10010000B)
 * - Decimal numbers (e.g., 128)
 */
export function parseNumericLiteral(token: string): number | null {
  const trimmed = token.trim();
  if (!trimmed) return null;

  // Hex format with H suffix (e.g. 90H, 01h)
  if (/^[0-9a-fA-F]+[hH]$/.test(trimmed)) {
    const hex = trimmed.slice(0, -1);
    const parsed = parseInt(hex, 16);
    return isNaN(parsed) ? null : parsed;
  }

  // Hex format with 0x prefix (e.g. 0x90)
  if (/^0x[0-9a-fA-F]+$/i.test(trimmed)) {
    const parsed = parseInt(trimmed, 16);
    return isNaN(parsed) ? null : parsed;
  }

  // Binary format with B suffix (e.g. 10010000b)
  if (/^[01]+[bB]$/.test(trimmed)) {
    const bin = trimmed.slice(0, -1);
    const parsed = parseInt(bin, 2);
    return isNaN(parsed) ? null : parsed;
  }

  // Standard decimal
  if (/^-?[0-9]+$/.test(trimmed)) {
    const parsed = parseInt(trimmed, 10);
    return isNaN(parsed) ? null : parsed;
  }

  return null;
}

const REG8_OPCODE_MAP: Record<string, number> = {
  AL: 0,
  CL: 1,
  DL: 2,
  BL: 3,
  AH: 4,
  CH: 5,
  DH: 6,
  BH: 7,
};

const REG16_OPCODE_MAP: Record<string, number> = {
  AX: 0,
  CX: 1,
  DX: 2,
  BX: 3,
  SP: 4,
  BP: 5,
  SI: 6,
  DI: 7,
};

/**
 * Computes authentic 8086 encoded byte length and simulated machine bytes.
 *
 * Supported Forms:
 * - NOP: 1 byte [90]
 * - IN AL, DX: 1 byte [EC]
 * - OUT DX, AL: 1 byte [EE]
 * - MOV reg8, imm8: 2 bytes [B0+r, imm8] (e.g. MOV AL, 90H -> B0 90, MOV BL, 00H -> B3 00)
 * - MOV reg16, imm16: 3 bytes [B8+r, imm_low, imm_high] (e.g. MOV DX, 83H -> BA 83 00)
 * - MOV reg8, reg8: 2 bytes [8A, ModRM] (e.g. MOV AL, BL -> 8A C3)
 * - MOV reg16, reg16: 2 bytes [8B, ModRM]
 * - TEST AL, imm8: 2 bytes [A8, imm8] (e.g. TEST AL, 02H -> A8 02)
 * - TEST reg8, imm8: 3 bytes [F6, ModRM, imm8]
 * - TEST reg, reg: 2 bytes [84/85, ModRM]
 * - JZ / JNZ / JMP: 2 bytes short branch [74/75/EB, rel8]
 */
export function getInstructionEncoding(
  mnemonic: Mnemonic,
  operands: string[]
): { lengthInBytes: number; encodedBytes: string[] } {
  switch (mnemonic) {
    case "NOP":
      return { lengthInBytes: 1, encodedBytes: ["90"] };

    case "IN": {
      // IN AL, DX is single-byte opcode 0xEC
      return { lengthInBytes: 1, encodedBytes: ["EC"] };
    }

    case "OUT": {
      // OUT DX, AL is single-byte opcode 0xEE
      return { lengthInBytes: 1, encodedBytes: ["EE"] };
    }

    case "MOV": {
      const [destToken, srcToken] = operands.map((o) => o.toUpperCase());
      const srcNum = parseNumericLiteral(srcToken);

      if (srcNum !== null) {
        // Immediate move
        if (is8BitRegister(destToken)) {
          // MOV reg8, imm8 -> 2 bytes (B0+r8, imm8)
          const regCode = REG8_OPCODE_MAP[destToken] ?? 0;
          const opcode = (0xb0 + regCode).toString(16).toUpperCase();
          const byteVal = (srcNum & 0xff).toString(16).toUpperCase().padStart(2, "0");
          return { lengthInBytes: 2, encodedBytes: [opcode, byteVal] };
        } else {
          // MOV reg16, imm16 -> 3 bytes (B8+r16, immLow, immHigh)
          const regCode = REG16_OPCODE_MAP[destToken] ?? 0;
          const opcode = (0xb8 + regCode).toString(16).toUpperCase();
          const lowByte = (srcNum & 0xff).toString(16).toUpperCase().padStart(2, "0");
          const highByte = ((srcNum >> 8) & 0xff).toString(16).toUpperCase().padStart(2, "0");
          return { lengthInBytes: 3, encodedBytes: [opcode, lowByte, highByte] };
        }
      } else {
        // Register-to-register move -> 2 bytes (88/8A or 89/8B + ModR/M byte)
        const is8Bit = is8BitRegister(destToken);
        const opcode = is8Bit ? "8A" : "8B";
        const destCode = (is8Bit ? REG8_OPCODE_MAP[destToken] : REG16_OPCODE_MAP[destToken]) ?? 0;
        const srcCode = (is8Bit ? REG8_OPCODE_MAP[srcToken] : REG16_OPCODE_MAP[srcToken]) ?? 0;
        const modRM = (0xc0 | (destCode << 3) | srcCode).toString(16).toUpperCase().padStart(2, "0");
        return { lengthInBytes: 2, encodedBytes: [opcode, modRM] };
      }
    }

    case "TEST": {
      const [destToken, srcToken] = operands.map((o) => o.toUpperCase());
      const srcNum = parseNumericLiteral(srcToken);

      if (destToken === "AL" && srcNum !== null) {
        // TEST AL, imm8 is special compact encoding: 2 bytes (A8, imm8)
        const immByte = (srcNum & 0xff).toString(16).toUpperCase().padStart(2, "0");
        return { lengthInBytes: 2, encodedBytes: ["A8", immByte] };
      } else if (srcNum !== null) {
        // TEST reg8, imm8 -> 3 bytes (F6 /0, imm8)
        const immByte = (srcNum & 0xff).toString(16).toUpperCase().padStart(2, "0");
        return { lengthInBytes: 3, encodedBytes: ["F6", "C0", immByte] };
      } else {
        // TEST reg, reg -> 2 bytes
        return { lengthInBytes: 2, encodedBytes: ["84", "C0"] };
      }
    }

    case "JZ":
      // JZ rel8 short jump: 2 bytes (74, rel8)
      return { lengthInBytes: 2, encodedBytes: ["74", "xx"] };

    case "JNZ":
      // JNZ rel8 short jump: 2 bytes (75, rel8)
      return { lengthInBytes: 2, encodedBytes: ["75", "xx"] };

    case "JMP":
      // JMP rel8 short jump: 2 bytes (EB, rel8)
      return { lengthInBytes: 2, encodedBytes: ["EB", "xx"] };

    default:
      return { lengthInBytes: 1, encodedBytes: ["90"] };
  }
}
