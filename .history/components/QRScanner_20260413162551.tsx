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
  const [cameraError, setCameraError] = useState<string | null>(null);
  const processingRef = useRef(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const readerId = useMemo(
    () => `reader-${eventId.replace(/[^a-zA-Z0-9_-]/g, "")}`,
    [eventId],
  );

  useEffect(() => {
    let isMounted = true;

    const initScanner = async () => {
      setCameraError(null);

      if (typeof window === "undefined") return;

      const isSecureContextOk =
        window.isSecureContext || window.location.hostname === "localhost";

      if (!isSecureContextOk) {
        setCameraError(
          "Camera access requires HTTPS (or localhost). Open this page using HTTPS.",
        );
        return;
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError("This browser does not support camera access.");
        return;
      }

      try {
        // Preflight permission/device check to avoid silent black viewport failures.
        const testStream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        testStream.getTracks().forEach((track) => track.stop());
      } catch (error) {
        const e = error as DOMException;

        if (e?.name === "NotAllowedError") {
          setCameraError(
            "Camera permission is blocked. Allow camera access in your browser and reload.",
          );
          return;
        }

        if (e?.name === "NotFoundError") {
          setCameraError("No camera device found on this laptop.");
          return;
        }

        setCameraError("Unable to access camera. Please try again.");
        return;
      }

      if (!isMounted) return;

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

            if (
              typeof registrationId === "string" &&
              registrationId.length > 0
            ) {
              const result = await processScan(eventId, registrationId);
              setScanResult(result);
            } else {
              setScanResult({ success: false, message: "Invalid QR format." });
            }
          } catch {
            setScanResult({
              success: false,
              message: "Failed to read QR data.",
            });
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
    };

    void initScanner();

    // Cleanup when component unmounts
    return () => {
      isMounted = false;
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

      {cameraError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {cameraError}
        </div>
      )}

      {isProcessing && (
        <div className="rounded-lg border bg-amber-50 px-3 py-2 text-sm text-amber-700">
          Processing scan...
        </div>
      )}

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
