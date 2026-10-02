import type {
  CollectiveHeatDatum,
  ExhibitionContribution,
} from "@/types/contribution";

export function artifactPlanLabel(title: string) {
  return title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function collectiveActivityIntensities(data: CollectiveHeatDatum[]) {
  const peakDwell = Math.max(1, ...data.map((datum) => datum.totalDwellMs));
  const peakVisits = Math.max(1, ...data.map((datum) => datum.visitCount));

  return new Map(data.map((datum) => {
    if (datum.totalDwellMs <= 0 || datum.visitCount <= 0) {
      return [datum.artifactId, 0] as const;
    }
    const dwell = Math.log1p(datum.totalDwellMs) / Math.log1p(peakDwell);
    const visits = Math.log1p(datum.visitCount) / Math.log1p(peakVisits);
    return [datum.artifactId, dwell * 0.6 + visits * 0.4] as const;
  }));
}

export function aggregateContributionDwellTimes(
  contributions: ExhibitionContribution[],
  artifactIds: string[],
): CollectiveHeatDatum[] {
  const totals = new Map(
    artifactIds.map((artifactId) => [
      artifactId,
      { totalDwellMs: 0, visitCount: 0 },
    ]),
  );

  for (const contribution of contributions) {
    for (const part of contribution.parts) {
      if (
        part.dwellMs === undefined ||
        !Number.isFinite(part.dwellMs) ||
        part.dwellMs < 0
      ) {
        continue;
      }
      const aggregate = totals.get(part.artifactId);
      if (!aggregate) continue;
      aggregate.totalDwellMs += part.dwellMs;
      aggregate.visitCount += 1;
    }
  }

  return artifactIds.map((artifactId) => {
    const aggregate = totals.get(artifactId)!;
    return {
      artifactId,
      totalDwellMs: aggregate.totalDwellMs,
      visitCount: aggregate.visitCount,
      averageDwellMs:
        aggregate.visitCount > 0
          ? Math.round(aggregate.totalDwellMs / aggregate.visitCount)
          : 0,
    };
  });
}
