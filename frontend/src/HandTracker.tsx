import { useEffect, useRef } from "react";
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";

type HandPosition = {
  x: number;
  y: number;
}

type HandTrackerProps = {
  onHandPosition: (positions: HandPosition[]) => void;
}

function HandTracker({onHandPosition}: HandTrackerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const handLandmarkerRef = useRef<HandLandmarker | null>(null);

  useEffect(() => {
    let active = true;
    let animationFrameId: number | null = null;
    let stream: MediaStream | null = null;

    const initializeMediapipe = async () => {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );
      const handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numHands: 2,
        minHandDetectionConfidence: 0.7,
        minHandPresenceConfidence: 0.7,
        minTrackingConfidence: 0.5
      });
      handLandmarkerRef.current = handLandmarker;
      if(!active) {
        handLandmarker.close();
        handLandmarkerRef.current = null;
        return;
      }
    }

    async function startCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
        if (!active) {
          mediaStream.getTracks().forEach((track) => track.stop());
          return;
        }
        stream = mediaStream;
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (error) {
        console.error("Error accessing the camera:", error);
      }
    }

    function detectHands() {
      if (!active) return;
      animationFrameId = requestAnimationFrame(detectHands);
      const video = videoRef.current;
      const handLandmarker = handLandmarkerRef.current;
      if (!video || !handLandmarker || !(video.readyState >=2)) {
        return;
      }
      const results = handLandmarker.detectForVideo(video, performance.now());
      const positions = results.landmarks.map((landmarks) =>{
        const indexTip = landmarks[8];

        return {
          x: 1-indexTip.x,
          y: indexTip.y
        };
      });
      onHandPosition(positions);
    }
    
    async function start() {
      try {
        await initializeMediapipe();
        if (!active) return;
        await startCamera();
        detectHands();
      } catch (error) {
        console.error("Error starting the hand tracking:", error);
      }
    }
    void start();
    return () => {
      active = false;
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (handLandmarkerRef.current) {
        handLandmarkerRef.current.close();
        handLandmarkerRef.current = null;
      }
    };
  }, []);

 return <video ref={videoRef} playsInline
  muted autoPlay width={320} height={240}
  style = {{transform: "scaleX(-1)"}}/>;
}

export default HandTracker;