import type { EffectType } from './effectTypes';
import type { VisualEffect } from './VisualEffect';
import type { HandPosition } from './types';

class EffectManager {
  private activeEffect: VisualEffect | null = null;
  private effects = new Map<EffectType, VisualEffect>();

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
  registerEffect(type: EffectType, effect: VisualEffect) {
    this.effects.set(type, effect);
  }
  setActiveEffect(type: EffectType) {
    const effect = this.effects.get(type);

    if (!effect) {
      console.error(`Effect "${type}" is not registered.`);
      return;
    }

    if (this.activeEffect === effect) {
      return;
    }

    this.activeEffect?.dispose();
    this.activeEffect = effect;
    this.activeEffect.initialize();
  }
  getActiveEffectType(): EffectType | null {
    for (const [type, effect] of this.effects) {
      if (effect === this.activeEffect) {
        return type;
      }
    }

    return null;
  }
}

export default EffectManager;