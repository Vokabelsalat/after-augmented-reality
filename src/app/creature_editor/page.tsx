import type { Metadata } from "next";
import { CreatureShapeEditor } from "@/components/creature-editor/CreatureShapeEditor";

export const metadata: Metadata = {
  title: "Creature Shape Editor — The Fishbowl Leaks",
  description: "Inspect and adjust the models and base shapes used to construct the aquarium creatures and plants.",
};

export default function CreateEditorPage() {
  return <CreatureShapeEditor />;
}
