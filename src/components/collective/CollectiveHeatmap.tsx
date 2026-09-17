"use client";

import { useMemo, type CSSProperties } from "react";
import { artifacts } from "@/data/artifacts";
import type { CollectiveHeatDatum } from "@/types/contribution";

function formatDuration(durationMs: number) {
  if (durationMs <= 0) return "0 min";
  const totalMinutes = Math.round(durationMs / 60_000);
  if (totalMinutes < 1) return "<1 min";
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes === 0 ? `${hours} hr` : `${hours} hr ${minutes} min`;
}

export function CollectiveHeatmap({ data }: { data: CollectiveHeatDatum[] }) {
  const stations = useMemo(() => {
    const byId = new Map(data.map((datum) => [datum.artifactId, datum]));
    const combined = artifacts.map((artifact) => ({
      artifact,
      datum: byId.get(artifact.id) ?? {
        artifactId: artifact.id,
        totalDwellMs: 0,
        visitCount: 0,
        averageDwellMs: 0,
      },
    }));
    const peak = Math.max(1, ...combined.map(({ datum }) => datum.totalDwellMs));
    const ranked = [...combined].sort(
      (a, b) => b.datum.totalDwellMs - a.datum.totalDwellMs,
    );
    const rankById = new Map(
      ranked.map(({ artifact }, index) => [artifact.id, index + 1]),
    );

    return combined.map((item) => ({
      ...item,
      intensity: item.datum.totalDwellMs / peak,
      rank: rankById.get(item.artifact.id)!,
    }));
  }, [data]);

  const totalVisits = stations.reduce(
    (sum, { datum }) => sum + datum.visitCount,
    0,
  );
  const totalDwellMs = stations.reduce(
    (sum, { datum }) => sum + datum.totalDwellMs,
    0,
  );
  const hottest = [...stations].sort(
    (a, b) => b.datum.totalDwellMs - a.datum.totalDwellMs,
  )[0];

  return (
    <section className="absolute inset-x-0 bottom-0 top-24 z-10 flex flex-col px-8 pb-8 pt-5 lg:px-12" aria-label="Collective dwell-time heat map">
      <div className="mb-5 flex items-end justify-between border-b border-white/10 pb-4">
        <div>
          <p className="text-[10px] tracking-[0.26em] text-white/35">TIME SPENT ACROSS ALL SHARED JOURNEYS</p>
          <p className="mt-2 font-display text-[clamp(1.4rem,2.1vw,2.4rem)] text-white/85">
            {hottest?.datum.totalDwellMs
              ? `${hottest.artifact.title} holds the most attention`
              : "Waiting for dwell-time data"}
          </p>
        </div>
        <div className="flex gap-8 text-right">
          <div>
            <p className="text-lg text-white/80">{totalVisits}</p>
            <p className="text-[9px] tracking-[0.2em] text-white/30">ARTWORK VISITS</p>
          </div>
          <div>
            <p className="text-lg text-white/80">{formatDuration(totalDwellMs)}</p>
            <p className="text-[9px] tracking-[0.2em] text-white/30">COLLECTIVE TIME</p>
          </div>
        </div>
      </div>

      <div className="collective-heat-grid grid min-h-0 flex-1 grid-cols-5 grid-rows-3 gap-2.5">
        {stations.map(({ artifact, datum, intensity, rank }, index) => {
          const style = {
            "--heat-color": artifact.color,
            "--heat-opacity": 0.14 + Math.max(0.06, intensity) * 0.72,
          } as CSSProperties;
          return (
            <article
              key={artifact.id}
              className={`collective-heat-cell relative min-h-0 overflow-hidden border border-white/10 p-4 ${index === 0 || index === 12 ? "col-span-2" : ""}`}
              style={style}
              aria-label={`${artifact.title}: ${formatDuration(datum.totalDwellMs)} total across ${datum.visitCount} ${datum.visitCount === 1 ? "visit" : "visits"}`}
            >
              <div className="collective-heat-glow absolute inset-0" aria-hidden="true" />
              <div className="relative flex h-full flex-col justify-between">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[9px] tracking-[0.2em] text-white/35">{String(index + 1).padStart(2, "0")}</p>
                  <p className="text-[9px] tracking-[0.18em] text-white/35">RANK {String(rank).padStart(2, "0")}</p>
                </div>
                <div>
                  <p className="font-display text-[clamp(.9rem,1.2vw,1.35rem)] leading-tight text-white/90">{artifact.title}</p>
                  <p className="mt-1 truncate text-[9px] tracking-[0.08em] text-white/38">{artifact.artist}</p>
                  <div className="mt-3 flex items-end justify-between gap-3 border-t border-white/10 pt-2">
                    <p className="text-base text-white/85">{formatDuration(datum.totalDwellMs)}</p>
                    <p className="text-right text-[9px] leading-relaxed tracking-[0.1em] text-white/35">
                      {datum.visitCount} {datum.visitCount === 1 ? "VISIT" : "VISITS"}<br />
                      {formatDuration(datum.averageDwellMs)} AVG
                    </p>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-end gap-3 text-[9px] tracking-[0.16em] text-white/30" aria-hidden="true">
        <span>LESS TIME</span>
        {[0.12, 0.3, 0.55, 0.78, 1].map((opacity) => (
          <span key={opacity} className="size-2 rounded-full bg-[#FF7557]" style={{ opacity }} />
        ))}
        <span>MORE TIME</span>
      </div>
    </section>
  );
}
