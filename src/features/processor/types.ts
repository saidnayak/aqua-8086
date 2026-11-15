export interface RegisterState {
  name: string;
  category: "General" | "Pointer/Index" | "Segment" | "Instruction" | "Flag";
  highByte?: string;
  lowByte?: string;
  full16Hex: string;
  decimalValue: number;
  description: string;
}

export interface CpuCycleState {
  busCycle: "T1" | "T2" | "T3" | "Tw" | "T4";
  activeBusSignal: "M/IO#" | "RD#" | "WR#" | "ALE" | "DEN#" | "DT/R#";
  addressLatchHex: string;
  dataBusHex: string;
}

