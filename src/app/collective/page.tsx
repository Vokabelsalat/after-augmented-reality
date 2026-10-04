import type { Metadata } from "next";
import { CollectiveWall } from "@/components/collective/CollectiveWall";

export const metadata: Metadata = {
  title: "Shared Aquarium — The Fishbowl Leaks",
  description: "A live aquarium of visitor-made creatures, stories and failed classifications.",
};

export default function CollectivePage() {
  return <CollectiveWall />;
}
