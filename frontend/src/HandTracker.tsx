import { useEffect, useRef } from "react";
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";

type Gesture = 'open-palm' | 'fist' | 'pinch' | 'unknown';

type HandPosition = {
  x: number;
  y: number;
  gesture: Gesture;
}

type HandTrackerProps = {
  onHandPosition: (positions: HandPosition[]) => void;
  cameraVisible: boolean;
  cameraOpacity: number;
}

function recognizeGesture(landmarks: { x: number; y: number}[]): Gesture {
  const fingersExtended = [
    landmarks[8].y < landmarks[6].y,
    landmarks[12].y < landmarks[10].y,
    landmarks[16].y < landmarks[14].y,
    landmarks[20].y < landmarks[18].y,
  ];

  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];

  const pinchDistance = Math.hypot(
    thumbTip.x - indexTip.x,
    thumbTip.y - indexTip.y
  );
  
  if (pinchDistance < 0.05) {
    return 'pinch';
  }

  if (fingersExtended.every(Boolean)){
    return 'open-palm';
  }

  if (fingersExtended.every((extended) => !extended)) {
    return 'fist';
  }

  return 'unknown';
}

function HandTracker({
  onHandPosition,
  cameraVisible,
  cameraOpacity
}: HandTrackerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const handLandmarkerRef = useRef<HandLandmarker | null>(null);

  const previousGesturesRef = useRef<Gesture[]>([]);

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
          y: indexTip.y,
          gesture: recognizeGesture(landmarks)
        };
      });
      positions.forEach((position, index) => {
        const previousGesture = previousGesturesRef.current[index];

        if (
          position.gesture !== 'unknown' &&
          position.gesture !== previousGesture
        ) {
          console.log(`Hand ${index + 1}: ${position.gesture}`);
        }
      });

      previousGesturesRef.current = positions.map(
        (position) => position.gesture
      );
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
  }, [onHandPosition]);

 return (
  <video
    ref={videoRef}
    playsInline
    muted
    autoPlay
    style={{
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      transform: 'scaleX(-1)',
      opacity: cameraVisible ? cameraOpacity : 0,
      pointerEvents: 'none',
    }}
  />
);
}

export default HandTracker;