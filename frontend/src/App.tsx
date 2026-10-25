import './App.css'
import {useEffect, useRef} from "react";

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    context.beginPath();
    context.arc(centerX, centerY, 40, 0, 2 * Math.PI);
    context.fill();
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