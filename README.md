# AQUA8086

> **Design and Simulation of an Automatic Water Level Controller Using the Intel 8086 Microprocessor and 8255 PPI**

A professional, interactive, browser-based educational simulation platform designed to visually explain how the Intel 8086 microprocessor controls an automatic water level system through an 8255 Programmable Peripheral Interface (PPI).

---

## 🔬 Core Objective

Build an interactive, rigorous browser-based engineering simulator that visually explains how the Intel 8086 microprocessor controls an automatic water level controller. The entire application operates purely client-side inside the web browser without any physical hardware, Arduino, external circuits, backend server, or database.

The 3D water tank and its visual elements respond directly to simulated processor output via Port B pin PB0. All instruction decoding, register updates, status flag evaluations, and bus operations are authentic and deterministic.

---

## 📐 System Architecture

The conceptual connection implemented in the system:

```text
Water Level Sensors (Probes PA0 & PA1)
       ↓
8255 PPI (Input Port A - Virtual I/O Address 80H)
       ↓
8086 Microprocessor (16-Bit EU + BIU Subsystems)
       ↓
8255 PPI (Output Port B - Virtual I/O Address 81H)
       ↓
Motor Driver / Optoisolated Relay (PB0 = 1: Active)
       ↓
Water Pump Actuator (Submersible/Centrifugal)
```

---

## ⚙️ Microprocessor & Virtual Hardware Engine

### 1. Virtual 8086 Processor Engine & Instruction Pointer (IP) Accuracy
- **Authentic Instruction Byte Offsets**: The Instruction Pointer (`IP`) represents the exact byte offset into the code segment, advancing according to real 8086 machine encoding lengths:
  - `MOV reg8, imm8` (e.g. `MOV AL, 90H`, `MOV BL, 00H`): **2 bytes** (`B0 imm8`, `B3 imm8`)
  - `MOV reg16, imm16` (e.g. `MOV DX, 83H`, `MOV DX, 80H`): **3 bytes** (`BA imm16_low imm16_high`)
  - `MOV reg8, reg8` (e.g. `MOV AL, BL`): **2 bytes** (`8A C3`)
  - `IN AL, DX`: **1 byte** (`EC`)
  - `OUT DX, AL`: **1 byte** (`EE`)
  - `TEST AL, imm8`: **2 bytes** (`A8 imm8`)
  - `JZ label` / `JNZ label` / `JMP label`: **2 bytes** (Short relative branches: `74 rel8`, `75 rel8`, `EB rel8`)
  - `NOP`: **1 byte** (`90`)
- **Registers with Strict Aliasing**:
  - 16-bit: `AX`, `BX`, `CX`, `DX`, `IP`, `CS`, `DS`, `SS`, `ES`, `SP`, `BP`, `SI`, `DI`.
  - 8-bit low & high aliases: `AL`, `AH`, `BL`, `BH`, `CL`, `CH`, `DL`, `DH`. Modifying `AL` or `AH` strictly mutates parent `AX`.
- **Condition Flags**: `ZF` (Zero), `SF` (Sign), `PF` (Parity), `CF` (Carry), `OF` (Overflow).

### 2. Virtual 8255 Programmable Peripheral Interface (PPI)
- **Virtual I/O Port Map**:
  - `PORT A (80H)`: Sensor input (PA0: Low probe, PA1: High probe)
  - `PORT B (81H)`: Pump-control output (PB0: Motor relay trigger)
  - `PORT C (82H)`: General-purpose output
  - `CONTROL REGISTER (83H)`: Mode configuration register
- **Control Word `90H` (`10010000B`)**:
  - $D_7 = 1$: Mode Set Flag Active
  - $D_6, D_5 = 00$: Group A Mode 0
  - $D_4 = 1$: Port A configured as Input
  - $D_3 = 0$: Port C Upper configured as Output
  - $D_2 = 0$: Group B Mode 0
  - $D_1 = 0$: Port B configured as Output
  - $D_0 = 0$: Port C Lower configured as Output
- **Port Direction Enforcement**: Protects against illegal writes to input ports and validates output latches.

### 3. Dual-Threshold Sensors & Hysteresis Logic
- **PA0 (Low-Level Sensor)**: `1` when fluid level $\ge 25\%$; `0` when below $25\%$.
- **PA1 (High-Level Sensor)**: `1` when fluid level $\ge 85\%$; `0` when below $85\%$.
- **Sensor Logic States**:
  - `00` (`0x00`): Water $< 25\%$ (Critical low &rarr; Pump turns ON).
  - `01` (`0x01`): Water $25\% \dots 85\%$ (Hysteresis deadband &rarr; Pump retains prior state).
  - `11` (`0x03`): Water $\ge 85\%$ (Tank full &rarr; Pump turns OFF).
  - `10` (`0x02`): Physical fault anomaly (High active while low dry &rarr; Safe shutdown engaged).

---

## 💻 Assembly Firmware Listing

