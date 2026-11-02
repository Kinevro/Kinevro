export type Gesture =
  | 'open-palm'
  | 'fist'
  | 'pinch'
  | 'unknown';

export type FingerPosition = {
  baseX: number;
  baseY: number;
  tipX: number;
  tipY: number;
};

export type HandPosition = {
  x: number;
  y: number;
  wristX: number;
  wristY: number;
  fingers: FingerPosition[];
  gesture: Gesture;
};