import { NavItem, HardwareComponent, ArchitectureBlock, LearningTopic } from "@/types";

export const PROJECT_INFO = {
  name: "AQUA8086",
  version: "1.0.0",
  title: "Design and Simulation of an Automatic Water Level Controller Using the Intel 8086 Microprocessor and 8255 PPI",
  shortTitle: "Intel 8086 Water Level Controller Simulation",
  subtitle: "An interactive 3D exploration of an automatic water level controller powered by the Intel 8086 microprocessor.",
  heroHeading: "Understand the 8086. Experience the Simulation.",
  phase: "Production Ready Educational Simulator",
  nextPhase: "Final Release",
  author: "Academic & Embedded Systems Simulation Lab",
  license: "MIT Educational License",
};

export const NAV_ITEMS: NavItem[] = [
  { id: "hero", label: "Home", href: "#hero" },
  { id: "simulator", label: "Simulator", href: "#simulator", badge: "3D Live" },
  { id: "architecture", label: "8086 Architecture", href: "#architecture" },
  { id: "interfacing", label: "8255 Interfacing", href: "#interfacing" },
  { id: "assembly", label: "Assembly Lab", href: "#assembly" },
  { id: "learn", label: "Learn", href: "#learn" },
  { id: "about", label: "About", href: "#about" },
];

export const SYSTEM_METRICS = [
  { label: "CPU Architecture", value: "16-Bit", description: "Intel 8086 HMOS-III Microprocessor" },
  { label: "PPI Interface", value: "24 I/O", description: "8255 Mode 0 Simple I/O Configuration" },
  { label: "Clock Frequency", value: "5 MHz", description: "Standard 8086 Bus Timing Cycle" },
  { label: "Simulation Runtime", value: "100%", description: "Client-Side Zero-Backend Execution" },
];

export const ARCHITECTURE_STAGES: ArchitectureBlock[] = [
  {
    id: "sensors",
    order: 1,
    title: "Water Level Sensors",
    role: "Conductive stainless probes detecting Lower (25% Empty) and Upper (85% Full) water thresholds.",
    dataDirection: "Input",
    interfaceDetails: "Active-High Digital Signals conditioned to +5V TTL",
    voltageLogic: "+5V = Submerged (Logic 1) / 0V = Dry (Logic 0)",
    signalNames: ["LOW_LVL (PA0)", "HIGH_LVL (PA1)"],
    description: "Monitors fluid conductivity inside the reservoir. Provides bounce-filtered digital binary logic to Port A pins (PA0, PA1) of the 8255 PPI.",
  },
  {
    id: "ppi-in",
    order: 2,
    title: "8255 PPI (Input Port A)",
    role: "Samples digital sensor lines into 8-bit internal buffer register upon RD# strobe.",
    dataDirection: "Input",
    interfaceDetails: "Configured as Mode 0 (Basic Input), Virtual Address 80H",
    voltageLogic: "TTL Compatible 0V-5V (00H, 01H, 03H, or 02H Fault)",
    signalNames: ["PA0 (Bit 0)", "PA1 (Bit 1)", "RD#", "CS#"],
    description: "Acts as peripheral gateway between sensor conditioning circuits and the multiplexed 8086 system data bus.",
  },
  {
    id: "cpu-8086",
    order: 3,
    title: "8086 Microprocessor",
    role: "Executes hysteresis decision algorithm: samples inputs, performs bitwise TEST masking, updates BL pump state.",
    dataDirection: "Internal",
    interfaceDetails: "16-bit EU + BIU, Isolated I/O Bus Operations (IN/OUT)",
    voltageLogic: "5V TTL Microcomputing Core",
    signalNames: ["AD0-AD15", "ALE", "M/IO#", "RD#", "WR#"],
    description: "Processes the 36-byte control firmware. Implements two-point dead-band hysteresis (25%–85%) in register BL to prevent motor rapid cycling.",
  },
  {
    id: "ppi-out",
    order: 4,
    title: "8255 PPI (Output Port B)",
    role: "Latches calculated motor command byte (01H or 00H) to drive power switching circuit.",
    dataDirection: "Output",
    interfaceDetails: "Configured as Mode 0 (Basic Output), Virtual Address 81H",
    voltageLogic: "TTL Latch Active-High (PB0 = 1: Pump ON, PB0 = 0: Pump OFF)",
    signalNames: ["PB0 (Motor Trigger)", "WR#", "RESET"],
    description: "Maintains steady drive voltage to the relay buffer until updated by the microprocessor's subsequent OUT DX, AL cycle.",
  },
  {
    id: "motor-driver",
    order: 5,
    title: "Motor Driver / Relay Circuit",
    role: "Electrical isolation via optocoupler, current amplification via NPN transistor, flyback diode protection.",
    dataDirection: "Output",
    interfaceDetails: "Galvanic Isolation Barrier (4N35 + Relay coil + 1N4007)",
    voltageLogic: "5V Logic driving 12V/220V Inductive Load",
    signalNames: ["RELAY_COIL", "COM", "NO (Normally Open)"],
    description: "Safely bridges microelectronic logic signals (few mA) to high-current AC/DC motor power without electrical interference.",
  },
  {
    id: "water-pump",
    order: 6,
    title: "Water Pump Actuator",
    role: "Centrifugal water pump replenishing the reservoir when PB0 = 1.",
    dataDirection: "Output",
    interfaceDetails: "Single Phase AC/DC Induction Motor",
    voltageLogic: "220V AC / 12V DC Mains Supply",
    signalNames: ["PUMP_POWER_L", "PUMP_POWER_N"],
    description: "Starts pumping when water level falls below 25% (PA = 00H). Continues replenishing through the 25%–84% hysteresis zone until >= 85% (PA = 03H) triggers shutdown.",
  },
];

