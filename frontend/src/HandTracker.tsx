import { useEffect, useRef } from "react";

function HandTracker() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let active = true;
    let stream: MediaStream | null = null;
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
    void startCamera();
    return () => {
      active = false;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

 return <video ref={videoRef} playsInline muted autoPlay width={320} height={240}/>;
}

export default HandTracker;