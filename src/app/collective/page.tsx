import type { Metadata } from "next";
import { CollectiveWall } from "@/components/collective/CollectiveWall";
import { activeVisualizationCopy } from "@/config/visualization";

export const metadata: Metadata = {
  title: "Collective Field — After Augmented Reality",
  description: `A live ${activeVisualizationCopy.collectivePlace} of ${activeVisualizationCopy.plural} made by exhibition visitors.`,
};

export default function CollectivePage() {
  return <CollectiveWall />;
}
