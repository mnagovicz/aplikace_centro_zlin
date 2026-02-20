"use client";

import { useEffect, useRef, useState } from "react";

interface QrScannerProps {
  onScan: (url: string) => void;
  onClose: () => void;
}

const CONTAINER_ID = "qr-reader";

export default function QrScanner({ onScan, onClose }: QrScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<unknown>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    let scanner: unknown = null;

    const startScanner = async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");

        if (!mountedRef.current) return;

        const html5Qrcode = new Html5Qrcode(CONTAINER_ID);
        scanner = html5Qrcode;
        scannerRef.current = html5Qrcode;

        await html5Qrcode.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText: string) => {
            html5Qrcode.stop().catch(() => {});
            onScan(decodedText);
          },
          () => {}
        );
      } catch {
        if (mountedRef.current) {
          setError("Nepodařilo se spustit kameru. Povolte přístup ke kameře.");
        }
      }
    };

    // Small delay to ensure DOM is ready
    const timeout = setTimeout(startScanner, 100);

    return () => {
      mountedRef.current = false;
      clearTimeout(timeout);
      if (scanner && typeof (scanner as { stop: () => Promise<void> }).stop === "function") {
        (scanner as { stop: () => Promise<void> }).stop().catch(() => {});
      }
    };
  }, [onScan]);

  const handleClose = () => {
    if (scannerRef.current && typeof (scannerRef.current as { stop: () => Promise<void> }).stop === "function") {
      (scannerRef.current as { stop: () => Promise<void> }).stop().catch(() => {});
    }
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
      <div className="flex flex-1 items-center justify-center">
        <div id={CONTAINER_ID} className="w-full max-w-sm" />
      </div>
      {error && (
        <div className="bg-red-600 px-4 py-3 text-center text-sm text-white">
          {error}
        </div>
      )}
    </div>
  );
}
