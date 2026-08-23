"use client";

import {
  forwardRef,
  type ForwardedRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import type { MindARAdapter as MindARAdapterType } from "@/components/ar/MindARAdapter";
import { artifacts } from "@/data/artifacts";

type ScannerState = "idle" | "starting" | "running" | "paused" | "error";

type ARScannerProps = {
  onTargetFound: (targetIndex: number) => void;
  onTargetLost: (targetIndex: number) => void;
  onUseSimulator: () => void;
  simulatorVisible: boolean;
};

export type ARScannerHandle = {
  dismissArtifact: (targetIndex: number) => void;
};

function ARScannerComponent(
  {
    onTargetFound,
    onTargetLost,
    onUseSimulator,
    simulatorVisible,
  }: ARScannerProps,
  ref: ForwardedRef<ARScannerHandle>,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const adapterRef = useRef<MindARAdapterType | null>(null);
  const startAttemptRef = useRef(0);
  const onTargetFoundRef = useRef(onTargetFound);
  const onTargetLostRef = useRef(onTargetLost);
  const [scannerState, setScannerState] = useState<ScannerState>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  useImperativeHandle(
    ref,
    () => ({
      dismissArtifact: (targetIndex) => {
        adapterRef.current?.dismissArtifact(targetIndex);
      },
    }),
    [],
  );

  useEffect(() => {
    onTargetFoundRef.current = onTargetFound;
    onTargetLostRef.current = onTargetLost;
  }, [onTargetFound, onTargetLost]);

  const stopScanner = useCallback(async () => {
    startAttemptRef.current += 1;
    const adapter = adapterRef.current;
    adapterRef.current = null;
    if (adapter) await adapter.stop();
  }, []);

  const startScanner = useCallback(async () => {
    const container = containerRef.current;
    if (!container || scannerState === "starting") return;
    setScannerState("starting");
    setErrorMessage("");

    try {
      await stopScanner();
      const attempt = startAttemptRef.current;
      const { MindARAdapter } = await import("@/components/ar/MindARAdapter");
      if (attempt !== startAttemptRef.current) return;
      const adapter = new MindARAdapter({
        imageTargetSrc: "/targets/exhibition.mind",
        targets: artifacts.map(
          ({ id, targetIndex, theme, color }) => ({
            id,
            targetIndex,
            theme,
            color,
          }),
        ),
        onTargetFound: (targetIndex) => onTargetFoundRef.current(targetIndex),
        onTargetLost: (targetIndex) => onTargetLostRef.current(targetIndex),
      });
      adapterRef.current = adapter;
      await adapter.start(container);
      if (attempt !== startAttemptRef.current) {
        await adapter.stop();
        return;
      }
      setScannerState("running");
    } catch (error) {
      const cancelled = adapterRef.current === null;
      adapterRef.current = null;
      if (cancelled) return;
      setScannerState("error");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "The AR scanner could not be started.",
      );
    }
  }, [scannerState, stopScanner]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && adapterRef.current) {
        void stopScanner();
        setScannerState("paused");
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      void stopScanner();
    };
  }, [stopScanner]);

  const waiting = scannerState === "idle" || scannerState === "paused";

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#1111112e]">
      {/* <div className="absolute inset-0 z-1" aria-hidden="true">
        <div className="absolute top-1/2 left-1/2 h-[60vh] w-[80vw] -translate-x-1/2 -translate-y-1/2 border border-white/10" style={{
          boxShadow: "0 0 0 9999px rgba(20, 30, 40, 0.85"
        }} />
        <div className="absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/30" />
      </div> */}
      <div ref={containerRef} className="absolute inset-0 z-0 [&>canvas]:!absolute [&>canvas]:!inset-0 [&>canvas]:!h-full [&>canvas]:!w-full [&>video]:!absolute [&>video]:!inset-0 [&>video]:!h-full [&>video]:!w-full [&>video]:!object-cover" />
      <div className="camera-vignette pointer-events-none absolute inset-0" aria-hidden="true" />

      {
        (waiting || scannerState === "error") && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/55 px-7 backdrop-blur-sm">
            <div className="w-full max-w-sm text-center">
              <div className="mx-auto mb-7 size-14 rounded-full border border-white/20 p-1">
                <div className="size-full rounded-full border border-dashed border-white/45" />
              </div>
              <h2 className="text-4xl tracking-[-0.04em]">
                {scannerState === "error" ? "Camera unavailable" : "Find a fragment"}
              </h2>
              <p className="mx-auto mt-4 max-w-xs text-sm leading-6 text-white/80" role="status">
                {scannerState === "error"
                  ? errorMessage
                  : scannerState === "paused"
                    ? "The camera paused when the page became hidden. Tap to restart it."
                    : "Point your camera at one of the exhibition posters. Permission is requested only after you tap below."}
              </p>
              <button
                type="button"
                onClick={() => void startScanner()}
                className="mt-7 min-h-13 w-full rounded-full bg-white px-6 text-sm font-medium text-black transition-opacity hover:opacity-85"
              >
                {scannerState === "error" ? "Try camera again" : "Start camera"}
              </button>
              {!simulatorVisible && (
                <button
                  type="button"
                  onClick={onUseSimulator}
                  className="mt-3 min-h-11 px-5 text-xs text-white/55 underline decoration-white/20 underline-offset-4"
                >
                  Use the no-camera simulator
                </button>
              )}
            </div>
          </div>
        )
      }

      {
        scannerState === "starting" && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/65" role="status">
            <p className="animate-pulse text-[10px] tracking-[0.25em] text-white/60">
              Starting camera
            </p>
          </div>
        )
      }

      {
        scannerState === "running" && (
          <p className="absolute inset-x-0 bottom-[9rem] z-10 text-center text-[10px] tracking-[0.22em] text-white/60" role="status">
            Move slowly across a poster
          </p>
        )
      }
    </div >
  );
}

export const ARScanner = forwardRef<ARScannerHandle, ARScannerProps>(
  ARScannerComponent,
);
