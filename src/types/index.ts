export interface NavItem {
  id: string;
  label: string;
  href: string;
  badge?: string;
}

export type HardwareComponentType =
  | "cpu"
  | "ppi"
  | "sensor_low"
  | "sensor_high"
  | "driver"
  | "pump"
  | "tank";

export interface HardwareComponent {
  id: HardwareComponentType;
  title: string;
  model: string;
  category: "Processor" | "Interface" | "Sensor" | "Actuator" | "Vessel";
  description: string;
  specifications: { label: string; value: string }[];
  portAssignment?: string;
  logicBehavior: string;
  pinoutPreview?: string[];
  iconName: string;
}

export interface ArchitectureBlock {
  id: string;
  order: number;
  title: string;
  role: string;
  dataDirection: "Input" | "Bidirectional" | "Output" | "Internal";
  interfaceDetails: string;
  voltageLogic: string;
  signalNames: string[];
  description: string;
}

export interface LearningTopic {
  id: string;
  title: string;
  category: string;
  summary: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  keyTakeaways: string[];
  contentExcerpt: string;
  codeSnippet?: string;
}

export interface SystemMetric {
  label: string;
  value: string;
  unit?: string;
  description: string;
}

