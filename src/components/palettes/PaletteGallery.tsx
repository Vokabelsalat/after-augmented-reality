"use client";

import { useState } from "react";
import { CreatureCanvas } from "@/components/creature/CreatureCanvas";
import { aquaticForms, aquaticFormLabels, type AquaticForm } from "@/lib/creature/aquaticForms";
import { marinePalettes, type CreatureColorPalette } from "@/lib/creature/colorPalettes";
import { creaturePatternKinds, type CreaturePattern, type CreaturePatternKind } from "@/lib/creature/patterns";

const roles: Array<{ key: keyof CreatureColorPalette; label: string }> = [
  { key: "body", label: "Body" },
  { key: "head", label: "Head" },
  { key: "belly", label: "Belly" },
  { key: "fin", label: "Fin" },
  { key: "marking", label: "Marking" },
];

// The same pattern and proportions on every card, so only the colors differ between them.
const previewProportions = { x: 1, y: 1, z: 1 };

function ChoiceRow<T extends string>({
  label,
  options,
  value,
  onChange,
  describe,
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  describe: (value: T) => string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label={label}>
      <span className="mr-2 text-sm">{label}</span>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={option === value}
          onClick={() => onChange(option)}
          className={`min-h-10 border px-4 text-sm transition-colors ${option === value ? "border-white text-white" : "border-white/30 text-white/70 hover:border-white/70 hover:text-white"}`}
        >
          {describe(option)}
        </button>
      ))}
    </div>
  );
}

export function PaletteGallery() {
  const [form, setForm] = useState<AquaticForm>("fish");
  const [patternKind, setPatternKind] = useState<CreaturePatternKind>("plain");
  const pattern: CreaturePattern = { kind: patternKind, density: 2, orientation: "along", contrast: 0.85, seed: 7 };

  return (
    <div>
      <div className="mb-10 flex flex-col gap-4">
        <ChoiceRow label="Creature" options={aquaticForms} value={form} onChange={setForm} describe={(option) => aquaticFormLabels[option]} />
        <ChoiceRow label="Pattern" options={creaturePatternKinds} value={patternKind} onChange={setPatternKind} describe={(option) => option} />
      </div>

      <ol className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {marinePalettes.map((palette, index) => (
          <li key={Object.values(palette).join("")} className="border border-white/15">
            <div className="h-56" style={{ background: `radial-gradient(circle at 50% 45%, ${palette.belly}26, transparent 70%)` }}>
              <CreatureCanvas
                artifactIds={["finding-frida", "goliath"]}
                creatureForm={form}
                creatureSeed="palette-preview"
                creaturePalette={palette}
                creaturePattern={pattern}
                creatureProportions={previewProportions}
                fitToView
                interactive
                label={`${aquaticFormLabels[form]} in palette ${index + 1}`}
              />
            </div>
            <div className="border-t border-white/15 p-5">
              <h2 className="font-display text-2xl">Palette {index + 1}</h2>
              <dl className="mt-4 grid gap-2">
                {roles.map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-3 text-sm">
                    <span className="size-6 shrink-0 border border-white/20" style={{ backgroundColor: palette[key] }} aria-hidden="true" />
                    <dt className="w-20">{label}</dt>
                    <dd className="font-mono">{palette[key]}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
