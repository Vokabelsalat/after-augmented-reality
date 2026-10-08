"use client";

import { useEffect } from "react";
import { renderAquariumPlaylist } from "@/lib/audio/aquariumPlaylist";

const BACKGROUND_VOLUME = 0.25;

/** Unattended exhibition playback; the display has no visitor audio controls. */
export function AquariumAudio() {
  useEffect(() => {
    if (typeof AudioContext === "undefined") return;
    const context = new AudioContext();
    const gain = context.createGain();
    gain.gain.value = 0;
    gain.connect(context.destination);
    let disposed = false;
    let rendering = false;
    let source: AudioBufferSourceNode | undefined;

    async function startPlaylist() {
      if (disposed || rendering || source || context.state !== "running") return;
      rendering = true;
      try {
        const buffer = await renderAquariumPlaylist();
        if (disposed) return;
        source = context.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        source.connect(gain);
        source.start();
        gain.gain.setTargetAtTime(BACKGROUND_VOLUME, context.currentTime, 1.5);
      } catch (error) {
        if (!disposed) console.error("Aquarium soundtrack could not start", error);
      } finally {
        rendering = false;
      }
    }

    function resume() {
      if (disposed) return;
      // Retry within gestures even if an earlier autoplay resume is pending.
      void context.resume().then(startPlaylist).catch(() => undefined);
    }

    context.addEventListener("statechange", startPlaylist);
    window.addEventListener("pointerdown", resume);
    window.addEventListener("keydown", resume);
    resume();

    return () => {
      disposed = true;
      window.removeEventListener("pointerdown", resume);
      window.removeEventListener("keydown", resume);
      context.removeEventListener("statechange", startPlaylist);
      source?.stop();
      gain.disconnect();
      void context.close().catch(() => undefined);
    };
  }, []);

  return null;
}
