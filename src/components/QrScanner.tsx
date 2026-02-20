"use client";

import { useEffect, useRef, useState } from "react";

interface QrScannerProps {
  onScan: (url: string) => void;
  onClose: () => void;
}

export default function QrScanner({ onScan, onClose }: QrScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number>(0);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  useEffect(() => {
    let stopped = false;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });

        if (stopped) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }

        // Dynamically import jsQR
        const jsQR = (await import("jsqr")).default;

        const scan = () => {
          if (stopped) return;

          const video = videoRef.current;
          const canvas = canvasRef.current;

          if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              const code = jsQR(imageData.data, imageData.width, imageData.height);

              if (code) {
                // Found QR code
                stream.getTracks().forEach((t) => t.stop());
                onScanRef.current(code.data);
                return;
              }
            }
          }

          animationRef.current = requestAnimationFrame(scan);
        };

        // Wait for video to be ready
        videoRef.current?.addEventListener("loadeddata", () => {
          scan();
        });
      } catch {
        if (!stopped) {
          setError("Nepodařilo se spustit kameru. Povolte přístup ke kameře v nastavení prohlížeče.");
        }
      }
    };

    startCamera();

    return () => {
      stopped = true;
      cancelAnimationFrame(animationRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const handleClose = () => {
    cancelAnimationFrame(animationRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="flex items-center justify-between bg-black/80 px-4 py-3">
        <span className="text-sm font-medium text-white">Naskenujte QR kód</span>
        <button
          onClick={handleClose}
          className="rounded-md bg-white/20 px-3 py-1.5 text-sm text-white"
        >
          Zavřít
        </button>
      </div>
      <div className="relative flex flex-1 items-center justify-center">
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          playsInline
          muted
        />
        {/* Scanning overlay */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-64 w-64 rounded-2xl border-4 border-white/50" />
        </div>
        <canvas ref={canvasRef} className="hidden" />
      </div>
      {error && (
        <div className="bg-red-600 px-4 py-3 text-center text-sm text-white">
          {error}
        </div>
      )}
    </div>
  );
}
