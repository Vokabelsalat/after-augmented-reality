import type { Metadata } from "next";
import { CollectiveWall } from "@/components/collective/CollectiveWall";

export const metadata: Metadata = {
  title: "Collective Field — After Augmented Reality",
  description: "A live habitat of creatures made by exhibition visitors.",
};

export default function CollectivePage() {
  return <CollectiveWall />;
}
