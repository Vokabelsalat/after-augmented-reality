"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { ExhibitionContribution } from "@/types/contribution";

type PositionedContribution = ExhibitionContribution & {
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
};

function seededUnit(seed: number) {
  const value = Math.sin(seed * 999.13) * 43758.5453;
  return value - Math.floor(value);
}

function positionContribution(contribution: ExhibitionContribution): PositionedContribution {
  return {
    ...contribution,
    x: 7 + seededUnit(contribution.id * 3) * 86,
    y: 12 + seededUnit(contribution.id * 5) * 76,
    size: 110 + seededUnit(contribution.id * 7) * 150,
    delay: seededUnit(contribution.id * 11) * -18,
    duration: 17 + seededUnit(contribution.id * 13) * 14,
  };
}

function NetworkGlyph({
  contribution,
  label,
}: {
  contribution: ExhibitionContribution;
  label?: string;
}) {
  const points = useMemo(() => {
    const count = contribution.glyphs.length;
    if (count === 1) return [{ x: 100, y: 100 }];
    return contribution.glyphs.map((_, index) => {
      const angle = -Math.PI / 2 + (index / count) * Math.PI * 2;
      const radius = count === 2 ? 48 : 58;
      return { x: 100 + Math.cos(angle) * radius, y: 100 + Math.sin(angle) * radius };
    });
  }, [contribution.glyphs]);

  return (
    <svg viewBox="0 0 200 200" role={label ? "img" : undefined} aria-label={label} className="size-full overflow-visible">
      <defs>
        {contribution.glyphs.map((glyph, index) => (
          <radialGradient key={glyph.artifactId} id={`glow-${contribution.id}-${index}`}>
            <stop offset="0" stopColor="#fff" />
            <stop offset="0.28" stopColor={glyph.color} stopOpacity=".95" />
            <stop offset="1" stopColor={glyph.color} stopOpacity="0" />
          </radialGradient>
        ))}
      </defs>
      {points.slice(0, -1).map((point, index) => (
        <line
          key={`line-${index}`}
          x1={point.x}
          y1={point.y}
          x2={points[index + 1].x}
          y2={points[index + 1].y}
          stroke="rgba(243,240,232,.32)"
          strokeWidth=".8"
        />
      ))}
      {points.map((point, index) => (
        <g key={contribution.glyphs[index].artifactId}>
          <circle cx={point.x} cy={point.y} r="31" fill={`url(#glow-${contribution.id}-${index})`} opacity=".42" />
          <circle cx={point.x} cy={point.y} r="3.2" fill={contribution.glyphs[index].color} />
          <circle cx={point.x} cy={point.y} r="7" fill="none" stroke={contribution.glyphs[index].color} strokeOpacity=".48" strokeWidth=".7" />
        </g>
      ))}
    </svg>
  );
}

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
        const response = await fetch(`/api/contributions?after=${latestId.current}&limit=100`, {
          cache: "no-store",
        });
        if (!response.ok) throw new Error("Wall feed unavailable");
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
    }, 11000);
    return () => window.clearTimeout(timeout);
  }, [active]);

  const positioned = useMemo(
    () => contributions.map(positionContribution),
    [contributions],
  );

  return (
    <main className="collective-wall film-grain relative h-screen overflow-hidden bg-[#030405] text-[#F3F0E8]" aria-label="Collective exhibition stories">
      <div className="absolute inset-0 collective-aurora" aria-hidden="true" />

      <header className="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-8 py-7 lg:px-12 lg:py-9">
        <h1 className="font-display text-xl tracking-[-0.03em] lg:text-2xl">After Augmented Reality</h1>
        <div className="flex items-center gap-6 text-xs tracking-[0.18em] text-white/42">
          <span>{contributions.length} {contributions.length === 1 ? "story" : "stories"}</span>
          <span className="flex items-center gap-2">
            <span className={`size-1.5 rounded-full ${connected ? "bg-emerald-300" : "bg-amber-300"}`} aria-hidden="true" />
            {connected ? "LISTENING" : "RECONNECTING"}
          </span>
        </div>
      </header>

      <div className="absolute inset-0" aria-live="polite">
        {positioned.map((contribution) => {
          const style = {
            left: `${contribution.x}%`,
            top: `${contribution.y}%`,
            width: `${contribution.size}px`,
            height: `${contribution.size}px`,
            "--float-delay": `${contribution.delay}s`,
            "--float-duration": `${contribution.duration}s`,
          } as CSSProperties;
          return (
            <div
              key={contribution.id}
              className={`collective-fragment absolute -translate-x-1/2 -translate-y-1/2 transition-opacity duration-1000 ${active?.id === contribution.id ? "opacity-0" : "opacity-55"}`}
              style={style}
              aria-hidden="true"
            >
              <NetworkGlyph contribution={contribution} />
            </div>
          );
        })}
      </div>

      {contributions.length === 0 && ready && (
        <div className="absolute inset-0 flex items-center justify-center text-center">
          <div>
            <div className="mx-auto mb-8 size-2 rounded-full bg-white/70 shadow-[0_0_32px_10px_rgba(255,255,255,.24)] animate-breathe" />
            <p className="font-display text-3xl text-white/72">Waiting for the first story</p>
            <p className="mt-3 text-xs tracking-[0.2em] text-white/30">THE COLLECTIVE FIELD IS OPEN</p>
          </div>
        </div>
      )}

      {active && (
        <section key={active.id} className="collective-arrival absolute inset-0 z-20 grid place-items-center" aria-label="A new visitor story has arrived">
          <div className="collective-arrival-glow absolute inset-0" aria-hidden="true" />
          <div className="relative grid w-[min(90vw,1100px)] grid-cols-[minmax(280px,.8fr)_minmax(360px,1.2fr)] items-center gap-20">
            <div className="collective-arrival-graph aspect-square w-full">
              <NetworkGlyph contribution={active} label={`Constellation of ${active.glyphs.length} glyphs`} />
            </div>
            <div className="collective-story max-w-2xl">
              <p className="mb-7 text-xs tracking-[0.28em] text-white/42">A NEW PATH ENTERS THE FIELD</p>
              <div className="font-display text-[clamp(2rem,3.8vw,4.25rem)] leading-[1.08] tracking-[-0.035em]">
                {active.narrative.map((line, index) => (
                  <p key={`${index}-${line}`} className="my-2">{line}</p>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      <footer className="absolute inset-x-0 bottom-0 z-30 flex items-end justify-between px-8 py-7 text-[10px] tracking-[0.18em] text-white/25 lg:px-12 lg:py-9">
        <p>Every path leaves a trace</p>
        <p>Stories dissolve. Connections remain.</p>
      </footer>
    </main>
  );
}
