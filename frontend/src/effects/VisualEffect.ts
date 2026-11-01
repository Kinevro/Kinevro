import type { HandPosition } from './types';

export interface VisualEffect {
  initialize(): void;

  update(
    handPositions: HandPosition[],
    frameScale: number,
    interactionRadius: number,
    boundaryBehaviour: 'bounce' | 'wrap' | 'remove'
  ): void;

  draw(): void;

  dispose(): void;

  clear(): void;

  drawHandIndicators(
    handPositions: HandPosition[],
    interactionRadius: number
  ): void;

  resize(width: number, height: number): void;
}