"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { CollectiveVisualizationField } from "@/components/collective/CollectiveVisualizationField";
import { CollectiveHeatmap } from "@/components/collective/CollectiveHeatmap";
import { PathVisualization } from "@/components/visualization/PathVisualization";
import { BiomeBackdrop } from "@/components/visualization/BiomeBackdrop";
import { activeVisualizationCopy } from "@/config/visualization";
import { artifacts } from "@/data/artifacts";
import { aggregateContributionDwellTimes } from "@/lib/contributions/heatmap";
import type { CollectiveHeatDatum, ExhibitionContribution } from "@/types/contribution";

const ARRIVAL_DURATION_MS = 17_000;
const MINUTES_IN_DAY = 24 * 60 - 1;
const osloClock = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Oslo",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function minuteOfDay(value: Date | string) {
  const parts = Object.fromEntries(
    osloClock.formatToParts(new Date(value)).map((part) => [part.type, part.value]),
  );
  return Number(parts.hour) * 60 + Number(parts.minute);
}

function formatMinute(value: number) {
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function tankState(progress: number) {
  if (progress < 0.25) return "cataloguing";
  if (progress < 0.5) return "pressure rising";
  if (progress < 0.75) return "labels loosening";
  return "open water";
}

export function CollectiveWall() {
  const [contributions, setContributions] = useState<ExhibitionContribution[]>([]);
  const [heatmap, setHeatmap] = useState<CollectiveHeatDatum[]>([]);
  const [view, setView] = useState<"collective" | "heatmap">("collective");
  const [active, setActive] = useState<ExhibitionContribution | null>(null);
  const [connected, setConnected] = useState(true);
  const [ready, setReady] = useState(false);
  const [clockMinutes, setClockMinutes] = useState(() => minuteOfDay(new Date()));
  const [liveTime, setLiveTime] = useState(true);
  const latestId = useRef(0);
  const initialized = useRef(false);
  const activeRef = useRef<ExhibitionContribution | null>(null);
  const queueRef = useRef<ExhibitionContribution[]>([]);
  const cycleDateRef = useRef<string | null>(null);
  const syntheticCountRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      try {
        const response = await fetch(`/api/contributions?after=${latestId.current}&limit=100`, { cache: "no-store" });
        if (!response.ok) throw new Error("Collective aquarium unavailable");
        const data = (await response.json()) as {
          contributions: ExhibitionContribution[];
          heatmap: CollectiveHeatDatum[];
          cycleDate: string;
          syntheticCount: number;
        };
        if (cancelled) return;

        if (cycleDateRef.current && cycleDateRef.current !== data.cycleDate) {
          latestId.current = 0;
          queueRef.current = [];
          activeRef.current = null;
          setActive(null);
          setContributions([]);
        }
        cycleDateRef.current = data.cycleDate;

        const syntheticDatasetWasRemoved =
          syntheticCountRef.current !== null &&
          data.syntheticCount < syntheticCountRef.current;
        syntheticCountRef.current = data.syntheticCount;
        if (syntheticDatasetWasRemoved) {
          latestId.current = 0;
          queueRef.current = [];
          activeRef.current = null;
          setActive(null);
          setContributions([]);
          setHeatmap(data.heatmap);
          return;
        }

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
        setHeatmap(data.heatmap);
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
    if (!liveTime) return;
    const updateClock = () => setClockMinutes(minuteOfDay(new Date()));
    updateClock();
    const interval = window.setInterval(updateClock, 30_000);
    return () => window.clearInterval(interval);
  }, [liveTime]);

  useEffect(() => {
    if (!active) return;
    const timeout = window.setTimeout(() => {
      const next = queueRef.current.shift() ?? null;
      activeRef.current = next;
      setActive(next);
    }, ARRIVAL_DURATION_MS);
    return () => window.clearTimeout(timeout);
  }, [active]);

  const visibleContributions = useMemo(
    () => contributions.filter((contribution) => minuteOfDay(contribution.createdAt) <= clockMinutes),
    [clockMinutes, contributions],
  );
  const visibleActive = liveTime && active && minuteOfDay(active.createdAt) <= clockMinutes ? active : null;
  const habitatCreatures = useMemo(
    () => visibleContributions.filter((contribution) => contribution.id !== visibleActive?.id),
    [visibleActive?.id, visibleContributions],
  );
  const recentContributions = useMemo(
    () => visibleContributions.slice(-5).reverse(),
    [visibleContributions],
  );
  const visibleHeatmap = useMemo(
    () => liveTime
      ? heatmap
      : aggregateContributionDwellTimes(visibleContributions, artifacts.map((artifact) => artifact.id)),
    [heatmap, liveTime, visibleContributions],
  );
  const latestContribution = recentContributions[0];
  const previousContributions = recentContributions.slice(1);
  const dayProgress = clockMinutes / MINUTES_IN_DAY;
  const wallStyle = { "--tank-progress": dayProgress } as CSSProperties;
  const wallOpenings = [0.14, 0.32, 0.5, 0.68].map((threshold) =>
    Math.max(0, Math.min(1, (dayProgress - threshold) / 0.16)),
  );
  const wallPositions = [18, 46, 60, 84];
  const holePositions = [34, 66, 43, 72];

  return (
    <main className="collective-wall biome-field film-grain relative h-screen overflow-hidden bg-[var(--abyss)] text-[var(--foam)]" style={wallStyle} aria-label={`Collective exhibition ${activeVisualizationCopy.collectivePlace}`}>
      <BiomeBackdrop progress={dayProgress} />
      <div className="tank-compartments pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="tank-compartment tank-compartment-one"><span>memory shelf</span></div>
        <div className="tank-compartment tank-compartment-two"><span>synthetic voice</span></div>
        <div className="tank-compartment tank-compartment-three"><span>stable specimens</span></div>
        <div className="tank-compartment tank-compartment-four"><span>correspondence</span></div>
        <div className="tank-compartment tank-compartment-five"><span>irregular organisms</span></div>
        {wallOpenings.map((opening, index) => (
          <div
            key={wallPositions[index]}
            className="compartment-wall"
            style={{
              "--wall-left": `${wallPositions[index]}%`,
              "--wall-open": opening,
              "--wall-hole": holePositions[index],
              "--wall-top-height": `${Math.max(0, holePositions[index] - opening * 31)}%`,
              "--wall-bottom-height": `${Math.max(0, 100 - holePositions[index] - opening * 31)}%`,
            } as CSSProperties}
          >
            <i className="compartment-wall-top" />
            <i className="compartment-wall-bottom" />
            <b className="compartment-breach" />
          </div>
        ))}
      </div>
      <div className="compartment-flows pointer-events-none absolute inset-0" aria-hidden="true">
        <span /><span /><span /><span />
      </div>
      {view === "collective" ? (
        <div className="collective-swim-field absolute" aria-live="polite">
          <CollectiveVisualizationField contributions={habitatCreatures} progress={dayProgress} />
        </div>
      ) : (
        <CollectiveHeatmap data={visibleHeatmap} />
      )}

      <header className="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-8 py-7 lg:px-12 lg:py-9">
        <div>
          <h1 className="font-display text-xl tracking-[-0.03em] lg:text-2xl">The Tank Is Leaking</h1>
          <p className="mt-1 text-sm text-white/45">Shared aquarium · daily cycle</p>
        </div>
        <div className="absolute left-1/2 flex -translate-x-1/2 rounded-full border border-white/12 bg-black/20 p-1 text-[10px] tracking-[0.18em] backdrop-blur-md" role="group" aria-label="Collective view">
          <button
            type="button"
            className={`rounded-full px-4 py-2 transition-colors ${view === "collective" ? "bg-white/12 text-white/85" : "text-white/35 hover:text-white/60"}`}
            aria-pressed={view === "collective"}
            onClick={() => setView("collective")}
          >
            Aquarium
          </button>
          <button
            type="button"
            className={`rounded-full px-4 py-2 transition-colors ${view === "heatmap" ? "bg-white/12 text-white/85" : "text-white/35 hover:text-white/60"}`}
            aria-pressed={view === "heatmap"}
            onClick={() => setView("heatmap")}
          >
            Activity
          </button>
        </div>
        <div className="flex items-center gap-6 text-xs tracking-[0.18em] text-white/42">
          <span>{visibleContributions.length} {visibleContributions.length === 1 ? activeVisualizationCopy.singular : activeVisualizationCopy.plural}</span>
          <span className="flex items-center gap-2">
            <span className={`size-1.5 rounded-full ${connected ? "bg-emerald-300" : "bg-amber-300"}`} aria-hidden="true" />
            {connected ? "listening" : "reconnecting"}
          </span>
        </div>
      </header>

      <section className="tank-time-control absolute left-1/2 top-24 z-40 w-[min(42rem,calc(100vw-3rem))] -translate-x-1/2 border border-white/20 bg-[var(--abyss)] px-5 py-4" aria-label="Test aquarium time progression">
        <div className="mb-3 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm text-white/50">Test time of day</p>
            <p className="font-display text-3xl text-[var(--phosphor)]">{formatMinute(clockMinutes)}</p>
          </div>
          <div className="text-right">
            <p className="text-base text-white/80">{tankState(dayProgress)}</p>
            <button
              type="button"
              onClick={() => setLiveTime(true)}
              className="mt-1 min-h-8 text-sm text-white/50 underline decoration-white/25 underline-offset-4 disabled:no-underline"
              disabled={liveTime}
            >
              {liveTime ? "following live time" : "return to live time"}
            </button>
          </div>
        </div>
        <label className="sr-only" htmlFor="tank-time-slider">Time of day</label>
        <input
          id="tank-time-slider"
          className="tank-time-slider w-full"
          type="range"
          min="0"
          max={MINUTES_IN_DAY}
          step="1"
          value={clockMinutes}
          onChange={(event) => {
            setLiveTime(false);
            setClockMinutes(Number(event.target.value));
          }}
        />
        <div className="mt-1 flex justify-between text-xs text-white/35" aria-hidden="true">
          <span>00:00 · ordered</span>
          <span>12:00 · unstable</span>
          <span>23:59 · open</span>
        </div>
      </section>

      {view === "collective" && visibleContributions.length === 0 && ready && (
        <div className="absolute inset-0 flex items-center justify-center text-center">
          <div>
            <div className="mx-auto mb-8 size-2 rounded-full bg-white/70 shadow-[0_0_32px_10px_rgba(255,255,255,.24)] animate-breathe" />
            <p className="font-display text-3xl text-white/72">The tank is ordered. For now.</p>
            <p className="mt-3 text-sm text-white/40">Waiting for the first visitor specimen</p>
          </div>
        </div>
      )}

      {view === "collective" && visibleActive && (
        <section key={visibleActive.id} className="collective-arrival absolute inset-0 z-20 grid place-items-center" aria-label={`A new visitor ${activeVisualizationCopy.singular} has arrived`}>
          <div className="collective-arrival-glow absolute inset-0" aria-hidden="true" />
          <div className="collective-arrival-creature absolute inset-y-0 left-0 w-[68vw]">
            <PathVisualization
              artifactIds={visibleActive.parts.map((part) => part.artifactId)}
              contribution={visibleActive}
              fitToView
              fitScale={1.25}
              label={`New ${activeVisualizationCopy.singular} with ${visibleActive.parts.length} parts`}
            />
          </div>
          <div className="collective-story relative z-10 ml-auto mr-[6vw] w-[min(34vw,36rem)]">
              <p className="mb-3 text-base text-[var(--phosphor)]">A new specimen has entered the tank</p>
              <p className="mb-6 text-sm text-white/45">
                Made from {visibleActive.parts.length} exhibition {visibleActive.parts.length === 1 ? "encounter" : "encounters"}
              </p>
              <p className="mb-7 font-mono text-sm text-white/55">
                Specimen {String(visibleActive.id).padStart(3, "0")} has been successfully <s>classified</s> <s>contained</s> <s>understood</s>
              </p>
              <div className="font-display text-[clamp(1.35rem,1.9vw,2.15rem)] leading-[1.16] tracking-[-0.025em]">
                {visibleActive.narrative.map((line, index) => (
                  <p key={`${index}-${line}`} className="my-1.5">{line}</p>
                ))}
              </div>
          </div>
        </section>
      )}

      {view === "collective" && latestContribution && (
        <aside
          className="collective-recents absolute inset-x-0 bottom-0 z-10 h-[clamp(12rem,23vh,16rem)] bg-gradient-to-t from-[#030405] via-[#030405]/95 to-[#030405]/80 px-8 pb-6 lg:px-12 lg:pb-7"
          aria-label={`Most recently shared stories and ${activeVisualizationCopy.plural}`}
        >
          <div className="grid h-full grid-cols-[minmax(24rem,1.5fr)_minmax(20rem,1fr)] border-t border-white/12 pt-4">
            <article className="grid min-w-0 grid-cols-[clamp(7rem,9vw,9rem)_1fr] items-center gap-5 border-r border-white/12 pr-8">
              <div className="aspect-square w-full">
                <PathVisualization
                  artifactIds={latestContribution.parts.map((part) => part.artifactId)}
                  contribution={latestContribution}
                  compact
                  zoom={34}
                  label={`Latest ${activeVisualizationCopy.singular} with ${latestContribution.parts.length} parts`}
                />
              </div>
              <div className="min-w-0">
                <p className="mb-3 text-sm text-white/40">Latest released story</p>
                <div className="font-display text-[clamp(1.15rem,1.45vw,1.75rem)] leading-[1.12] tracking-[-0.025em] text-white/82">
                  {latestContribution.narrative.map((line, index) => (
                    <p key={`${index}-${line}`} className="my-0.5">{line}</p>
                  ))}
                </div>
                <p className="mt-4 text-[10px] tracking-[0.2em] text-white/30">
                  {latestContribution.parts.length} {latestContribution.parts.length === 1 ? "encounter" : "encounters"}
                </p>
              </div>
            </article>

            <div className="grid min-w-0 grid-cols-2 grid-rows-2 gap-x-5 gap-y-2 pl-8">
              {previousContributions.map((contribution, index) => (
                <article key={contribution.id} className="grid min-w-0 grid-cols-[minmax(0,4.5rem)_1fr] items-center gap-3">
                  <div className="aspect-square w-full opacity-75">
                    <PathVisualization
                      artifactIds={contribution.parts.map((part) => part.artifactId)}
                      contribution={contribution}
                      compact
                      label={`Recent ${activeVisualizationCopy.singular} ${index + 2} with ${contribution.parts.length} parts`}
                    />
                  </div>
                  <p className="line-clamp-2 font-display text-sm leading-[1.15] tracking-[-0.015em] text-white/60">
                    {contribution.narrative.join(" ")}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </aside>
      )}
    </main>
  );
}
