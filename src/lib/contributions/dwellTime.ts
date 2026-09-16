type TimedDiscovery = {
  discoveredAt: number;
};

export function calculateDwellTimes(
  discoveries: TimedDiscovery[],
  completedAt: number,
) {
  return discoveries.map((discovery, index) => {
    const intervalEnd = discoveries[index + 1]?.discoveredAt ?? completedAt;
    return Math.max(0, intervalEnd - discovery.discoveredAt);
  });
}

/**
 * Combines an absolute dwell-time scale with local contrast against the other
 * glyphs in the same story. This preserves cross-story meaning while making
 * small within-story timing differences legible.
 */
export function glyphScaleFromDwellMs(
  dwellMs?: number,
  referenceDwellMs?: number,
) {
  if (dwellMs === undefined || !Number.isFinite(dwellMs)) return 1;
  const minimum = 5_000;
  const maximum = 30 * 60_000;
  const clamped = Math.min(maximum, Math.max(minimum, dwellMs));
  const progress =
    Math.log(clamped / minimum) / Math.log(maximum / minimum);
  const absoluteScale = 0.72 + progress * 1.13;

  if (
    referenceDwellMs === undefined ||
    !Number.isFinite(referenceDwellMs) ||
    referenceDwellMs <= 0
  ) {
    return absoluteScale;
  }

  const relativeContrast =
    Math.log2(Math.max(1_000, dwellMs) / Math.max(1_000, referenceDwellMs)) *
    0.35;
  return Math.min(2.1, Math.max(0.62, absoluteScale + relativeContrast));
}

export function dwellTimeReference(dwellTimes: Array<number | undefined>) {
  const valid = dwellTimes.filter(
    (value): value is number =>
      value !== undefined && Number.isFinite(value) && value >= 0,
  );
  if (valid.length === 0) return undefined;

  const meanLog =
    valid.reduce((sum, value) => sum + Math.log(Math.max(1_000, value)), 0) /
    valid.length;
  return Math.exp(meanLog);
}
