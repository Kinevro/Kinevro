import './App.css'
import {useEffect, useRef} from "react";

type Particle = {
  x: number;
  y: number;
  radius: number;
  color: string;
  speed: number;
  direction: number;
};

type BoundaryBehavior = 'bounce' | 'wrap' | 'remove';

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
  let boundaryBehavior: BoundaryBehavior = 'remove';

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
    const numParticles = Math.floor(Math.random() * 50 + 65)
    particles = []
    for (let i = 0; i < numParticles; i++) {
      particles.push({
        x: Math.random() * canvasElement.width,
        y: Math.random() * canvasElement.height,
        radius: Math.random() * 5 + 1,
        color: `hsl(${Math.random() * 360}, 70%, 60%)`,
        speed: Math.random() * 6 + 3,
        direction: Math.random() * Math.PI * 2
      })
    }
  }

  function handleBoundary(particle: Particle): boolean {
    switch (boundaryBehavior) {
      case 'bounce':
        if (particle.x - particle.radius < 0) {
          particle.x = particle.radius;
          particle.direction = Math.PI - particle.direction;
        } else if (particle.x + particle.radius > canvasElement.width) {
          particle.x = canvasElement.width - particle.radius;
          particle.direction = Math.PI - particle.direction;
        }
        if (particle.y - particle.radius < 0) {
          particle.y = particle.radius;
          particle.direction = -particle.direction;
        } else if (particle.y + particle.radius > canvasElement.height) {
          particle.y = canvasElement.height - particle.radius;
          particle.direction = -particle.direction;
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

  function draw(timestamp: number = 0) {
    animationFrameId = 0
    let deltaTime: number
    if (lastTimestamp > 0) {
      deltaTime = Math.min((timestamp - lastTimestamp) / 1000, 0.05)
    }
    else {
      deltaTime = 0
    }
    const frameScale = deltaTime * 60
    drawingContext.clearRect(0, 0, canvasElement.width, canvasElement.height)
    lastTimestamp = timestamp

    particles = particles.filter(particle => {
      particle.direction += (Math.random() - 0.5) * 0.40  * frameScale
      particle.x += Math.cos(particle.direction) * particle.speed * frameScale
      particle.y += Math.sin(particle.direction) * particle.speed * frameScale
      return handleBoundary(particle)
    })

    particles.forEach(particle => {
      drawingContext.beginPath()
      drawingContext.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2)
      drawingContext.fillStyle = particle.color
      drawingContext.fill()
    })
    animationFrameId = requestAnimationFrame(draw)
  }

  const observer = new ResizeObserver(resizeCanvas)

  observer.observe(stage)
  createParticles()
  resizeCanvas()

  return () => {
    observer.disconnect()
    cancelAnimationFrame(animationFrameId)
  }
}, [])
  return (
    <main className="workspace">
      <header className="workspace-header">
        <h1>Kinevro</h1>
        <span className="connection-status">Camera not connected</span>
      </header>

      <section className="visual-stage">
        <canvas className="visual-canvas" ref={canvasRef}/>
      </section>

      <footer className="workspace-footer">
        <span>Mode: Idle</span>
        <span>Hand tracking: Inactive</span>
      </footer>
    </main>
  )
}

export default App