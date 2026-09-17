import type {
  CollectiveHeatDatum,
  ExhibitionContribution,
} from "@/types/contribution";

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