export const HARDWARE_COMPONENTS: HardwareComponent[] = [
  {
    id: "cpu",
    title: "Intel 8086 Microprocessor",
    model: "Intel 8086-2 / D8086 40-Pin DIP",
    category: "Processor",
    description: "Pioneering 16-bit microprocessor featuring 16-bit internal registers, 20-bit address bus (1MB address space), and separate Bus Interface Unit (BIU) and Execution Unit (EU).",
    specifications: [
      { label: "Data Bus Width", value: "16-Bit Multiplexed (AD0-AD15)" },
      { label: "Address Bus Width", value: "20-Bit (1 Megabyte physical space)" },
      { label: "Clock Frequency", value: "5 MHz to 10 MHz" },
      { label: "Technology", value: "40-Pin HMOS Dual-In-Line Package" },
      { label: "Operating Modes", value: "Minimum Mode (Single CPU) / Maximum Mode" },
    ],
    portAssignment: "Data Bus AD0-AD7 connected to 8255 PPI Data D0-D7",
    logicBehavior: "Executes IN AL, DX (80H) to read Port A, evaluates sensor bits with TEST AL, 02H and TEST AL, 01H, and executes OUT DX, AL (81H) to toggle motor via Port B.",
    pinoutPreview: ["VCC (+5V)", "GND", "CLK", "RESET", "MN/MX#", "RD#", "WR#", "ALE", "M/IO#"],
    iconName: "Cpu",
  },
  {
    id: "ppi",
    title: "Intel 8255 PPI",
    model: "8255A / 82C55 Programmable Peripheral Interface",
    category: "Interface",
    description: "Versatile parallel I/O interface device containing 24 programmable I/O pins organized into three 8-bit ports (Port A, Port B, Port C) governed by an internal Control Word Register.",
    specifications: [
      { label: "Total I/O Pins", value: "24 Programmable Lines" },
      { label: "Port Organization", value: "Port A (8-bit), Port B (8-bit), Port C (8-bit)" },
      { label: "Operational Modes", value: "Mode 0 (Basic I/O), Mode 1 (Strobed), Mode 2 (Bi-dir)" },
      { label: "Control Word Used", value: "90H (Mode 0: Port A=Input, Port B=Output)" },
      { label: "Handshake Lines", value: "Integrated in Mode 1 & 2" },
    ],
    portAssignment: "Port A: 80H (Sensors) | Port B: 81H (Pump Relay) | Port C: 82H | Control: 83H",
    logicBehavior: "Decodes 8086 I/O instructions. Mode 0 (90H) configures Port A (80H) for sensor inputs and Port B (81H) for latched motor relay output.",
    pinoutPreview: ["PA0-PA7", "PB0-PB7", "PC0-PC7", "D0-D7", "CS#", "A0, A1", "RD#", "WR#"],
    iconName: "Binary",
  },
  {
    id: "sensor_low",
    title: "Low-Level Water Sensor",
    model: "Bottom Threshold Conductive Stainless Probe",
    category: "Sensor",
    description: "Installed at the 25% mark of the water tank. Detects when fluid drops below minimum operating height (< 25%), triggering the 8086 to switch the pump ON.",
    specifications: [
      { label: "Sensor Type", value: "Conductive Probe / Float Switch" },
      { label: "Trigger Threshold", value: "25% Tank Capacity" },
      { label: "Signal Logic", value: "Submerged (>=25%) = 1 / Dry (<25%) = 0" },
      { label: "Conditioning", value: "Schmitt-Trigger Active-High Buffer" },
    ],
    portAssignment: "Connected to 8255 Port A Bit 0 (PA0)",
    logicBehavior: "When water falls below 25%, PA0 becomes Logic 0 (Dry). TEST AL, 01H sets ZF=1 and JZ TANK_LOW activates the motor relay (BL = 01H).",
    iconName: "Waves",
  },
  {
    id: "sensor_high",
    title: "High-Level Water Sensor",
    model: "Top Threshold Conductive Stainless Probe",
    category: "Sensor",
    description: "Installed near the top of the reservoir at the 85% mark. Senses when the tank reaches full capacity (>= 85%), signaling the 8086 to stop the pump immediately.",
    specifications: [
      { label: "Sensor Type", value: "Conductive Probe / Dual Stainless Point" },
      { label: "Trigger Threshold", value: "85% Tank Capacity" },
      { label: "Signal Logic", value: "Submerged (>=85%) = 1 / Dry (<85%) = 0" },
      { label: "Response Latency", value: "< 10 ms" },
    ],
    portAssignment: "Connected to 8255 Port A Bit 1 (PA1)",
    logicBehavior: "When water reaches >= 85%, PA1 becomes Logic 1 (Submerged). TEST AL, 02H clears ZF=0 and JNZ TANK_FULL clears BL = 00H to shut off the pump.",
    iconName: "ShieldAlert",
  },
  {
    id: "driver",
    title: "Motor Driver & Relay Stage",
    model: "Optoisolated SPDT Relay Module (5V Coil / 10A 250V AC)",
    category: "Actuator",
    description: "Provides electrical isolation between the fragile 5V TTL microprocessor logic circuits and the inductive, high-voltage electrical water pump motor.",
    specifications: [
      { label: "Isolation Device", value: "PC817 / 4N35 Optical Isolator" },
      { label: "Switching Transistor", value: "2N2222 / BC547 NPN Darlington Driver" },
      { label: "Protective Diode", value: "1N4007 Free-wheeling Flyback Diode" },
      { label: "Contact Rating", value: "10A @ 250V AC / 10A @ 30V DC" },
    ],
    portAssignment: "Connected to 8255 Port B Bit 0 (PB0)",
    logicBehavior: "PB0 = 1 turns ON transistor, energizing relay coil and connecting mains power to the pump. PB0 = 0 opens circuit.",
    iconName: "Zap",
  },
  {
    id: "pump",
    title: "Centrifugal Water Pump",
    model: "Single-Phase AC Submersible/Centrifugal Induction Pump",
    category: "Actuator",
    description: "Mechanical fluid actuator driven by mains voltage. Circulates water from the underground sump/well up into the overhead storage tank.",
    specifications: [
      { label: "Rated Voltage", value: "220V AC / 50 Hz" },
      { label: "Sim Fill Rate", value: "7.5% Tank Volume / Second" },
      { label: "Duty Cycle", value: "Intermittent / Hysteresis Governed" },
      { label: "Protection", value: "Software Fault Cutoff (PA=02H)" },
    ],
    portAssignment: "Directly wired across Relay NO (Normally Open) contacts",
    logicBehavior: "Operates continuously during tank replenishment cycle until 8086 cuts relay excitation at >= 85%.",
    iconName: "Power",
  },
  {
    id: "tank",
    title: "Overhead Storage Tank",
    model: "Graduated Cylindrical Reservoir (1000L Reference Model)",
    category: "Vessel",
    description: "Physical vessel storing water for domestic or industrial distribution. Houses both sensor probes at calibrated geometric heights (25% and 85%).",
    specifications: [
      { label: "Reference Capacity", value: "1000 Liters (0% - 100%)" },
      { label: "Lower Sensor Mark", value: "250 mm from base (25%)" },
      { label: "Upper Sensor Mark", value: "850 mm from base (85%)" },
      { label: "Discharge Simulation", value: "4.0% Tank Volume / Second Drain" },
    ],
    portAssignment: "Houses Low Probe (PA0 @ 25%) and High Probe (PA1 @ 85%)",
    logicBehavior: "Provides continuous hydrostatic column feedback modeled in the 3D client simulation.",
    iconName: "Database",
  },
];

