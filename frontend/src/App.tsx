import './App.css'
import {useEffect, useRef} from "react";

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
    const width = stageElement.clientWidth
    const height = stageElement.clientHeight
    if (canvasElement.width !== width) {
      canvasElement.width = width
    }
    if (canvasElement.height !== height) {
      canvasElement.height = height
    }
  }
  let x = 0;
  function draw() {
    drawingContext.clearRect(0, 0, canvasElement.width, canvasElement.height)
    drawingContext.beginPath()
    x += 1;
    drawingContext.arc(x, canvasElement.height / 2, 40, 0, Math.PI * 2)
    drawingContext.fill()
    animationFrameId = requestAnimationFrame(draw)
  }

  const observer = new ResizeObserver(resizeCanvas)

  observer.observe(stage)
  resizeCanvas()
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