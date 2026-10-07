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
import type { CreatureColorPalette } from "@/lib/creature/colorPalettes";
import type { CreaturePattern } from "@/lib/creature/patterns";

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
  creaturePalette,
  creaturePattern,
  emergingArtifactId,
  emerging = false,
  label,
  interactive = false,
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
  creaturePalette?: CreatureColorPalette;
  creaturePattern?: CreaturePattern;
  /** A newly found trait that is held back until `emerging` turns true, then grows in. */
  emergingArtifactId?: string;
  emerging?: boolean;
  label?: string;
  interactive?: boolean;
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
        artifactIds={emerging ? artifactIds : artifactIds.filter((id) => id !== emergingArtifactId)}
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
      creatureSeed={creatureSeed ?? contribution?.publicId}
      creaturePalette={contribution?.creaturePalette ?? creaturePalette}
      creaturePattern={contribution?.creaturePattern ?? creaturePattern}
      emergingArtifactId={emergingArtifactId}
      emerging={emerging}
      label={label}
      interactive={interactive}
    />
  );
}