```assembly
; ==========================================
; AQUA8086 Automatic Water Level Controller
; Intel 8086 + 8255 PPI Assembly Program
; ==========================================

; Configure 8255 PPI (Port A=In, Port B=Out)
MOV AL, 90H        ; Byte 0x0000: B0 90 (2 bytes)
MOV DX, 83H        ; Byte 0x0002: BA 83 00 (3 bytes)
OUT DX, AL         ; Byte 0x0005: EE (1 byte)

; Initialize pump state (BL=0: Pump OFF)
MOV BL, 00H        ; Byte 0x0006: B3 00 (2 bytes)

CHECK:
    MOV DX, 80H    ; Byte 0x0008: BA 80 00 (3 bytes)
    IN AL, DX      ; Byte 0x000B: EC (1 byte)

    TEST AL, 02H   ; Byte 0x000C: A8 02 (2 bytes)
    JNZ TANK_FULL  ; Byte 0x000E: 75 0A (2 bytes)

    TEST AL, 01H   ; Byte 0x0010: A8 01 (2 bytes)
    JZ TANK_LOW    ; Byte 0x0012: 74 02 (2 bytes)

    JMP UPDATE     ; Byte 0x0014: EB 06 (2 bytes)

TANK_LOW:
    MOV BL, 01H    ; Byte 0x0016: B3 01 (2 bytes)
    JMP UPDATE     ; Byte 0x0018: EB 02 (2 bytes)

TANK_FULL:
    MOV BL, 00H    ; Byte 0x001A: B3 00 (2 bytes)

UPDATE:
    MOV DX, 81H    ; Byte 0x001C: BA 81 00 (3 bytes)
    MOV AL, BL     ; Byte 0x001F: 8A C3 (2 bytes)
    OUT DX, AL     ; Byte 0x0021: EE (1 byte)

    JMP CHECK      ; Byte 0x0022: EB E4 (2 bytes)
```

---

## 🎓 Educational & Pedagogical Modules

1. **Guided Demonstration Mode (10 Stages)**: Step-by-step walkthrough of the entire initialization, sensing, branch decision, motor output, filling, hysteresis, cutoff, and drainage feedback loop. Includes auto-play with 3s/5s/8s timing.
2. **8086 Internal Architecture Explorer**: Interactive diagram detailing the Bus Interface Unit (BIU) vs. Execution Unit (EU), ALU, 6-byte prefetch queue, registers, flags, instruction decoder, and 20-bit address generation.
3. **8255 Control Word Visualizer**: Interactive 8-bit clickable inspector breaking down each bit of control byte $90\text{H} = 10010000\text{B}$.
4. **Live Signal Flow Diagram**: Real-time animated electrical bus path showing hex and binary byte transfers.
5. **Dynamic Algorithm Flowchart**: Live SVG flowchart highlighting active decision nodes in sync with the CPU Instruction Pointer (`IP`).
6. **Instruction Explainer Panel**: Explains instruction meaning, operands, ALU flags, hardware action, and role in AQUA8086 for every instruction.
7. **Practice & Fault Demonstration**: 5 selectable scenarios: Empty Tank, Half-Filled, Full Tank, Water Consumption, and PA=02H Inconsistency Fault with non-destructive recovery.
8. **Faculty Classroom Presentation Mode**: Distraction-free full-screen layout with 3D viewport, narrative panel, register readouts, and keyboard slide navigation (Left/Right arrows, Space, Esc).

---

## 🛠 Technology Stack

- **Framework**: Next.js 16 (App Router, webpack build)
- **Language**: TypeScript 5 (Strict Mode)
- **UI Library**: React 19
- **Styling**: Tailwind CSS v4 (Engineering dark theme)
- **3D Graphics**: Three.js, React Three Fiber (`@react-three/fiber`), Drei (`@react-three/drei`)
- **Icons**: Lucide React
- **Simulation**: Pure client-side algorithms (Zero external backend/database)
- **Testing**: Automated unit tests via `tsx` runner

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: `v20.x` or higher (tested on `v24.15.0`)
- **npm**: `v10.x` or higher (tested on `v11.6.1`)

### Local Installation

```bash
git clone <repository-url>
cd aqua-8086
npm install
```

### Running Automated Unit Tests

Execute the comprehensive 102-assertion validation test suite:

```bash
npm test
```

### Running Development Server

```bash
npm run dev
```

Navigate to `http://localhost:3000`.

### Production Build

```bash
npm run build
npm start
```

### Type Checking & Linting

```bash
npm run lint
npx tsc --noEmit
```

---

## ☁️ Deployment to Vercel

AQUA8086 is designed to deploy seamlessly to Vercel:

1. Push your repository to GitHub, GitLab, or Bitbucket.
2. In the [Vercel Dashboard](https://vercel.com), click **Add New Project** and import the repository.
3. Framework Preset: **Next.js**.
4. Build Command: `npm run build` (configured with `next build --webpack`).
5. Output Directory: `.next`.
6. Environment Variables: None required (100% client-side simulation).
7. Click **Deploy**.

---

## ⚠️ Known Educational Limitations

1. **Cycle Accuracy**: The virtual 8086 engine is an **instruction-level educational simulator**, not a cycle-accurate or electrical emulator. Bus cycles (T1–T4) and ALE/RD#/WR# strobes are animated for pedagogical clarity.
2. **Instruction Subset**: The engine executes the core 8086 instructions utilized by the water level controller (`MOV`, `IN`, `OUT`, `TEST`, `JZ`, `JNZ`, `JMP`, `NOP`). Arithmetic instructions like `MUL`/`DIV` or interrupt service routines (`INT`) are outside the project's defined scope.
3. **Virtual I/O Addressing**: For student clarity, virtual port addresses `80H`, `81H`, `82H`, and `83H` are utilized. On physical hardware decoded with a 74LS138 demultiplexer, base offsets are typically `00H`–`06H` or `FFF0H`–`FFF6H`.
4. **Fluid Mechanics**: Tank fluid dynamics utilize an idealized volumetric flow model ($\approx 7.5\%/\text{s}$ fill rate, $\approx 4\%/\text{s}$ discharge rate) rather than turbulent Navier-Stokes CFD simulations.

---

## 📄 License

MIT Educational License. Developed for students, university faculty, and embedded systems enthusiasts.
