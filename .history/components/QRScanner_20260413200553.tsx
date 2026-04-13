"use client";

import { useEffect, useState, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { processScan } from "@/app/actions/scan";

export default function QRScanner({ eventId }: { eventId: string }) {
  const [scanResult, setScanResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // We use a ref to track the scanner instance and prevent Next.js double-mounting bugs
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    // Only initialize if the scanner doesn't exist yet
    if (!scannerRef.current) {
      scannerRef.current = new Html5QrcodeScanner(
        "reader",
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          rememberLastUsedCamera: true, // Helpful for laptops with front/back cams
          supportedScanTypes: [0], // Force it to look for QR codes only (makes it faster)
        },
        false,
      );

      scannerRef.current.render(
        async (decodedText) => {
          if (isProcessing) return;
          setIsProcessing(true);

          // Pause the camera while we talk to Supabase
          scannerRef.current?.pause(true);

          try {
            const payload = JSON.parse(decodedText);

            if (payload.r_id) {
              const result = await processScan(eventId, payload.r_id);
              setScanResult(result);
            } else {
              setScanResult({ success: false, message: "Invalid QR Format" });
            }
          } catch (e) {
            setScanResult({ success: false, message: "Unrecognized QR Code" });
          }

          // Wait 2.5 seconds so the admin can read the message, then scan next person
          setTimeout(() => {
            setScanResult(null);
            setIsProcessing(false);
            scannerRef.current?.resume();
          }, 2500);
        },
        (error) => {
          // Ignore background frame errors
        },
      );
    }

    // Cleanup function when the component unmounts (leaving the page)
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
    };
  }, [eventId, isProcessing]);

  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-4">
      {/* The Camera Viewport */}
      <div
        id="reader"
        className="overflow-hidden rounded-xl bg-black min-h-[300px]"
      ></div>

      {/* Success/Fail Toast Notification */}
      {scanResult && (
        <div
          className={`p-4 rounded-lg font-bold text-center text-white shadow-lg transition-all ${
            scanResult.success ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {scanResult.message}
        </div>
      )}
    </div>
  );
}
