import type { Metadata } from "next";
import { CreatureShapeEditor } from "@/components/creature-editor/CreatureShapeEditor";

export const metadata: Metadata = {
  title: "Creature Shape Editor — The Fishbow Leaks",
  description: "Inspect and adjust the base shapes used to construct the aquarium creatures.",
};

export default function CreateEditorPage() {
  return <CreatureShapeEditor />;
}
