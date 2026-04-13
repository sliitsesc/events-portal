"use client";

import { useEffect, useState, useRef } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { processScan } from "@/app/actions/scan";

export default function QRScanner({ eventId }: { eventId: string }) {
  const [scanResult, setScanResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isStartingCamera, setIsStartingCamera] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isProcessingRef = useRef(false);
  const resumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const restartCamera = () => {
    setCameraError(null);
    setScanResult(null);
    setRetryCount((prev) => prev + 1);
  };

  useEffect(() => {
    isProcessingRef.current = isProcessing;
  }, [isProcessing]);

  useEffect(() => {
    let isUnmounted = false;

    if (!window.isSecureContext) {
      setCameraError(
        "Camera needs HTTPS or localhost. Open this app on a secure origin.",
      );
      setIsStartingCamera(false);
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("This browser does not support camera access.");
      setIsStartingCamera(false);
      return;
    }

    const startScanner = async () => {
      setIsStartingCamera(true);
      setCameraError(null);
      const scanner = new Html5Qrcode("reader", false);
      scannerRef.current = scanner;

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
      };

      const onScanSuccess = async (decodedText: string) => {
        if (isProcessingRef.current) return;

        isProcessingRef.current = true;
        setIsProcessing(true);
        scannerRef.current?.pause(true);

        try {
          const payload = JSON.parse(decodedText);

          if (payload.r_id) {
            const result = await processScan(eventId, payload.r_id);
            if (!isUnmounted) setScanResult(result);
          } else if (!isUnmounted) {
            setScanResult({ success: false, message: "Invalid QR Format" });
          }
        } catch {
          if (!isUnmounted) {
            setScanResult({ success: false, message: "Unrecognized QR Code" });
          }
        }

        if (resumeTimeoutRef.current) {
          clearTimeout(resumeTimeoutRef.current);
        }

        resumeTimeoutRef.current = setTimeout(() => {
          if (!isUnmounted) setScanResult(null);
          isProcessingRef.current = false;
          setIsProcessing(false);
          scannerRef.current?.resume();
        }, 2500);
      };

      try {
        await scanner.start(
          { facingMode: "environment" },
          config,
          onScanSuccess,
          () => {
            // Ignore background frame decode failures.
          },
        );
      } catch {
        try {
          const cameras = await Html5Qrcode.getCameras();
          if (!cameras.length) {
            throw new Error("No camera found");
          }

          await scanner.start(
            { deviceId: { exact: cameras[0].id } },
            config,
            onScanSuccess,
            () => {
              // Ignore background frame decode failures.
            },
          );
        } catch {
          if (!isUnmounted) {
            setCameraError(
              "Unable to start camera. Allow camera permission in your browser and OS privacy settings, then retry.",
            );
          }
        }
      }

      if (!isUnmounted) {
        setIsStartingCamera(false);
      }
    };

    startScanner();

    // Cleanup function when the component unmounts (leaving the page)
    return () => {
      isUnmounted = true;

      if (resumeTimeoutRef.current) {
        clearTimeout(resumeTimeoutRef.current);
        resumeTimeoutRef.current = null;
      }

      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .catch(() => {
            // Ignore stop errors while unmounting.
          })
          .finally(() => {
            scannerRef.current?.clear().catch(() => {
              // Ignore clear errors while unmounting.
            });
            scannerRef.current = null;
          });

        scannerRef.current = null;
      }
    };
  }, [eventId, retryCount]);

  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-4">
      {/* The Camera Viewport */}
      <div
        id="reader"
        className="overflow-hidden rounded-xl bg-black min-h-[300px]"
      ></div>

      {cameraError && (
        <div className="flex flex-col gap-3">
          <div className="p-4 rounded-lg font-semibold text-center text-white bg-amber-600 shadow-lg">
            {cameraError}
          </div>
          <button
            type="button"
            onClick={restartCamera}
            className="rounded-lg bg-slate-800 text-white px-4 py-2 font-medium hover:bg-slate-700 transition-colors"
          >
            Retry Camera
          </button>
        </div>
      )}

      {isStartingCamera && !cameraError && (
        <div className="p-3 rounded-lg bg-slate-100 text-slate-700 text-center font-medium">
          Starting camera...
        </div>
      )}

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
