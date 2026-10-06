import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Orientation } from "@/components/particles/constellationPainter";
import { artifactById } from "@/data/artifacts";
import { constellationOrientations } from "@/data/constellationOrientations";
import {
  CONSTELLATION_ORIENTATIONS_FILE,
  formatConstellationOrientations,
} from "@/lib/development/constellationOrientationFile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const responseHeaders = { "Cache-Control": "no-store" };

function developmentOnly() {
  return process.env.NODE_ENV !== "production";
}

function isOrientation(value: unknown): value is Orientation {
  if (!value || typeof value !== "object") return false;
  const { yaw, pitch, roll } = value as Record<string, unknown>;
  return [yaw, pitch, roll ?? 0].every(
    (angle) => typeof angle === "number" && Number.isFinite(angle) && Math.abs(angle) < 1000,
  );
}

// Saves gallery orientations into src/data/constellationOrientations.ts,
// merged with the ones already saved.
export async function POST(request: Request) {
  if (!developmentOnly()) {
    return Response.json(
      { error: "Constellation orientations can only be saved during development." },
      { status: 404, headers: responseHeaders },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "The body is not JSON." }, { status: 400, headers: responseHeaders });
  }
  const changes = (body as { orientations?: unknown } | null)?.orientations;
  if (!changes || typeof changes !== "object") {
    return Response.json({ error: "Missing orientations." }, { status: 400, headers: responseHeaders });
  }

  const next: Record<string, Orientation> = { ...constellationOrientations };
  for (const [id, orientation] of Object.entries(changes)) {
    if (!artifactById.has(id)) {
      return Response.json({ error: `Unknown artifact ${id}.` }, { status: 400, headers: responseHeaders });
    }
    if (!isOrientation(orientation)) {
      return Response.json({ error: `Invalid orientation for ${id}.` }, { status: 400, headers: responseHeaders });
    }
    next[id] = { yaw: orientation.yaw, pitch: orientation.pitch, roll: orientation.roll ?? 0 };
  }

  await writeFile(
    join(process.cwd(), CONSTELLATION_ORIENTATIONS_FILE),
    formatConstellationOrientations(next),
  );
  return Response.json({ saved: Object.keys(changes) }, { headers: responseHeaders });
}
