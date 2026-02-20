"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

interface QrScannerProps {
  onScan: (url: string) => void;
  onClose: () => void;
}

export default function QrScanner({ onScan, onClose }: QrScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<string>("qr-reader-" + Math.random().toString(36).slice(2));

  useEffect(() => {
    const scanner = new Html5Qrcode(containerRef.current);
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          scanner.stop().catch(() => {});
          onScan(decodedText);
        },
        () => {}
      )
      .catch(() => {
        setError("Nepodařilo se spustit kameru. Povolte přístup ke kameře.");
      });

    return () => {
      scanner.stop().catch(() => {});
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="flex items-center justify-between bg-black/80 px-4 py-3">
        <span className="text-sm font-medium text-white">Naskenujte QR kód</span>
        <button
          onClick={() => {
            scannerRef.current?.stop().catch(() => {});
            onClose();
          }}
          className="rounded-md bg-white/20 px-3 py-1.5 text-sm text-white"
        >
          Zavřít
        </button>
      </div>
      <div className="flex flex-1 items-center justify-center">
        <div id={containerRef.current} className="w-full max-w-sm" />
      </div>
      {error && (
        <div className="bg-red-600 px-4 py-3 text-center text-sm text-white">
          {error}
        </div>
      )}
    </div>
  );
}
