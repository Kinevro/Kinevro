import HandTracker from "./HandTracker.tsx";
import './App.css'
import CustomSelect from "./CustomSelect.tsx";
import {useEffect, useRef, useState, useCallback} from "react";

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

type BoundaryBehaviour = 'bounce' | 'wrap' | 'remove';
type MouseBehaviour = 'repel' | 'attract' | 'none';
type InteractionInput = {
  x: number;
  y: number;
  active: boolean;
};

type Gesture = 'open-palm' | 'fist' | 'pinch' | 'unknown';

type HandPosition = {
  x: number;
  y: number;
  gesture: Gesture;
}

function App() {
  const handleHandPosition = useCallback((positions: HandPosition[]) => {
    handPositionRef.current = positions;
  }, []);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [interactionInputBehaviour, setInteractionInputBehaviour] = useState<MouseBehaviour>('repel');
  const [boundaryBehaviour, setBoundaryBehaviour] = useState<BoundaryBehaviour>('bounce');
  const boundaryBehaviourRef = useRef<BoundaryBehaviour>('bounce');
  const interactionInputBehaviourRef = useRef<MouseBehaviour>('repel');
  const handPositionRef = useRef<HandPosition[]>([]);
  
useEffect(() => {
  boundaryBehaviourRef.current = boundaryBehaviour;
  interactionInputBehaviourRef.current = interactionInputBehaviour;
}, [boundaryBehaviour, interactionInputBehaviour]);
useEffect(() => {
  const canvas = canvasRef.current
  const stage = canvas?.parentElement

  if (!canvas || !stage) return
  const canvasElement = canvas
  const stageElement = stage
  const context = canvas.getContext('2d')
  if (!context) return
  const drawingContext = context
  
  let animationFrameId: number = 0;
  let lastTimestamp: number = 0;
  
  const maxSpeed = 12;

  const interactionInput: InteractionInput = {
    x: 0,
    y: 0,
    active: false,
  };

  function handleMouseMove(event: MouseEvent) {
    const rect = canvasElement.getBoundingClientRect();
    interactionInput.x = event.clientX - rect.left;
    interactionInput.y = event.clientY - rect.top;
    setMousePosition({
      x: Math.round(interactionInput.x),
      y: Math.round(interactionInput.y)
    });
  }
  
  function resizeCanvas() {
    let scaleX = 1
    let scaleY = 1
    const currentWidth = canvasElement.width
    const currentHeight = canvasElement.height
    const width = stageElement.clientWidth
    const height = stageElement.clientHeight
    if (currentWidth !== 0 && currentHeight !== 0) {
      scaleX = width / currentWidth
      scaleY = height / currentHeight
    }
    for (const particle of particles) {
      particle.x *= scaleX
      particle.y *= scaleY
    }
    if (canvasElement.width !== width) {
      canvasElement.width = width
    }
    if (canvasElement.height !== height) {
      canvasElement.height = height
    }
    if (animationFrameId === 0) {
      animationFrameId = requestAnimationFrame(draw)
    }
  }
  let particles: Particle[] = []
  function createParticles() {
    const numParticles = Math.floor(Math.random() * 50 + 100)
    particles = []
    for (let i = 0; i < numParticles; i++) {
      const speed = Math.random() * 6 + 3
      const targetDirection = Math.random() * Math.PI * 2
      particles.push({
        x: Math.random() * canvasElement.width,
        y: Math.random() * canvasElement.height,
        radius: Math.random() * 5 + 1,
        color: `hsl(${Math.random() * 360}, 70%, 60%)`,
        speed: speed,
        targetDirection: targetDirection,
        vx: Math.cos(targetDirection) * speed,
        vy: Math.sin(targetDirection) * speed,
      })
    }
  }

  function handleBoundary(particle: Particle): boolean {
    switch (boundaryBehaviourRef.current) {
      case 'bounce':
        if (particle.x - particle.radius < 0) {
          particle.x = particle.radius;
          particle.vx = -particle.vx;
          particle.targetDirection = Math.PI - particle.targetDirection;
        } else if (particle.x + particle.radius > canvasElement.width) {
          particle.x = canvasElement.width - particle.radius;
          particle.vx = -particle.vx;
          particle.targetDirection = Math.PI - particle.targetDirection;
        }
        if (particle.y - particle.radius < 0) {
          particle.y = particle.radius;
          particle.vy = -particle.vy;
          particle.targetDirection = -particle.targetDirection;
        } else if (particle.y + particle.radius > canvasElement.height) {
          particle.y = canvasElement.height - particle.radius;
          particle.vy = -particle.vy;
          particle.targetDirection = -particle.targetDirection;
        }
        return true;
      case 'wrap':
        if (particle.x - particle.radius > canvasElement.width) {
          particle.x = 0;
        } else if (particle.x + particle.radius < 0) {
          particle.x = canvasElement.width;
        }
        if (particle.y - particle.radius > canvasElement.height) {
          particle.y = 0;
        } else if (particle.y + particle.radius < 0) {
          particle.y = canvasElement.height;
        }
        return true;
      case 'remove':
        if (
          particle.x + particle.radius < 0 ||
          particle.x - particle.radius > canvasElement.width ||
          particle.y + particle.radius < 0 ||
          particle.y - particle.radius > canvasElement.height
        ) {
          return false;
        }
      return true;
    }
  }
  function applyRepulsion(particle: Particle, frameScale: number, interactionRadius: number) {
    for(const handPosition of handPositionRef.current){
      if(handPosition.gesture !== 'open-palm')continue;
      const handX = handPosition.x * canvasElement.width;
      const handY = handPosition.y * canvasElement.height;

      const dx = handX - particle.x;
      const dy = handY - particle.y;

      const distance = Math.sqrt(dx * dx + dy * dy)
      if (distance < interactionRadius && distance > 0) {
        const force = (interactionRadius - distance) / interactionRadius
        const angle = Math.atan2(dy, dx)
        particle.vx -= Math.cos(angle) * force * 5 * frameScale
        particle.vy -= Math.sin(angle) * force * 5 * frameScale
      }
    }
  }
  function applyAttraction(
    particle: Particle,
    frameScale: number,
    interactionRadius: number
  ) {
    for (const handPosition of handPositionRef.current) {
      if(handPosition.gesture !== 'fist')continue;

      const handX = handPosition.x * canvasElement.width;
      const handY = handPosition.y * canvasElement.height;

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
  function applyPinch(
    particle: Particle,
    frameScale: number,
    interactionRadius: number
  ) {
    const pinchRadius = interactionRadius / 2;
    for (const handPosition of handPositionRef.current) {
      if (handPosition.gesture !== 'pinch') continue;

      const handX = handPosition.x * canvasElement.width;
      const handY = handPosition.y * canvasElement.height;

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
  function updateParticles(particle: Particle, frameScale: number, interactionRadius: number) {
    particle.targetDirection += (Math.random() - 0.5) * 0.40 * frameScale;
    particle.vx += (Math.cos(particle.targetDirection) * particle.speed - particle.vx) * 0.05 * frameScale;
    particle.vy += (Math.sin(particle.targetDirection) * particle.speed - particle.vy) * 0.05 * frameScale;
    applyRepulsion(particle, frameScale, interactionRadius);
    applyAttraction(particle, frameScale, interactionRadius);
    applyPinch(particle, frameScale, interactionRadius);
    const currentSpeed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
    if (currentSpeed > maxSpeed) {
      const speedScale = maxSpeed / currentSpeed;
      particle.vx *= speedScale;
      particle.vy *= speedScale;
    }
    particle.x += particle.vx * frameScale
    particle.y += particle.vy * frameScale

  }

  function drawHandIndicators() {
    handPositionRef.current.forEach(handPosition => {
      const handX = handPosition.x * canvasElement.width;
      const handY = handPosition.y * canvasElement.height;

      let indicatorColor = 'grey';

      if (handPosition.gesture === 'open-palm') {
        indicatorColor = 'red';
      } else if (handPosition.gesture === 'fist') {
        indicatorColor = 'blue';
      } else if (handPosition.gesture === 'pinch') {
        indicatorColor = 'purple';
      }

      drawingContext.beginPath();
      drawingContext.arc(handX, handY, 8, 0, Math.PI * 2);
      drawingContext.fillStyle = indicatorColor;
      drawingContext.fill();

      drawingContext.beginPath();
      drawingContext.arc(handX, handY, 15, 0, Math.PI * 2);
      drawingContext.strokeStyle = indicatorColor;
      drawingContext.lineWidth = 2;
      drawingContext.stroke();
    });
  }

  function draw(timestamp: number = 0) {
    animationFrameId = 0
    let deltaTime: number
    if (lastTimestamp > 0) {
      deltaTime = Math.min((timestamp - lastTimestamp) / 1000, 0.05)
    }
    else {
      deltaTime = 0
    }
    const frameScale = deltaTime * 60;
    

    drawingContext.clearRect(0, 0, canvasElement.width, canvasElement.height)
    lastTimestamp = timestamp
    
    const interactionRadius = 0.33 * Math.min(
      canvasElement.width,
      canvasElement.height
    );

    particles = particles.filter(particle => {
      updateParticles(particle, frameScale, interactionRadius)
      return handleBoundary(particle)
    })

    particles.forEach(particle => {
      drawingContext.beginPath()
      drawingContext.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2)
      drawingContext.fillStyle = particle.color
      drawingContext.fill()
    })

    drawHandIndicators();

    animationFrameId = requestAnimationFrame(draw)
  }

  //canvasElement.addEventListener('mousemove', handleMouseMove);
  //canvasElement.addEventListener('mouseenter', handleMouseEnter);
  //canvasElement.addEventListener('mouseleave', handleMouseLeave);
  function handleMouseEnter() {
    interactionInput.active = true;
  }
  function handleMouseLeave() {
    interactionInput.active = false;
  }
  const observer = new ResizeObserver(resizeCanvas)

  observer.observe(stage)
  createParticles()
  resizeCanvas()

  return () => {
    canvasElement.removeEventListener('mousemove', handleMouseMove);
    canvasElement.removeEventListener('mouseenter', handleMouseEnter);
    canvasElement.removeEventListener('mouseleave', handleMouseLeave);
    observer.disconnect()
    cancelAnimationFrame(animationFrameId)

  }
}, [])
  return (
    <main className="workspace">
      <HandTracker onHandPosition={handleHandPosition}/>
      <header className="workspace-header">
        <h1>Kinevro</h1>
        <span className="connection-status">Camera not connected</span>
      </header>

      <section className="visual-stage">
        <canvas className="visual-canvas" ref={canvasRef}/>
      </section>

      <footer className="workspace-footer">
        <span>Mode: Idle</span>
        <span>Mouse position: {mousePosition.x}, {mousePosition.y}</span>
        <span>Hand tracking: Inactive</span>

        <CustomSelect
          label="Mouse interaction"
          options={['repel', 'attract', 'none']}
          value={interactionInputBehaviour}
          onChange={(value) =>
            setInteractionInputBehaviour(value as MouseBehaviour)
          }
        />

        <CustomSelect
          label="Boundary behavior"
          options={['bounce', 'wrap', 'remove']}
          value={boundaryBehaviour}
          onChange={(value) =>
            setBoundaryBehaviour(value as BoundaryBehaviour)
          }
        />
      </footer>
    </main>
  )
}

export default App