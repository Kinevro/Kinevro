
import type { Gesture, HandPosition, FingerPosition } from './effects/types';
import { useEffect, useRef } from "react";
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";

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
  
  if (fingersExtended.every(Boolean)) return 'open-palm';
  if (fingersExtended.every((extended) => !extended)) return 'fist';
  if (pinchDistance < 0.05) return 'pinch';

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

      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;

      const displayWidth = video.clientWidth;
      const displayHeight = video.clientHeight;

      const scale = Math.max(
          displayWidth / videoWidth,
          displayHeight / videoHeight
      );

      const offsetX = (videoWidth * scale - displayWidth) / 2;
      const offsetY = (videoHeight * scale - displayHeight) / 2;

      const mapLandmark = (landmark: { x: number; y: number }) => ({
          x: 1 - (
              (landmark.x * videoWidth * scale - offsetX) / displayWidth
          ),
          y: (
              landmark.y * videoHeight * scale - offsetY
          ) / displayHeight,
      });

      const positions = results.landmarks.map((landmarks) => {
          const indexTip = mapLandmark(landmarks[8]);
          const wrist = mapLandmark(landmarks[0]);

          const fingerLandmarkPairs = [
              [2, 4],
              [5, 8],
              [9, 12],
              [13, 16],
              [17, 20],
          ];

          const fingers: FingerPosition[] = fingerLandmarkPairs.map(
              ([baseIndex, tipIndex]) => {
                  const base = mapLandmark(landmarks[baseIndex]);
                  const tip = mapLandmark(landmarks[tipIndex]);

                  return {
                      baseX: base.x,
                      baseY: base.y,
                      tipX: tip.x,
                      tipY: tip.y,
                  };
              }
          );

          return {
              x: indexTip.x,
              y: indexTip.y,
              wristX: wrist.x,
              wristY: wrist.y,
              fingers,
              gesture: recognizeGesture(landmarks),
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