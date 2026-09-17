"use client";

import { CreatureCanvas } from "@/components/creature/CreatureCanvas";
import { JourneyConstellation } from "@/components/particles/JourneyConstellation";
import { AbstractCreatureCanvas } from "@/components/visualization/AbstractCreatureCanvas";
import { NetworkGlyph } from "@/components/visualization/NetworkGlyph";
import { visualizationDesign } from "@/config/visualization";
import type { ExhibitionContribution } from "@/types/contribution";
import type { CreaturePartId } from "@/types/exhibition";

export function PathVisualization({
  artifactIds,
  contribution,
  highlightedPart,
  compact = false,
  zoom,
  label,
}: {
  artifactIds: string[];
  contribution?: ExhibitionContribution;
  highlightedPart?: CreaturePartId;
  compact?: boolean;
  zoom?: number;
  label?: string;
}) {
  if (visualizationDesign === "constellation") {
    if (contribution) {
      return <NetworkGlyph contribution={contribution} label={label} />;
    }
    const discoveries = artifactIds.map((artifactId, index) => ({
      artifactId,
      sequence: index + 1,
      discoveredAt: 0,
    }));
    return <JourneyConstellation discoveries={discoveries} variant={compact ? "miniature" : "full"} />;
  }

  if (visualizationDesign === "creature") {
    return (
      <AbstractCreatureCanvas
        artifactIds={artifactIds}
        highlightedPart={highlightedPart}
        compact={compact}
        label={label}
      />
    );
  }

  return (
    <CreatureCanvas
      artifactIds={artifactIds}
      highlightedPart={highlightedPart}
      compact={compact}
      zoom={zoom}
      label={label}
    />
  );
}
