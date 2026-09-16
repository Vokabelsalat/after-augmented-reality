import type { Metadata } from "next";
import { CollectiveWall } from "@/components/collective/CollectiveWall";

export const metadata: Metadata = {
  title: "Collective Field — After Augmented Reality",
  description: "A live aquarium of fish made by exhibition visitors.",
};

export default function CollectivePage() {
  return <CollectiveWall />;
}
