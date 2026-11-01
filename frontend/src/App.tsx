import ParticleEffect from "./effects/ParticleEffect.ts";
import HandTracker from "./HandTracker.tsx";
import './App.css'
import CustomSelect from "./CustomSelect.tsx";
import {useEffect, useRef, useState, useCallback} from "react";
import type { HandPosition } from './effects/types';

type BoundaryBehaviour = 'bounce' | 'wrap' | 'remove';

function App() {
  const handleHandPosition = useCallback((positions: HandPosition[]) => {
    handPositionRef.current = positions;
  }, []);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [boundaryBehaviour, setBoundaryBehaviour] = useState<BoundaryBehaviour>('bounce');
  const boundaryBehaviourRef = useRef<BoundaryBehaviour>('bounce');
  const handPositionRef = useRef<HandPosition[]>([]);
  const [cameraVisible, setCameraVisible] = useState(true);
  const [cameraOpacity, setCameraOpacity] = useState(0.2);
  
useEffect(() => {
  boundaryBehaviourRef.current = boundaryBehaviour;
}, [boundaryBehaviour]);
useEffect(() => {
  const canvas = canvasRef.current
  const stage = canvas?.parentElement

  if (!canvas || !stage) return
  const canvasElement = canvas
  const stageElement = stage
  const particleEffect = new ParticleEffect(canvas);
  
  let animationFrameId: number = 0;
  let lastTimestamp: number = 0;

  function resizeCanvas() {
    const width = stageElement.clientWidth
    const height = stageElement.clientHeight
    if (
      canvasElement.width !== width ||
      canvasElement.height !== height
    ) {
      particleEffect.resize(width, height);
    }
    if (animationFrameId === 0) {
      animationFrameId = requestAnimationFrame(draw)
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
    const frameScale = deltaTime * 60;
    

    particleEffect.clear();
    lastTimestamp = timestamp
    
    const interactionRadius = 0.33 * Math.min(
      canvasElement.width,
      canvasElement.height
    );

    particleEffect.update(
    handPositionRef.current,
    frameScale,
    interactionRadius,
    boundaryBehaviourRef.current
  );

  particleEffect.drawParticles();

  particleEffect.drawHandIndicators(
    handPositionRef.current,
    interactionRadius
  );

    animationFrameId = requestAnimationFrame(draw)
  }

  const observer = new ResizeObserver(resizeCanvas)

  observer.observe(stage)
  particleEffect.initialize();
  resizeCanvas();

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
        <HandTracker
        onHandPosition={handleHandPosition}
        cameraVisible={cameraVisible}
        cameraOpacity={cameraOpacity}
        />
        <canvas className="visual-canvas" ref={canvasRef}/>
      </section>

      <footer className="workspace-footer">
        <span>Mode: Idle</span>
        <span>Hand tracking: Inactive</span>

        <CustomSelect
          label="Boundary behavior"
          options={['bounce', 'wrap', 'remove']}
          value={boundaryBehaviour}
          onChange={(value) =>
            setBoundaryBehaviour(value as BoundaryBehaviour)
          }
        />
        <label className="camera-control">
          <input
            type="checkbox"
            checked={cameraVisible}
            onChange={(event) => setCameraVisible(event.target.checked)}
          />
          Show camera preview
        </label>

        <label className="camera-control">
          Camera opacity
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={cameraOpacity}
            onChange={(event) => setCameraOpacity(Number(event.target.value))}
            disabled={!cameraVisible}
          />
          {Math.round(cameraOpacity * 100)}%
        </label>
      </footer>
    </main>
  )
}

export default App