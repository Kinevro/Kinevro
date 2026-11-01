import type { VisualEffect } from './VisualEffect';
import type { HandPosition } from './types';

type BoundaryBehaviour = 'bounce' | 'wrap' | 'remove';

type Particle = {
  x: number;
  y: number;
  radius: number;
  color: string;
  speed: number;
  targetDirection: number;
  vx: number;
  vy: number;
};

class ParticleEffect implements VisualEffect{
  private particles: Particle[] = [];

  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;

    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Could not initialize canvas context');
    }

    this.context = context;
  }

  initialize() {
    const numParticles = Math.floor(Math.random() * 50 + 100);

    this.particles = [];

    for (let i = 0; i < numParticles; i++) {
        const speed = Math.random() * 6 + 3;
        const targetDirection = Math.random() * Math.PI * 2;

        this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        radius: Math.random() * 5 + 1,
        color: `hsl(${Math.random() * 360}, 70%, 60%)`,
        speed,
        targetDirection,
        vx: Math.cos(targetDirection) * speed,
        vy: Math.sin(targetDirection) * speed,
        });
    }
    }

  draw() {
    this.particles.forEach((particle) => {
        this.context.beginPath();
        this.context.arc(
        particle.x,
        particle.y,
        particle.radius,
        0,
        Math.PI * 2
        );
        this.context.fillStyle = particle.color;
        this.context.fill();
    });
  }
  private handleBoundary(
    particle: Particle,
    behaviour: BoundaryBehaviour
    ): boolean {
    switch (behaviour) {
        case 'bounce':
        if (particle.x - particle.radius < 0) {
            particle.x = particle.radius;
            particle.vx = -particle.vx;
            particle.targetDirection = Math.PI - particle.targetDirection;
        } else if (particle.x + particle.radius > this.canvas.width) {
            particle.x = this.canvas.width - particle.radius;
            particle.vx = -particle.vx;
            particle.targetDirection = Math.PI - particle.targetDirection;
        }

        if (particle.y - particle.radius < 0) {
            particle.y = particle.radius;
            particle.vy = -particle.vy;
            particle.targetDirection = -particle.targetDirection;
        } else if (particle.y + particle.radius > this.canvas.height) {
            particle.y = this.canvas.height - particle.radius;
            particle.vy = -particle.vy;
            particle.targetDirection = -particle.targetDirection;
        }

        return true;

        case 'wrap':
        if (particle.x - particle.radius > this.canvas.width) {
            particle.x = 0;
        } else if (particle.x + particle.radius < 0) {
            particle.x = this.canvas.width;
        }

        if (particle.y - particle.radius > this.canvas.height) {
            particle.y = 0;
        } else if (particle.y + particle.radius < 0) {
            particle.y = this.canvas.height;
        }

        return true;

        case 'remove':
        return !(
            particle.x + particle.radius < 0 ||
            particle.x - particle.radius > this.canvas.width ||
            particle.y + particle.radius < 0 ||
            particle.y - particle.radius > this.canvas.height
        );
    }
  }
  private applyRepulsion(
  particle: Particle,
  handPositions: HandPosition[],
  frameScale: number,
  interactionRadius: number
) {
  for (const handPosition of handPositions) {
    if (handPosition.gesture !== 'open-palm') continue;

    const handX = handPosition.x * this.canvas.width;
    const handY = handPosition.y * this.canvas.height;

    const dx = handX - particle.x;
    const dy = handY - particle.y;

    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < interactionRadius && distance > 0) {
      const force = (interactionRadius - distance) / interactionRadius;
      const angle = Math.atan2(dy, dx);

      particle.vx -= Math.cos(angle) * force * 5 * frameScale;
      particle.vy -= Math.sin(angle) * force * 5 * frameScale;
    }
  }
}