export const LEARNING_TOPICS: LearningTopic[] = [
  {
    id: "topic-8086-arch",
    title: "8086 Microprocessor Internal Architecture",
    category: "Hardware Architecture",
    summary: "Detailed overview of the 8086 Execution Unit (EU), Bus Interface Unit (BIU), segmented memory, and instruction byte-offset tracking.",
    difficulty: "Intermediate",
    keyTakeaways: [
      "Separation of Execution Unit (EU) and Bus Interface Unit (BIU) enables parallel prefetching.",
      "6-byte instruction queue pre-fetches opcodes while EU executes current instruction.",
      "16-bit registers (AX, BX, CX, DX) with 8-bit aliases (AH/AL, BH/BL, CH/CL, DH/DL).",
      "Instruction Pointer (IP) tracks the exact byte offset of the next instruction in the Code Segment.",
    ],
    contentExcerpt:
      "The Intel 8086 features a 16-bit ALU and separate internal execution and bus units. In AQUA8086, IP advances by each instruction's authentic machine byte length (1B for IN/OUT, 2B for 8-bit MOV/TEST/short jumps, 3B for 16-bit immediate MOV).",
  },
  {
    id: "topic-8255-interfacing",
    title: "8255 PPI Interfacing & Control Word Programming",
    category: "Peripheral Interfacing",
    summary: "How to connect the 8255 PPI to the 8086 system bus, decode virtual I/O addresses (80H–83H), and configure Mode 0 I/O ports.",
    difficulty: "Intermediate",
    keyTakeaways: [
      "Control Word Register (83H) determines whether ports act as Input or Output.",
      "Control Word 90H (10010000B): D7=1 (Mode Set), D4=1 (Port A Input), D1=0 (Port B Output), D3/D0=0 (Port C Output).",
      "Address pins A1, A0 select: 00 = Port A (80H), 01 = Port B (81H), 10 = Port C (82H), 11 = Control Register (83H).",
      "RD# and WR# strobes synchronize bus transactions directly with the 8086 IN and OUT instructions.",
    ],
    contentExcerpt:
      "The 8255 PPI solves the peripheral interfacing challenge by providing 24 programmable parallel I/O pins. During initialization, the 8086 writes control byte 90H to Port 83H, configuring Port A (80H) to read sensor probes and Port B (81H) to drive the motor relay.",
    codeSnippet: `; Initializing 8255 PPI in Mode 0 (6 Bytes Total)
MOV AL, 90H       ; [0000H: B0 90] 10010000B: Port A=Input, Port B=Output
MOV DX, 83H       ; [0002H: BA 83 00] Control Word Register Address (83H)
OUT DX, AL        ; [0005H: EE] Write Control Word 90H to 8255 PPI`,
  },
  {
    id: "topic-working-principle",
    title: "Hysteresis Control & Closed-Loop Principle",
    category: "Control Systems",
    summary: "Explains how the two-point hysteresis algorithm (25% Low / 85% High) prevents motor chatter around sensor boundaries.",
    difficulty: "Beginner",
    keyTakeaways: [
      "Single-sensor systems suffer from destructive chattering due to water ripples and waves.",
      "Two-point hysteresis introduces a dead-band zone between 25% (PA0) and 85% (PA1).",
      "Pump turns ON only when water drops below 25% (PA = 00H -> BL = 01H).",
      "Pump retains its prior state in BL when water is between 25% and 84% (PA = 01H).",
      "Pump turns OFF at >= 85% (PA = 03H -> BL = 00H) or upon sensor fault (PA = 02H).",
    ],
    contentExcerpt:
      "A naive water controller with a single probe would oscillate erratically as surface waves splash onto the probe. AQUA8086 implements a two-sensor hysteresis state machine in register BL: once turned ON below 25%, the pump continues pumping until the 85% upper limit is reached.",
  },
  {
    id: "topic-assembly-lang",
    title: "8086 Assembly Language Implementation",
    category: "Firmware / Assembly",
    summary: "Walkthrough of the 18-instruction (36-byte) assembly firmware controlling the water pump, port reading, bitmask testing, and loop execution.",
    difficulty: "Advanced",
    keyTakeaways: [
      "Using IN AL, DX (80H) to fetch the sensor byte into the accumulator register AL.",
      "Using TEST AL, 02H and TEST AL, 01H bitwise masking to isolate PA1 and PA0 states.",
      "Branching using JNZ TANK_FULL (0x001AH) and JZ TANK_LOW (0x0016H).",
      "Preserving pump state in BL across polling iterations and writing to Port B (81H) via OUT DX, AL.",
    ],
    contentExcerpt:
      "The 36-byte AQUA8086 firmware begins by writing 90H to Control Port 83H, initializes BL=00H, and enters the CHECK loop at byte offset 0x0008H. It samples Port A (80H), tests PA1 (02H) first for safety cutoff, then tests PA0 (01H) for low-water refill, and outputs BL to Port B (81H).",
    codeSnippet: `CHECK:              ; [0x0008H] Main Closed-Loop Polling Entry
    MOV DX, 80H     ; [0x0008H: BA 80 00] Target 8255 Port A (Sensors)
    IN AL, DX       ; [0x000BH: EC] Read PA1 & PA0 into AL
    TEST AL, 02H    ; [0x000CH: A8 02] High Probe Active (PA1=1)?
    JNZ TANK_FULL   ; [0x000EH: 75 0A] Yes -> Jump to 0x001AH (Pump OFF)
    TEST AL, 01H    ; [0x0010H: A8 01] Low Probe Dry (PA0=0)?
    JZ TANK_LOW     ; [0x0012H: 74 02] Yes -> Jump to 0x0016H (Pump ON)
    JMP UPDATE      ; [0x0014H: EB 06] Mid-level (01H): Retain BL`,
  },
  {
    id: "topic-algorithm-flowchart",
    title: "Algorithm Logic & State Machine Flowchart",
    category: "System Design",
    summary: "Formal flowchart and finite state machine transition table for the automated controller.",
    difficulty: "Beginner",
    keyTakeaways: [
      "State 0: STANDBY / Tank Full >= 85% (PA = 03H, BL = 00H, Pump OFF).",
      "State 1: DRAINING / Mid Level 25%–84% (PA = 01H, BL retained 00H, Pump stays OFF).",
      "State 2: LOW REFILL TRIGGER / Level < 25% (PA = 00H, BL = 01H, Pump switches ON).",
      "State 3: FILLING / Mid Level 25%–84% (PA = 01H, BL retained 01H, Pump stays ON).",
      "State 4: FAULT CUTOFF / Sensor Anomaly (PA = 02H, PA1=1 & PA0=0 -> BL = 00H, Safe Shutdown).",
    ],
    contentExcerpt:
      "A deterministic finite state machine (FSM) guarantees that across all water levels and sensor states—including physical probe anomalies (PA=02H)—the controller transitions predictably between STANDBY, FILLING, DRAINING, and FAULT CUTOFF modes.",
  },
];

