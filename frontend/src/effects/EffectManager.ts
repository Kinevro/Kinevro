import type { VisualEffect } from './VisualEffect';
import type { HandPosition } from './types';

class EffectManager {
  private activeEffect: VisualEffect | null = null;

  setEffect(effect: VisualEffect) {
    this.activeEffect?.dispose();

    this.activeEffect = effect;
    this.activeEffect.initialize();
  }

  update(
    handPositions: HandPosition[],
    frameScale: number,
    interactionRadius: number,
    boundaryBehaviour: 'bounce' | 'wrap' | 'remove'
  ) {
    this.activeEffect?.update(
      handPositions,
      frameScale,
      interactionRadius,
      boundaryBehaviour
    );
  }

  draw() {
    this.activeEffect?.draw();
  }

  resize(width: number, height: number) {
    this.activeEffect?.resize(width, height);
  }
  clear() {
    this.activeEffect?.clear();
  }

  drawHandIndicators(
    handPositions: HandPosition[],
    interactionRadius: number
  ) {
    this.activeEffect?.drawHandIndicators(
      handPositions,
      interactionRadius
    );
  }
  dispose() {
    this.activeEffect?.dispose();
    this.activeEffect = null;
  }
}

export default EffectManager;