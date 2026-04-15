"use client";

import { useEffect, useState, useRef } from "react";
import {
  Html5Qrcode,
  Html5QrcodeScannerState,
  Html5QrcodeSupportedFormats,
} from "html5-qrcode";
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
  const startPromiseRef = useRef<Promise<void> | null>(null);

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

    const stopAndClearScanner = async (scanner: Html5Qrcode | null) => {
      if (!scanner) return;

      try {
        const state = scanner.getState();
        if (
          state === Html5QrcodeScannerState.SCANNING ||
          state === Html5QrcodeScannerState.PAUSED
        ) {
          await scanner.stop();
        }
      } catch {
        // Ignore stop errors during teardown.
      }

      try {
        await scanner.clear();
      } catch {
        // Ignore clear errors during teardown.
      }
    };

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

      const scanBoxSize = Math.min(
        280,
        Math.max(180, Math.floor(window.innerWidth * 0.62)),
      );

      const config = {
        fps: 10,
        qrbox: { width: scanBoxSize, height: scanBoxSize },
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
      } else {
        await stopAndClearScanner(scanner);
        if (scannerRef.current === scanner) {
          scannerRef.current = null;
        }
      }
    };

    const startPromise = startScanner();
    startPromiseRef.current = startPromise;

    // Cleanup function when the component unmounts (leaving the page)
    return () => {
      isUnmounted = true;

      if (resumeTimeoutRef.current) {
        clearTimeout(resumeTimeoutRef.current);
        resumeTimeoutRef.current = null;
      }

      const scannerAtCleanup = scannerRef.current;
      scannerRef.current = null;

      void (async () => {
        try {
          await startPromiseRef.current;
        } catch {
          // Ignore start errors during teardown.
        }
        await stopAndClearScanner(scannerAtCleanup);
      })();
    };
  }, [eventId, retryCount]);

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 px-2 sm:px-0">
      {/* The Camera Viewport */}
      <div
        id="reader"
        className="min-h-[260px] overflow-hidden rounded-xl bg-black shadow-sm sm:min-h-[320px] [&>div]:!w-full [&_canvas]:h-full [&_canvas]:w-full [&_video]:h-full [&_video]:w-full [&_video]:object-cover"
      ></div>

      {cameraError && (
        <div className="flex flex-col gap-3">
          <div className="rounded-lg bg-amber-600 p-4 text-center text-sm font-semibold text-white shadow-lg sm:text-base">
            {cameraError}
          </div>
          <button
            type="button"
            onClick={restartCamera}
            className="w-full rounded-lg bg-slate-800 px-4 py-2 font-medium text-white transition-colors hover:bg-slate-700 sm:w-auto"
          >
            Retry Camera
          </button>
        </div>
      )}

      {isStartingCamera && !cameraError && (
        <div className="rounded-lg bg-slate-100 p-3 text-center text-sm font-medium text-slate-700 sm:text-base">
          Starting camera...
        </div>
      )}

      {/* Success/Fail Toast Notification */}
      {scanResult && (
        <div
          className={`rounded-lg p-4 text-center text-sm font-bold text-white shadow-lg transition-all sm:text-base ${
            scanResult.success ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {scanResult.message}
        </div>
      )}
    </div>
  );
}
