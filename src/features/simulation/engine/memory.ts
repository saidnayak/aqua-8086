/**
 * 8086 Register Architecture & Aliasing Store
 * Implements strict register aliasing between 16-bit general registers (AX, BX, CX, DX)
 * and their respective 8-bit high/low components (AH, AL, BH, BL, CH, CL, DH, DL).
 */

import { CPURegisters, RegisterName } from "../types/simulation";

export const INITIAL_REGISTERS: Readonly<CPURegisters> = {
  ax: 0x0000,
  bx: 0x0000,
  cx: 0x0000,
  dx: 0x0000,
  ip: 0x0000,
  cs: 0x1000,
  ds: 0x2000,
  ss: 0x3000,
  es: 0x4000,
  sp: 0xfffe,
  bp: 0x0000,
  si: 0x0000,
  di: 0x0000,
};

/**
 * Checks if a string represents an 8-bit register.
 */
export function is8BitRegister(name: string): boolean {
  const n = name.toUpperCase();
  return ["AL", "AH", "BL", "BH", "CL", "CH", "DL", "DH"].includes(n);
}

/**
 * Checks if a string represents a 16-bit register.
 */
export function is16BitRegister(name: string): boolean {
  const n = name.toUpperCase();
  return ["AX", "BX", "CX", "DX", "IP", "CS", "DS", "SS", "ES", "SP", "BP", "SI", "DI"].includes(n);
}

/**
 * Reads a value from a register, resolving 8-bit or 16-bit alias.
 */
export function getRegisterValue(regs: CPURegisters, name: RegisterName | string): number {
  const reg = name.toUpperCase();

  switch (reg) {
    // 16-bit registers
    case "AX":
      return regs.ax & 0xffff;
    case "BX":
      return regs.bx & 0xffff;
    case "CX":
      return regs.cx & 0xffff;
    case "DX":
      return regs.dx & 0xffff;
    case "IP":
      return regs.ip & 0xffff;
    case "CS":
      return regs.cs & 0xffff;
    case "DS":
      return regs.ds & 0xffff;
    case "SS":
      return regs.ss & 0xffff;
    case "ES":
      return regs.es & 0xffff;
    case "SP":
      return regs.sp & 0xffff;
    case "BP":
      return regs.bp & 0xffff;
    case "SI":
      return regs.si & 0xffff;
    case "DI":
      return regs.di & 0xffff;

    // 8-bit registers (Low bytes)
    case "AL":
      return regs.ax & 0xff;
    case "BL":
      return regs.bx & 0xff;
    case "CL":
      return regs.cx & 0xff;
    case "DL":
      return regs.dx & 0xff;

    // 8-bit registers (High bytes)
    case "AH":
      return (regs.ax >> 8) & 0xff;
    case "BH":
      return (regs.bx >> 8) & 0xff;
    case "CH":
      return (regs.cx >> 8) & 0xff;
    case "DH":
      return (regs.dx >> 8) & 0xff;

    default:
      throw new Error(`Unknown register: ${name}`);
  }
}

/**
 * Sets a value in a register, correctly propagating changes to aliased parent/child registers.
 * Returns a new immutably updated CPURegisters object.
 */
export function setRegisterValue(
  regs: CPURegisters,
  name: RegisterName | string,
  value: number
): CPURegisters {
  const reg = name.toUpperCase();
  const next = { ...regs };

  switch (reg) {
    // 16-bit assignments
    case "AX":
      next.ax = value & 0xffff;
      break;
    case "BX":
      next.bx = value & 0xffff;
      break;
    case "CX":
      next.cx = value & 0xffff;
      break;
    case "DX":
      next.dx = value & 0xffff;
      break;
    case "IP":
      next.ip = value & 0xffff;
      break;
    case "CS":
      next.cs = value & 0xffff;
      break;
    case "DS":
      next.ds = value & 0xffff;
      break;
    case "SS":
      next.ss = value & 0xffff;
      break;
    case "ES":
      next.es = value & 0xffff;
      break;
    case "SP":
      next.sp = value & 0xffff;
      break;
    case "BP":
      next.bp = value & 0xffff;
      break;
    case "SI":
      next.si = value & 0xffff;
      break;
    case "DI":
      next.di = value & 0xffff;
      break;

    // 8-bit low byte assignments (preserves high byte)
    case "AL":
      next.ax = (next.ax & 0xff00) | (value & 0xff);
      break;
    case "BL":
      next.bx = (next.bx & 0xff00) | (value & 0xff);
      break;
    case "CL":
      next.cx = (next.cx & 0xff00) | (value & 0xff);
      break;
    case "DL":
      next.dx = (next.dx & 0xff00) | (value & 0xff);
      break;

    // 8-bit high byte assignments (preserves low byte)
    case "AH":
      next.ax = (next.ax & 0x00ff) | ((value & 0xff) << 8);
      break;
    case "BH":
      next.bx = (next.bx & 0x00ff) | ((value & 0xff) << 8);
      break;
    case "CH":
      next.cx = (next.cx & 0x00ff) | ((value & 0xff) << 8);
      break;
    case "DH":
      next.dx = (next.dx & 0x00ff) | ((value & 0xff) << 8);
      break;

    default:
      throw new Error(`Unknown register: ${name}`);
  }

  return next;
}

