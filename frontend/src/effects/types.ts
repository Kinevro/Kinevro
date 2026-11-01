export type Gesture =
  | 'open-palm'
  | 'fist'
  | 'pinch'
  | 'unknown';

export type HandPosition = {
  x: number;
  y: number;
  gesture: Gesture;
};