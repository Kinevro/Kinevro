import type { VisualEffect } from './VisualEffect';
import type { HandPosition } from './types';

type Ball = {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    mass: number;
    color: string;
}

const BALL_COUNT = 180;
const BALL_RESTITUTION = 0.75;
const GRAVITY = 0.35;
const BALL_MIN_RADIUS = 14;
const BALL_MAX_RADIUS = 28;
const HAND_PUSH_STRENGTH = 3.0;
const HAND_PULL_STRENGTH = 2.0;
const PINCH_SELECTION_RADIUS = 100;
const PINCH_RELEASE_DELAY = 150;

class BallpitEffect implements VisualEffect {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private balls: Ball[] = [];

    private grabbedBalls = new Map<number, {
        ball: Ball;
        lastPosition: { x: number; y: number } | null;
        lostTime: number;
    }>();

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        const context = canvas.getContext('2d');
        if (!context) {
            throw new Error('Could not initialize canvas context');
        }
        this.ctx = context;
    }

    initialize(): void {
        this.balls = [];
        for (let i = 0; i < BALL_COUNT; i++) {
            const radius = BALL_MIN_RADIUS + Math.random() * (BALL_MAX_RADIUS - BALL_MIN_RADIUS);
            const mass = Math.PI * radius ** 2;
            const hue = Math.random() * 360;
            const color = `hsl(${hue}, 85%, 60%)`;
            this.balls.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: 0,
                vy: 0,
                radius,
                mass,
                color,
            });
        }
    }

    update(
        handPositions: HandPosition[],
        frameScale: number,
        interactionRadius:
        number, boundaryBehaviour: 'bounce' | 'wrap' | 'remove'
    ): void {
        const scaledHandPositions = handPositions.map((hand) => ({
            ...hand,
            x: hand.x * this.canvas.width,
            y: hand.y * this.canvas.height,
        }));
        const activePinchHands = new Set<number>();

        scaledHandPositions.forEach((hand, handIndex) => {
            if (hand.gesture !== 'pinch') {
                return;
            }

            activePinchHands.add(handIndex);

            let grabState = this.grabbedBalls.get(handIndex);

            if (!grabState) {
                let closestDistance = PINCH_SELECTION_RADIUS;
                let closestBall: Ball | null = null;

                const alreadyGrabbed = new Set(
                    Array.from(this.grabbedBalls.values()).map(
                        (state) => state.ball
                    )
                );

                for (const ball of this.balls) {
                    if (alreadyGrabbed.has(ball)) continue;

                    const dx = ball.x - hand.x;
                    const dy = ball.y - hand.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < closestDistance) {
                        closestDistance = distance;
                        closestBall = ball;
                    }
                }

                if (closestBall) {
                    grabState = {
                        ball: closestBall,
                        lastPosition: null,
                        lostTime: 0,
                    };

                    this.grabbedBalls.set(handIndex, grabState);
                }
            }

            if (!grabState) return;

            grabState.lostTime = 0;

            if (grabState.lastPosition) {
                const safeFrameScale = Math.max(frameScale, 0.1);

                grabState.ball.vx =
                    (hand.x - grabState.lastPosition.x) / safeFrameScale;

                grabState.ball.vy =
                    (hand.y - grabState.lastPosition.y) / safeFrameScale;
            } else {
                grabState.ball.vx = 0;
                grabState.ball.vy = 0;
            }

            grabState.ball.x = hand.x;
            grabState.ball.y = hand.y;

            grabState.lastPosition = {
                x: hand.x,
                y: hand.y,
            };
        });

        for (const [handIndex, grabState] of this.grabbedBalls) {
            if (activePinchHands.has(handIndex)) continue;

            grabState.lostTime += frameScale * (1000 / 60);

            if (grabState.lostTime >= PINCH_RELEASE_DELAY) {
                this.grabbedBalls.delete(handIndex);
            }
        }

        for (let i = this.balls.length - 1; i >= 0; i--) {
            const ball = this.balls[i];
            if (
                Array.from(this.grabbedBalls.values()).some(
                    (state) => state.ball === ball
                )
            ) {
                continue;
            }
            for (const hand of scaledHandPositions) {
                if (hand.gesture !== 'open-palm' && hand.gesture !== 'fist') {
                    continue;
                }

                const dx = ball.x - hand.x;
                const dy = ball.y - hand.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance === 0 || distance > interactionRadius) {
                    continue;
                }

                const falloff = 1 - distance / interactionRadius;

                const strength = hand.gesture === 'open-palm'
                    ? HAND_PUSH_STRENGTH
                    : -HAND_PULL_STRENGTH;

                ball.vx += (dx / distance) * strength * falloff * frameScale;
                ball.vy += (dy / distance) * strength * falloff * frameScale;
            }
            ball.vy += GRAVITY * frameScale;

            ball.x += ball.vx * frameScale;
            ball.y += ball.vy * frameScale;

            if (!this.handleBoundaries(ball, boundaryBehaviour)) {
                this.balls.splice(i, 1);
            }
        }
        for (let i = 0; i < this.balls.length; i++) {
            for (let j = i + 1; j < this.balls.length; j++) {
                const ballA = this.balls[i];
                const ballB = this.balls[j];

                if (
                    Array.from(this.grabbedBalls.values()).some(
                        (state) => state.ball === ballA || state.ball === ballB
                    )
                ) {
                    continue;
                }

                this.resolveCollision(ballA, ballB);
            }
        }
    }

    private handleBoundaries(ball: Ball,
        boundaryBehaviour: 'bounce' | 'wrap' | 'remove'
    ): boolean {
        const width = this.canvas.width;
        const height = this.canvas.height;
        if (boundaryBehaviour === 'bounce') {
            if (ball.x - ball.radius < 0) {
                ball.x = ball.radius;
                ball.vx = Math.abs(ball.vx) * BALL_RESTITUTION;
            }
            if (ball.x + ball.radius > width) {
                ball.x = width - ball.radius;
                ball.vx = -Math.abs(ball.vx) * BALL_RESTITUTION;
            }
            if (ball.y - ball.radius < 0) {
                ball.y = ball.radius;
                ball.vy = Math.abs(ball.vy) * BALL_RESTITUTION;
            }
            if (ball.y + ball.radius > height) {
                ball.y = height - ball.radius;
                ball.vy = -Math.abs(ball.vy) * BALL_RESTITUTION;
            }
        }
        if (boundaryBehaviour === 'wrap') {
            if (ball.x - ball.radius > width) {
                ball.x = -ball.radius;
            }
            if (ball.x + ball.radius < 0) {
                ball.x = width + ball.radius;
            }
            if (ball.y - ball.radius > height) {
                ball.y = -ball.radius;
            }
            if (ball.y + ball.radius < 0) {
                ball.y = height + ball.radius;
            }
        }
        if (boundaryBehaviour === 'remove') {
            return !(
                ball.x + ball.radius < 0 ||
                ball.x - ball.radius > width ||
                ball.y + ball.radius < 0 ||
                ball.y - ball.radius > height
            );
        }
        return true;
    }
    private resolveCollision(ballA: Ball, ballB: Ball): void {
        const dx = ballB.x - ballA.x;
        const dy = ballB.y - ballA.y;
        
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDistance = ballA.radius + ballB.radius;

        if (distance >= minDistance) {
            return;
        }

        const normalX = distance > 0 ? dx / distance : 1;
        const normalY = distance > 0 ? dy / distance : 0;

        const overlap = minDistance - distance;
        
        const inverseMassA = 1 / ballA.mass;
        const inverseMassB = 1 / ballB.mass;

        const inverseMassSum = inverseMassA + inverseMassB;

        const separationX = normalX * overlap * inverseMassA / inverseMassSum;
        const separationY = normalY * overlap * inverseMassA / inverseMassSum;

        ballA.x -= separationX;
        ballA.y -= separationY;

        ballB.x += normalX * overlap * inverseMassB / inverseMassSum;
        ballB.y += normalY * overlap * inverseMassB / inverseMassSum;

        const relativeVelocityX = ballB.vx - ballA.vx;
        const relativeVelocityY = ballB.vy - ballA.vy;

        const velocityAlongNormal = relativeVelocityX * normalX + relativeVelocityY * normalY;

        if (velocityAlongNormal > 0) {
            return;
        }

        const impulseMagnitude =
        -(1 + BALL_RESTITUTION) * velocityAlongNormal /
        (inverseMassA + inverseMassB);

        const impulseX = impulseMagnitude * normalX;
        const impulseY = impulseMagnitude * normalY;

        ballA.vx -= impulseX * inverseMassA;
        ballA.vy -= impulseY * inverseMassA;

        ballB.vx += impulseX * inverseMassB;
        ballB.vy += impulseY * inverseMassB;
    }
    draw(): void {
        const ctx = this.ctx;

        for (const ball of this.balls) {
            ctx.save();

            ctx.shadowColor = ball.color;
            ctx.shadowBlur = 12;

            const gradient = ctx.createRadialGradient(
                ball.x - ball.radius * 0.35,
                ball.y - ball.radius * 0.35,
                ball.radius * 0.05,
                ball.x,
                ball.y,
                ball.radius
            );

            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(0.25, ball.color);
            gradient.addColorStop(1, '#222222');

            ctx.beginPath();
            ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();

            ctx.shadowBlur = 0;
            ctx.beginPath();
            ctx.ellipse(
                ball.x - ball.radius * 0.3,
                ball.y - ball.radius * 0.35,
                ball.radius * 0.2,
                ball.radius * 0.12,
                -Math.PI / 4,
                0,
                Math.PI * 2
            );
            ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
            ctx.fill();

            ctx.restore();
        }
    }
    clear(): void {
        this.ctx.clearRect(
            0,
            0,
            this.canvas.width,
            this.canvas.height
        );
    }
    resize(width: number, height: number): void {
        this.canvas.width = width;
        this.canvas.height = height;
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
                ctx.strokeStyle = 'rgba(255, 80, 80, 0.35)';
            } else if (hand.gesture === 'fist') {
                ctx.strokeStyle = 'rgba(80, 150, 255, 0.35)';
            } else if (hand.gesture === 'pinch') {
                ctx.strokeStyle = 'rgba(180, 80, 255, 0.35)';
            } else {
                continue;
            }

            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(handX, handY, 6, 0, Math.PI * 2);
            ctx.fillStyle = ctx.strokeStyle;
            ctx.fill();
        }
    }
    dispose(): void {
        this.balls = [];
        this.grabbedBalls.clear();
    }
}

export default BallpitEffect;