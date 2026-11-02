import type { VisualEffect } from './VisualEffect';
import type { Gesture, HandPosition } from './types';

type LightningPoint = {
    x: number;
    y: number;
};

type LightningBolt = {
    points: LightningPoint[];
    alpha: number;
    width: number;
};

type LightningBall = {
    x: number;
    y: number;
    radius: number;
    charge: number;
};

type LightningShockwave = {
    x: number;
    y: number;
    radius: number;
    alpha: number;
};

class ForceLightningEffect implements VisualEffect {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private bolts: LightningBolt[] = [];
    private animationTime = 0;
    
    private lightningBalls: Map<number, LightningBall> = new Map();
    private shockwaves: LightningShockwave[] = [];
    private previousGestures: Map<number, Gesture> = new Map();

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;

        const context = canvas.getContext('2d');

        if (!context) {
            throw new Error('Could not initialize canvas context');
        }

        this.ctx = context;
    }
    private generateBolt(
        start: LightningPoint,
        end: LightningPoint,
        convergencePoint?: LightningPoint
    ): LightningBolt {
        const points: LightningPoint[] = [];

        const segments = 16;
        const displacement = 18;

        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const distance = Math.hypot(dx, dy);

        if (distance === 0) {
            return {
                points: [start, end],
                alpha: 1,
                width: 3,
            };
        }

        const perpendicularX = -dy / distance;
        const perpendicularY = dx / distance;

        const curveStrength = convergencePoint ? 0.25 : 0.08;

        for (let i = 0; i <= segments; i++) {
            const progress = i / segments;

            const curveOffset = convergencePoint
                ? Math.sin(progress * Math.PI) * curveStrength * distance
                : Math.sin(progress * Math.PI) * curveStrength * distance;

            const randomOffset =
                i === 0 || i === segments
                    ? 0
                    : (Math.random() - 0.5) * displacement * 2;

            points.push({
                x:
                    start.x +
                    dx * progress +
                    perpendicularX * (curveOffset + randomOffset),

                y:
                    start.y +
                    dy * progress +
                    perpendicularY * (curveOffset + randomOffset),
            });
        }

        return {
            points,
            alpha: 1,
            width: 3,
        };
    }
    private generateBranches(bolt: LightningBolt): LightningBolt[] {
        const branches: LightningBolt[] = [];

        for (let i = 2; i < bolt.points.length - 2; i += 3) {
            if (Math.random() > 0.5) {
                continue;
            }

            const start = bolt.points[i];

            const direction = Math.random() > 0.5 ? 1 : -1;
            const length = 30 + Math.random() * 50;

            const end: LightningPoint = {
                x: start.x + direction * length,
                y: start.y + (Math.random() - 0.5) * length,
            };

            const branch = this.generateBolt(start, end);

            branch.alpha = 0.7;
            branch.width = 1.5;

            branches.push(branch);
        }

        return branches;
    }
    private generateShockwaveBranches(
        shockwave: LightningShockwave
    ): LightningBolt[] {
        const branches: LightningBolt[] = [];
        const branchCount = 12;

        for (let i = 0; i < branchCount; i++) {
            const angle = Math.random() * Math.PI * 2;

            const startDistance = shockwave.radius;
            const branchLength = 15 + Math.random() * 35;

            const start: LightningPoint = {
                x: shockwave.x + Math.cos(angle) * startDistance,
                y: shockwave.y + Math.sin(angle) * startDistance,
            };

            const end: LightningPoint = {
                x: start.x + Math.cos(angle) * branchLength,
                y: start.y + Math.sin(angle) * branchLength,
            };

            const branch = this.generateBolt(start, end);

            branch.alpha = shockwave.alpha;
            branch.width = 1.5;

            branches.push(branch);
        }

        return branches;
    }
    draw(): void {
        const ctx = this.ctx;

        for (const bolt of this.bolts) {
            if (bolt.points.length < 2) continue;

            ctx.save();

            ctx.globalAlpha = bolt.alpha;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            // Outer glow
            ctx.shadowColor = '#00bfff';
            ctx.shadowBlur = 20;

            ctx.strokeStyle = '#0088ff';
            ctx.lineWidth = bolt.width * 3;

            ctx.beginPath();
            ctx.moveTo(bolt.points[0].x, bolt.points[0].y);

            for (let i = 1; i < bolt.points.length; i++) {
                ctx.lineTo(bolt.points[i].x, bolt.points[i].y);
            }

            ctx.stroke();

            // Bright inner core
            ctx.shadowBlur = 8;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = bolt.width;

            ctx.beginPath();
            ctx.moveTo(bolt.points[0].x, bolt.points[0].y);

            for (let i = 1; i < bolt.points.length; i++) {
                ctx.lineTo(bolt.points[i].x, bolt.points[i].y);
            }

            ctx.stroke();

            ctx.restore();
        }
        for (const ball of this.lightningBalls.values()) {
            const pulse = Math.sin(this.animationTime * 0.3) * 0.15 + 1;

            ctx.save();

            ctx.globalAlpha = 0.8;
            ctx.shadowColor = '#00bfff';
            ctx.shadowBlur = 30 * pulse;

            const gradient = ctx.createRadialGradient(
                ball.x,
                ball.y,
                0,
                ball.x,
                ball.y,
                ball.radius * pulse
            );

            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(0.3, '#8beaff');
            gradient.addColorStop(0.7, '#0088ff');
            gradient.addColorStop(1, 'rgba(0, 80, 255, 0)');

            ctx.beginPath();
            ctx.arc(
                ball.x,
                ball.y,
                ball.radius * pulse,
                0,
                Math.PI * 2
            );

            ctx.fillStyle = gradient;
            ctx.fill();

            ctx.restore();
        }
        for (const shockwave of this.shockwaves) {
            const arcCount = 4;
            const segments = 40;

            for (let arc = 0; arc < arcCount; arc++) {
                const startAngle = (Math.PI * 2 * arc) / arcCount;
                const arcLength = Math.PI * 0.65;

                this.ctx.beginPath();

                for (let i = 0; i <= segments; i++) {
                    const progress = i / segments;
                    const angle = startAngle + progress * arcLength;

                    // Randomly distort the ring to create an electrical shape.
                    const distortion = (Math.random() - 0.5) * 12;
                    const radius = shockwave.radius + distortion;

                    const x = shockwave.x + Math.cos(angle) * radius;
                    const y = shockwave.y + Math.sin(angle) * radius;

                    if (i === 0) {
                        this.ctx.moveTo(x, y);
                    } else {
                        this.ctx.lineTo(x, y);
                    }
                }

                // Blue outer glow.
                this.ctx.strokeStyle = `rgba(50, 160, 255, ${shockwave.alpha * 0.5})`;
                this.ctx.lineWidth = 7;
                this.ctx.shadowBlur = 18;
                this.ctx.shadowColor = '#168bff';
                this.ctx.stroke();

                // Bright inner electrical line.
                this.ctx.strokeStyle = `rgba(210, 245, 255, ${shockwave.alpha})`;
                this.ctx.lineWidth = 2;
                this.ctx.shadowBlur = 10;
                this.ctx.stroke();
            }
            const branches = this.generateShockwaveBranches(shockwave);

            for (const branch of branches) {
                this.ctx.beginPath();

                branch.points.forEach((point, index) => {
                    if (index === 0) {
                        this.ctx.moveTo(point.x, point.y);
                    } else {
                        this.ctx.lineTo(point.x, point.y);
                    }
                });

                this.ctx.strokeStyle = `rgba(180, 230, 255, ${branch.alpha})`;
                this.ctx.lineWidth = branch.width;
                this.ctx.shadowBlur = 12;
                this.ctx.shadowColor = '#168bff';
                this.ctx.stroke();
            }
        }
        this.ctx.shadowBlur = 0;
    }
    initialize(): void {
        this.bolts = [];
        this.lightningBalls.clear();
        this.shockwaves = [];
        this.previousGestures.clear();
        this.animationTime = 0;
    }

    update(
        handPositions: HandPosition[],
        frameScale: number,
        interactionRadius: number,
        boundaryBehaviour: 'bounce' | 'wrap' | 'remove'
    ): void {
        this.animationTime += frameScale;
        this.bolts = [];

        for (const shockwave of this.shockwaves) {
            shockwave.radius += 14 * frameScale;
            shockwave.alpha -= 0.025 * frameScale;
        }

        this.shockwaves = this.shockwaves.filter(
            (shockwave) => shockwave.alpha > 0
        );

        const activeFistHands = new Set<number>();

        handPositions.forEach((hand, handIndex) => {
            if (hand.gesture === 'fist') {
                activeFistHands.add(handIndex);

                const handX = hand.x * this.canvas.width;
                const handY = hand.y * this.canvas.height;

                let lightningBall = this.lightningBalls.get(handIndex);

                if (!lightningBall) {
                    lightningBall = {
                        x: handX,
                        y: handY,
                        radius: 15,
                        charge: 0,
                    };

                    this.lightningBalls.set(handIndex, lightningBall);
                }

                lightningBall.x = handX;
                lightningBall.y = handY;

                lightningBall.charge = Math.min(
                    lightningBall.charge + frameScale,
                    120
                );

                lightningBall.radius = 15 + lightningBall.charge * 0.2;
            }
        });
        // Detect when a fist is released.
        for (const [handIndex, previousGesture] of this.previousGestures) {
            if (previousGesture === 'fist' && !activeFistHands.has(handIndex)) {
                const ball = this.lightningBalls.get(handIndex);

                if (ball) {
                    this.shockwaves.push({
                        x: ball.x,
                        y: ball.y,
                        radius: ball.radius,
                        alpha: 1,
                    });

                    this.lightningBalls.delete(handIndex);
                }
            }
        }

        // Store the current gestures for the next frame.
        this.previousGestures.clear();

        handPositions.forEach((hand, handIndex) => {
            this.previousGestures.set(handIndex, hand.gesture);
        });
        const openHands = handPositions.filter(
            (hand) => hand.gesture === 'open-palm'
        );

        const pinchingHands = handPositions.filter(
            (hand) => hand.gesture === 'pinch'
        );

        if (openHands.length === 0 && pinchingHands.length === 0) return;

        // Calculate the convergence point when two hands are open.
        let convergencePoint: LightningPoint | null = null;
        let convergenceRadius = 0;

        if (openHands.length >= 2) {
            const handA = openHands[0];
            const handB = openHands[1];

            const handAX = handA.x * this.canvas.width;
            const handAY = handA.y * this.canvas.height;
            const handBX = handB.x * this.canvas.width;
            const handBY = handB.y * this.canvas.height;

            convergencePoint = {
                x: (handAX + handBX) / 2,
                y: (handAY + handBY) / 2,
            };

            convergenceRadius = Math.hypot(
                handBX - handAX,
                handBY - handAY
            ) / 2;
        }

        for (const hand of openHands) {
            for (const finger of hand.fingers) {
                const base: LightningPoint = {
                    x: finger.baseX * this.canvas.width,
                    y: finger.baseY * this.canvas.height,
                };

                const tip: LightningPoint = {
                    x: finger.tipX * this.canvas.width,
                    y: finger.tipY * this.canvas.height,
                };

                const directionX = tip.x - base.x;
                const directionY = tip.y - base.y;

                const directionLength = Math.hypot(
                    directionX,
                    directionY
                );

                if (directionLength === 0) continue;

                const normalizedX = directionX / directionLength;
                const normalizedY = directionY / directionLength;

                const lightningLength = Math.max(
                    this.canvas.width,
                    this.canvas.height
                );

                const target: LightningPoint = convergencePoint
                    ? convergencePoint
                    : {
                        x: tip.x + normalizedX * lightningLength,
                        y: tip.y + normalizedY * lightningLength,
                    };

                const mainBolt = this.generateBolt(tip, target);

                this.bolts.push(mainBolt);
                this.bolts.push(...this.generateBranches(mainBolt));
            }
        }

        for (const hand of pinchingHands) {
            const start: LightningPoint = {
                x: hand.x * this.canvas.width,
                y: hand.y * this.canvas.height,
            };

            const wrist: LightningPoint = {
                x: hand.wristX * this.canvas.width,
                y: hand.wristY * this.canvas.height,
            };

            const directionX = start.x - wrist.x;
            const directionY = start.y - wrist.y;
            const directionLength = Math.hypot(directionX, directionY);

            if (directionLength === 0) continue;

            const normalizedX = directionX / directionLength;
            const normalizedY = directionY / directionLength;

            const target: LightningPoint = {
                x: start.x + normalizedX * Math.max(
                    this.canvas.width,
                    this.canvas.height
                ),
                y: start.y + normalizedY * Math.max(
                    this.canvas.width,
                    this.canvas.height
                ),
            };

            const bolt = this.generateBolt(start, target);
            this.bolts.push(bolt);
            this.bolts.push(...this.generateBranches(bolt));
        }

        void interactionRadius;
        void boundaryBehaviour;
        void convergenceRadius;
    }

    resize(width: number, height: number): void {
        this.canvas.width = width;
        this.canvas.height = height;
    }

    clear(): void {
        this.ctx.clearRect(
            0,
            0,
            this.canvas.width,
            this.canvas.height
        );
    }

    drawHandIndicators(
        handPositions: HandPosition[],
        interactionRadius: number
    ): void {
        const ctx = this.ctx;

        for (const hand of handPositions) {
            const handX = hand.x * this.canvas.width;
            const handY = hand.y * this.canvas.height;

            ctx.beginPath();
            ctx.arc(handX, handY, interactionRadius, 0, Math.PI * 2);

            if (hand.gesture === 'open-palm') {
                ctx.strokeStyle = 'rgba(0, 191, 255, 0.35)';
            } else if (hand.gesture === 'fist') {
                ctx.strokeStyle = 'rgba(100, 100, 255, 0.35)';
            } else if (hand.gesture === 'pinch') {
                ctx.strokeStyle = 'rgba(180, 80, 255, 0.35)';
            } else {
                continue;
            }

            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }

    dispose(): void {
        this.bolts = [];
        this.lightningBalls.clear();
        this.shockwaves = [];
        this.previousGestures.clear();
        this.animationTime = 0;
    }
}

export default ForceLightningEffect;