private applyAttraction(
    particle: Particle,
    handPositions: HandPosition[],
    frameScale: number,
    interactionRadius: number
    ) {
    for (const handPosition of handPositions) {
        if (handPosition.gesture !== 'fist') continue;

        const handX = handPosition.x * this.canvas.width;
        const handY = handPosition.y * this.canvas.height;

        const dx = handX - particle.x;
        const dy = handY - particle.y;

        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < interactionRadius && distance > 0) {
        const force = (interactionRadius - distance) / interactionRadius;
        const angle = Math.atan2(dy, dx);

        particle.vx += Math.cos(angle) * force * 1.25 * frameScale;
        particle.vy += Math.sin(angle) * force * 1.25 * frameScale;
        }
    }
  }

    private applyPinch(
    particle: Particle,
    handPositions: HandPosition[],
    frameScale: number,
    interactionRadius: number
    ) {
    const pinchRadius = interactionRadius / 2;

    for (const handPosition of handPositions) {
        if (handPosition.gesture !== 'pinch') continue;

        const handX = handPosition.x * this.canvas.width;
        const handY = handPosition.y * this.canvas.height;

        const dx = handX - particle.x;
        const dy = handY - particle.y;

        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < pinchRadius && distance > 0) {
        const force = (pinchRadius - distance) / pinchRadius;
        const angle = Math.atan2(dy, dx);

        particle.vx += Math.cos(angle) * force * 10 * frameScale;
        particle.vy += Math.sin(angle) * force * 10 * frameScale;
        }
    }
  }
  private updateParticle(
    particle: Particle,
    handPositions: HandPosition[],
    frameScale: number,
    interactionRadius: number
    ) {
    particle.targetDirection += (Math.random() - 0.5) * 0.40 * frameScale;

    particle.vx +=
        (Math.cos(particle.targetDirection) * particle.speed - particle.vx) *
        0.05 * frameScale;

    particle.vy +=
        (Math.sin(particle.targetDirection) * particle.speed - particle.vy) *
        0.05 * frameScale;

    this.applyRepulsion(
    particle,
    handPositions,
    frameScale,
    interactionRadius
    );

    this.applyAttraction(
    particle,
    handPositions,
    frameScale,
    interactionRadius
    );

    this.applyPinch(
    particle,
    handPositions,
    frameScale,
    interactionRadius
    );
    const currentSpeed = Math.sqrt(
        particle.vx * particle.vx + particle.vy * particle.vy
    );

    const maxSpeed = 12;

    if (currentSpeed > maxSpeed) {
        const speedScale = maxSpeed / currentSpeed;
        particle.vx *= speedScale;
        particle.vy *= speedScale;
    }

    particle.x += particle.vx * frameScale;
    particle.y += particle.vy * frameScale;
  }
  update(
    handPositions: HandPosition[],
    frameScale: number,
    interactionRadius: number,
    boundaryBehaviour: BoundaryBehaviour
    ) {
    this.particles = this.particles.filter((particle) => {
        this.updateParticle(
        particle,
        handPositions,
        frameScale,
        interactionRadius
        );

        return this.handleBoundary(particle, boundaryBehaviour);
    });
  }
  drawHandIndicators(
    handPositions: HandPosition[],
    interactionRadius: number
    ) {
    handPositions.forEach((handPosition) => {
        const handX = handPosition.x * this.canvas.width;
        const handY = handPosition.y * this.canvas.height;

        let indicatorColor = 'grey';
        let indicatorRadius = 8;

        if (handPosition.gesture === 'open-palm') {
        indicatorColor = 'red';
        indicatorRadius = interactionRadius;
        } else if (handPosition.gesture === 'fist') {
        indicatorColor = 'blue';
        indicatorRadius = interactionRadius;
        } else if (handPosition.gesture === 'pinch') {
        indicatorColor = 'purple';
        indicatorRadius = interactionRadius / 2;
        }

        this.context.beginPath();
        this.context.arc(handX, handY, 8, 0, Math.PI * 2);
        this.context.fillStyle = indicatorColor;
        this.context.fill();

        this.context.beginPath();
        this.context.arc(
        handX,
        handY,
        indicatorRadius,
        0,
        Math.PI * 2
        );
        this.context.strokeStyle = indicatorColor;
        this.context.lineWidth = 2;
        this.context.stroke();
    });
  }
  clear() {
    this.context.clearRect(
        0,
        0,
        this.canvas.width,
        this.canvas.height
    );
  }
  resize(width: number, height: number) {
    const currentWidth = this.canvas.width;
    const currentHeight = this.canvas.height;

    const scaleX = currentWidth > 0 ? width / currentWidth : 1;
    const scaleY = currentHeight > 0 ? height / currentHeight : 1;

    this.particles.forEach((particle) => {
        particle.x *= scaleX;
        particle.y *= scaleY;
    });

    this.canvas.width = width;
    this.canvas.height = height;
  }
}

export default ParticleEffect;