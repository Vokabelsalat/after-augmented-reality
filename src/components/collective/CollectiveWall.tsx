"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CollectiveCreatureField } from "@/components/collective/CollectiveCreatureField";
import { CreatureCanvas } from "@/components/creature/CreatureCanvas";
import type { ExhibitionContribution } from "@/types/contribution";

const ARRIVAL_DURATION_MS = 17_000;

export function CollectiveWall() {
  const [contributions, setContributions] = useState<ExhibitionContribution[]>([]);
  const [active, setActive] = useState<ExhibitionContribution | null>(null);
  const [connected, setConnected] = useState(true);
  const [ready, setReady] = useState(false);
  const latestId = useRef(0);
  const initialized = useRef(false);
  const activeRef = useRef<ExhibitionContribution | null>(null);
  const queueRef = useRef<ExhibitionContribution[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      try {
        const response = await fetch(`/api/contributions?after=${latestId.current}&limit=100`, { cache: "no-store" });
        if (!response.ok) throw new Error("Collective aquarium unavailable");
        const data = (await response.json()) as { contributions: ExhibitionContribution[] };
        if (cancelled) return;

        if (data.contributions.length > 0) {
          latestId.current = Math.max(...data.contributions.map((item) => item.id));
          setContributions((current) => {
            const known = new Set(current.map((item) => item.id));
            return [...current, ...data.contributions.filter((item) => !known.has(item.id))].slice(-60);
          });
          if (initialized.current) {
            if (!activeRef.current) {
              const [next, ...remaining] = data.contributions;
              activeRef.current = next;
              setActive(next);
              queueRef.current.push(...remaining);
            } else {
              queueRef.current.push(...data.contributions);
            }
          }
        }
        initialized.current = true;
        setConnected(true);
        setReady(true);
      } catch {
        if (!cancelled) {
          setConnected(false);
          setReady(true);
        }
      }
    }

    refresh();
    const interval = window.setInterval(refresh, 2500);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!active) return;
    const timeout = window.setTimeout(() => {
      const next = queueRef.current.shift() ?? null;
      activeRef.current = next;
      setActive(next);
    }, ARRIVAL_DURATION_MS);
    return () => window.clearTimeout(timeout);
  }, [active]);

  const habitatCreatures = useMemo(
    () => contributions.filter((contribution) => contribution.id !== active?.id),
    [active?.id, contributions],
  );
  const latest = contributions.at(-1);

  return (
    <main className="collective-wall film-grain relative h-screen overflow-hidden bg-[#030405] text-[#F3F0E8]" aria-label="Collective exhibition aquarium">
      <div className="absolute inset-0 collective-aurora" aria-hidden="true" />
      <div className="absolute inset-0" aria-live="polite">
        <CollectiveCreatureField contributions={habitatCreatures} />
      </div>

      <header className="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-8 py-7 lg:px-12 lg:py-9">
        <div>
          <h1 className="font-display text-xl tracking-[-0.03em] lg:text-2xl">After Augmented Reality</h1>
          <p className="mt-1 text-[10px] tracking-[0.22em] text-white/35">COLLECTIVE AQUARIUM</p>
        </div>
        <div className="flex items-center gap-6 text-xs tracking-[0.18em] text-white/42">
          <span>{contributions.length} {contributions.length === 1 ? "fish" : "fish"}</span>
          <span className="flex items-center gap-2">
            <span className={`size-1.5 rounded-full ${connected ? "bg-emerald-300" : "bg-amber-300"}`} aria-hidden="true" />
            {connected ? "LISTENING" : "RECONNECTING"}
          </span>
        </div>
      </header>

      {contributions.length === 0 && ready && (
        <div className="absolute inset-0 flex items-center justify-center text-center">
          <div>
            <div className="mx-auto mb-8 size-2 rounded-full bg-white/70 shadow-[0_0_32px_10px_rgba(255,255,255,.24)] animate-breathe" />
            <p className="font-display text-3xl text-white/72">Waiting for the first fish</p>
            <p className="mt-3 text-xs tracking-[0.2em] text-white/30">THE AQUARIUM IS OPEN</p>
          </div>
        </div>
      )}

      {active && (
        <section key={active.id} className="collective-arrival absolute inset-0 z-20 grid place-items-center" aria-label="A new visitor fish has arrived">
          <div className="collective-arrival-glow absolute inset-0" aria-hidden="true" />
          <div className="relative grid w-[min(90vw,1100px)] grid-cols-[minmax(280px,.8fr)_minmax(360px,1.2fr)] items-center gap-20">
            <div className="collective-arrival-creature aspect-square w-full">
              <CreatureCanvas
                artifactIds={active.parts.map((part) => part.artifactId)}
                label={`New fish with ${active.parts.length} parts`}
              />
            </div>
            <div className="collective-story max-w-2xl">
              <p className="mb-3 text-xs tracking-[0.28em] text-white/42">A NEW FISH ENTERS THE AQUARIUM</p>
              <p className="mb-8 text-sm text-white/45">
                Made from {active.parts.length} exhibition {active.parts.length === 1 ? "encounter" : "encounters"}
              </p>
              <div className="font-display text-[clamp(2rem,3.8vw,4.25rem)] leading-[1.08] tracking-[-0.035em]">
                {active.narrative.map((line, index) => (
                  <p key={`${index}-${line}`} className="my-2">{line}</p>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {latest && !active && (
        <aside className="absolute inset-x-0 bottom-0 z-10 flex items-end justify-between px-8 pb-7 text-white/40 lg:px-12 lg:pb-9">
          <p className="max-w-xl font-display text-lg leading-snug text-white/55">{latest.narrative[0]}</p>
          <p className="text-[10px] tracking-[0.2em]">LATEST · {latest.parts.length} PARTS</p>
        </aside>
      )}
    </main>
  );
}
