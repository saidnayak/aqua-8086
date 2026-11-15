/**
 * Virtual Water Pump Controller
 * Senses the 8255 PPI Port B Bit 0 (PB0) to actuate the virtual pump.
 * Active-high logical control:
 * PB0 = 1 -> Pump ON
 * PB0 = 0 -> Pump OFF
 */

export function isPumpActive(portBValue: number): boolean {
  return (portBValue & 0x01) === 1;
}

export function formatPumpStatus(portBValue: number): {
  isOn: boolean;
  text: "RUNNING" | "STANDBY";
  label: string;
} {
  const isOn = isPumpActive(portBValue);
  return {
    isOn,
    text: isOn ? "RUNNING" : "STANDBY",
    label: isOn ? "Pump Active (PB0 = 1)" : "Pump Idle (PB0 = 0)",
  };
}

