"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { processScan } from "@/app/actions/scan";

export default function QRScanner({ eventId }: { eventId: string }) {
  const [scanResult, setScanResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const processingRef = useRef(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const readerId = useMemo(
    () => `reader-${eventId.replace(/[^a-zA-Z0-9_-]/g, "")}`,
    [eventId],
  );

  useEffect(() => {
    // Initialize the scanner UI
    const scanner = new Html5QrcodeScanner(
      readerId,
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false,
    );
    scannerRef.current = scanner;

    scanner.render(
      async (decodedText) => {
        // Pause scanning while we check the database
        if (processingRef.current) return;
        processingRef.current = true;
        setIsProcessing(true);
        scanner.pause(true);

        try {
          // Supports both legacy payload ({ r_id }) and current payload ({ registrationId }).
          const payload = JSON.parse(decodedText);
          const registrationId = payload?.registrationId ?? payload?.r_id;

          if (typeof registrationId === "string" && registrationId.length > 0) {
            const result = await processScan(eventId, registrationId);
            setScanResult(result);
          } else {
            setScanResult({ success: false, message: "Invalid QR format." });
          }
        } catch {
          setScanResult({ success: false, message: "Failed to read QR data." });
        }

        // Wait 3 seconds, then clear message and resume scanning for the next person
        setTimeout(() => {
          setScanResult(null);
          processingRef.current = false;
          setIsProcessing(false);
          scanner.resume();
        }, 3000);
      },
      () => {
        // Ignore background scan errors (it fires constantly when looking for a code)
      },
    );

    // Cleanup when component unmounts
    return () => {
      processingRef.current = false;
      scannerRef.current?.clear().catch(console.error);
      scannerRef.current = null;
    };
  }, [eventId, readerId]);

  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-4">
      {/* The Camera Viewport */}
      <div
        id={readerId}
        className="overflow-hidden rounded-xl border bg-black"
      ></div>

      {/* Success/Fail Toast Notification */}
      {scanResult && (
        <div
          className={`p-4 rounded-lg font-bold text-center text-white shadow-lg ${
            scanResult.success ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {scanResult.message}
        </div>
      )}
    </div>
  );
}
