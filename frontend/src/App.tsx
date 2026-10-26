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
    
    draw()
  }
  let particles: Particle[] = []
  function createParticles() {
    const numParticles = Math.floor(Math.random() * 50 + 50)
    particles = []
    for (let i = 0; i < numParticles; i++) {
      particles.push({
        x: Math.random() * canvasElement.width,
        y: Math.random() * canvasElement.height,
        radius: Math.random() * 5 + 2,
        color: `hsl(${Math.random() * 360}, 70%, 60%)`,
        speed: Math.random() * 2 + 1,
        direction: Math.random() * Math.PI * 2
      })
    }
  }
  function draw() {
    drawingContext.clearRect(0, 0, canvasElement.width, canvasElement.height)
    
    particles.forEach(particle => {
      particle.x += Math.cos(particle.direction) * particle.speed
      particle.y += Math.sin(particle.direction) * particle.speed
      drawingContext.beginPath()
      drawingContext.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2)
      drawingContext.fillStyle = particle.color
      drawingContext.fill()
    })
    animationFrameId = requestAnimationFrame(draw)
  }

  const observer = new ResizeObserver(resizeCanvas)

  observer.observe(stage)
  resizeCanvas()
  createParticles()
  draw()

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