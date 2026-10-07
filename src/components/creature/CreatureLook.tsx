"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { CreaturePattern } from "@/lib/creature/patterns";
import type { CreatureProportions } from "@/lib/creature/proportions";

type Point = [number, number, number];

/** The stored look of the creature being drawn, provided by AquaticCreatureModel. */
export const CreatureLookContext = createContext<{
  pattern?: CreaturePattern;
  markingColor?: string;
  proportions?: CreatureProportions;
}>({});

function useStretch(): Point {
  const { proportions } = useContext(CreatureLookContext);
  return proportions ? [proportions.x, proportions.y, proportions.z] : [1, 1, 1];
}

/**
 * Stretches a creature's main body by its stored proportions around `origin`, the centre of the
 * body. Wrap the body and whatever lies on its skin; the parts keep their own positions and
 * scales, so the shape editor's saved adjustments still apply to them.
 */
export function BodyProportions({ origin = [0, 0, 0], children }: { origin?: Point; children: ReactNode }) {
  const stretch = useStretch();
  return (
    <group position={origin}>
      <group scale={stretch}>
        <group position={[-origin[0], -origin[1], -origin[2]]}>{children}</group>
      </group>
    </group>
  );
}

/**
 * Keeps a part such as an eye or fin on the stretched skin without stretching the part: it moves
 * by as much as the stretch moves `anchor`, the point where it meets the body (relative to the
 * same `origin` as the body).
 */
export function BodyAttachment({ anchor, origin = [0, 0, 0], children }: { anchor: Point; origin?: Point; children: ReactNode }) {
  const stretch = useStretch();
  const shift = anchor.map((value, axis) => (value - origin[axis]) * (stretch[axis] - 1)) as Point;
  return <group position={shift}>{children}</group>;
}
