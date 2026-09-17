"use client";

import { useId, useMemo } from "react";
import {
  dwellTimeReference,
  glyphScaleFromDwellMs,
} from "@/lib/contributions/dwellTime";
import type { ExhibitionContribution } from "@/types/contribution";

export function NetworkGlyph({
  contribution,
  label,
}: {
  contribution: ExhibitionContribution;
  label?: string;
}) {
  const gradientPrefix = useId().replaceAll(":", "");
  const points = useMemo(() => {
    const count = contribution.parts.length;
    if (count === 1) return [{ x: 100, y: 100 }];
    return contribution.parts.map((_, index) => {
      const angle = -Math.PI / 2 + (index / count) * Math.PI * 2;
      const radius = count === 2 ? 48 : 58;
      return {
        x: 100 + Math.cos(angle) * radius,
        y: 100 + Math.sin(angle) * radius,
      };
    });
  }, [contribution.parts]);
  const dwellReference = useMemo(
    () => dwellTimeReference(contribution.parts.map((part) => part.dwellMs)),
    [contribution.parts],
  );

  return (
    <svg
      viewBox="0 0 200 200"
      role={label ? "img" : undefined}
      aria-label={label}
      className="size-full overflow-visible"
    >
      <defs>
        {contribution.parts.map((part, index) => (
          <radialGradient key={part.artifactId} id={`glow-${gradientPrefix}-${contribution.id}-${index}`}>
            <stop offset="0" stopColor="#fff" />
            <stop offset="0.28" stopColor={part.color} stopOpacity=".95" />
            <stop offset="1" stopColor={part.color} stopOpacity="0" />
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
      {points.map((point, index) => {
        const part = contribution.parts[index];
        const scale = glyphScaleFromDwellMs(part.dwellMs, dwellReference);
        return (
          <g key={part.artifactId}>
            <circle
              cx={point.x}
              cy={point.y}
              r={31 * scale}
              fill={`url(#glow-${gradientPrefix}-${contribution.id}-${index})`}
              opacity=".42"
            />
            <circle cx={point.x} cy={point.y} r={3.2 * scale} fill={part.color} />
            <circle
              cx={point.x}
              cy={point.y}
              r={7 * scale}
              fill="none"
              stroke={part.color}
              strokeOpacity=".48"
              strokeWidth=".7"
            />
          </g>
        );
      })}
    </svg>
  );
}
