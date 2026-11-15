export interface PPIPortPin {
  pinNumber: number;
  pinLabel: string;
  bitIndex: number;
  direction: "Input" | "Output";
  logicState: 0 | 1;
  voltage: number;
  connectedTo: string;
  description: string;
}

export interface PPIPort {
  id: "PORT_A" | "PORT_B" | "PORT_C_UPPER" | "PORT_C_LOWER";
  name: string;
  ioAddress: string;
  mode: 0 | 1 | 2;
  direction: "Input" | "Output" | "Bidirectional";
  currentValueHex: string;
  pins: PPIPortPin[];
}

