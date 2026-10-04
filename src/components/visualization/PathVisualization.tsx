"use client";

import { CreatureCanvas } from "@/components/creature/CreatureCanvas";
import { JourneyConstellation } from "@/components/particles/JourneyConstellation";
import { AbstractCreatureCanvas } from "@/components/visualization/AbstractCreatureCanvas";
import { NetworkGlyph } from "@/components/visualization/NetworkGlyph";
import { visualizationDesign } from "@/config/visualization";
import type { ExhibitionContribution } from "@/types/contribution";
import type { CreaturePartId } from "@/types/exhibition";
import type { AquaticForm } from "@/lib/creature/aquaticForms";
import { creatureSizeScale } from "@/lib/creature/aquaticForms";

export function PathVisualization({
  artifactIds,
  contribution,
  highlightedPart,
  compact = false,
  zoom,
  fitToView = false,
  fitScale = 1,
  creatureForm,
  creatureSeed,
  label,
}: {
  artifactIds: string[];
  contribution?: ExhibitionContribution;
  highlightedPart?: CreaturePartId;
  compact?: boolean;
  zoom?: number;
  fitToView?: boolean;
  fitScale?: number;
  creatureForm?: AquaticForm | null;
  creatureSeed?: string;
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
      fitToView={fitToView}
      fitScale={fitScale}
      creatureScale={contribution ? creatureSizeScale(contribution.publicId) : 1}
      creatureForm={contribution?.creatureForm ?? creatureForm ?? "fish"}
      creatureSeed={contribution?.publicId ?? creatureSeed}
      label={label}
    />
  );
}
