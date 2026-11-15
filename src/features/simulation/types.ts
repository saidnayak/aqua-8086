export interface SimulationViewportState {
  cameraMode: "perspective" | "orthographic";
  zoomLevel: number;
  rotationSpeed: number;
  showLabels: boolean;
  showWireframe: boolean;
  highlightedComponentId: string | null;
}

export interface ReservoirPhysics {
  currentVolumeLiters: number;
  maxVolumeLiters: number;
  inflowRateLps: number;
  outflowRateLps: number;
  waterHeightMm: number;
  maxHeightMm: number;
}

