/**
 * 8086 Assembly Language Assembler & Label Resolver
 * Parses educational assembly source text into an executable instruction buffer
 * with authentic 8086 byte offsets, encoded lengths, and label resolution.
 */

import { AssemblyProgram, ParsedInstruction, Mnemonic } from "../types/simulation";
import { isSupportedMnemonic, getInstructionEncoding } from "./instruction-set";

export const DEFAULT_ASSEMBLY_CODE = `; ==========================================
; AQUA8086 Automatic Water Level Controller
; Intel 8086 + 8255 PPI Assembly Program
; ==========================================

; Configure 8255 PPI (Port A=In, Port B=Out)
MOV AL, 90H
MOV DX, 83H
OUT DX, AL

; Initialize pump state (BL=0: Pump OFF)
MOV BL, 00H

CHECK:
    MOV DX, 80H
    IN AL, DX

    TEST AL, 02H
    JNZ TANK_FULL

    TEST AL, 01H
    JZ TANK_LOW

    JMP UPDATE

TANK_LOW:
    MOV BL, 01H
    JMP UPDATE

TANK_FULL:
    MOV BL, 00H

UPDATE:
    MOV DX, 81H
    MOV AL, BL
    OUT DX, AL

    JMP CHECK
`;

export interface AssembleResult {
  program: AssemblyProgram;
  errors: string[];
}

/**
 * Assembles source code into an array of parsed instructions with resolved jump targets,
 * byte offsets, and instruction lengths.
 */
export function assembleProgram(sourceCode: string = DEFAULT_ASSEMBLY_CODE): AssembleResult {
  const lines = sourceCode.split("\n");
  const instructions: ParsedInstruction[] = [];
  const labels: Record<string, number> = {};
  const labelIndices: Record<string, number> = {};
  const errors: string[] = [];

  let currentByteOffset = 0;
  let instructionIndex = 0;

  // Pass 1: Parse tokens and register label addresses
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const rawLine = lines[lineIndex];

    // Strip comments (; to end of line)
    const commentIndex = rawLine.indexOf(";");
    const cleanLine = (commentIndex !== -1 ? rawLine.slice(0, commentIndex) : rawLine).trim();

    if (!cleanLine) {
      continue;
    }

    let remaining = cleanLine;

    // Check if line contains a label (e.g., "CHECK:" or "TANK_LOW:")
    const labelMatch = remaining.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*:(.*)$/);
    let labelName: string | undefined = undefined;

    if (labelMatch) {
      labelName = labelMatch[1].toUpperCase();
      labels[labelName] = currentByteOffset;
      labelIndices[labelName] = instructionIndex;
      remaining = labelMatch[2].trim();
    }

    // If there is an instruction on the same line after the label (or standalone)
    if (remaining) {
      // Split into mnemonic and operand part
      const spaceIndex = remaining.search(/\s/);
      let mnemonicPart = "";
      let operandPart = "";

      if (spaceIndex === -1) {
        mnemonicPart = remaining;
      } else {
        mnemonicPart = remaining.slice(0, spaceIndex);
        operandPart = remaining.slice(spaceIndex).trim();
      }

      const mnemonicUpper = mnemonicPart.toUpperCase();

      if (!isSupportedMnemonic(mnemonicUpper)) {
        errors.push(`Line ${lineIndex + 1}: Unsupported mnemonic '${mnemonicUpper}'`);
        continue;
      }

      // Split operands by comma
      const operands = operandPart
        ? operandPart.split(",").map((op) => op.trim())
        : [];

      const { lengthInBytes, encodedBytes } = getInstructionEncoding(
        mnemonicUpper as Mnemonic,
        operands
      );

      instructions.push({
        index: instructionIndex,
        address: currentByteOffset,
        byteOffset: currentByteOffset,
        lengthInBytes,
        encodedBytes,
        label: labelName,
        mnemonic: mnemonicUpper as Mnemonic,
        operands,
        rawText: cleanLine,
        sourceLineNumber: lineIndex + 1,
      });

      currentByteOffset += lengthInBytes;
      instructionIndex++;
    }
  }

  // Pass 2: Validate branch jump targets and encode relative 8-bit displacements
  for (const inst of instructions) {
    if (["JZ", "JNZ", "JMP"].includes(inst.mnemonic)) {
      if (inst.operands.length === 0) {
        errors.push(`Byte 0x${inst.byteOffset.toString(16).toUpperCase()}: ${inst.mnemonic} requires a jump target label`);
      } else {
        const targetLabel = inst.operands[0].toUpperCase();
        const targetOffset = labels[targetLabel];
        if (targetOffset === undefined) {
          errors.push(
            `Byte 0x${inst.byteOffset.toString(16).toUpperCase()}: Jump target label '${targetLabel}' not found`
          );
        } else {
          // Compute authentic 8086 8-bit two's complement relative displacement from next sequential IP
          const nextSequentialIP = inst.byteOffset + inst.lengthInBytes;
          const rel8 = (targetOffset - nextSequentialIP) & 0xff;
          inst.encodedBytes = [
            inst.encodedBytes[0],
            rel8.toString(16).toUpperCase().padStart(2, "0"),
          ];
        }
      }
    }
  }

  return {
    program: {
      instructions,
      labels,
      labelIndices,
      sourceCode,
      totalBytes: currentByteOffset,
    },
    errors,
  };
}
