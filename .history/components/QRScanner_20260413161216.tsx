"use client";

import { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { processScan } from "@/app/actions/scan";

export default function QRScanner({ eventId }: { eventId: string }) {
  const [scanResult, setScanResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Initialize the scanner UI
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false,
    );

    scanner.render(
      async (decodedText) => {
        // Pause scanning while we check the database
        if (isProcessing) return;
        setIsProcessing(true);
        scanner.pause(true);

        try {
          // We hashed it as JSON in Phase 2: { r_id: "...", s_id: "..." }
          const payload = JSON.parse(decodedText);

          if (payload.r_id) {
            const result = await processScan(eventId, payload.r_id);
            setScanResult(result);
          } else {
            setScanResult({ success: false, message: "Invalid QR Format" });
          }
        } catch (e) {
          setScanResult({ success: false, message: "Failed to read QR data" });
        }

        // Wait 3 seconds, then clear message and resume scanning for the next person
        setTimeout(() => {
          setScanResult(null);
          setIsProcessing(false);
          scanner.resume();
        }, 3000);
      },
      (error) => {
        // Ignore background scan errors (it fires constantly when looking for a code)
      },
    );

    // Cleanup when component unmounts
    return () => {
      scanner.clear().catch(console.error);
    };
  }, [eventId]);

  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-4">
      {/* The Camera Viewport */}
      <div
        id="reader"
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
