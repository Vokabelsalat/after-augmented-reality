import { randomUUID } from "node:crypto";
import { artifacts, artifactById } from "@/data/artifacts";
import {
  createContribution,
  listContributions,
} from "@/lib/contributions/database";
import { generateJourneyNarrative } from "@/lib/narrative/generateJourneyNarrative";
import type { ContributionSubmission, SharedGlyph } from "@/types/contribution";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const responseHeaders = {
  "Cache-Control": "no-store",
};

function parseSubmission(value: unknown): ContributionSubmission | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<ContributionSubmission>;
  if (
    typeof candidate.sessionId !== "string" ||
    candidate.sessionId.length < 6 ||
    candidate.sessionId.length > 120 ||
    !Array.isArray(candidate.discoveries) ||
    candidate.discoveries.length === 0 ||
    candidate.discoveries.length > artifacts.length
  ) {
    return null;
  }

  const seen = new Set<string>();
  const discoveries = candidate.discoveries
    .map((item) => ({
      artifactId: typeof item?.artifactId === "string" ? item.artifactId : "",
      sequence: Number(item?.sequence),
    }))
    .sort((a, b) => a.sequence - b.sequence);

  const valid = discoveries.every((item, index) => {
    if (
      !artifactById.has(item.artifactId) ||
      seen.has(item.artifactId) ||
      item.sequence !== index + 1
    ) {
      return false;
    }
    seen.add(item.artifactId);
    return true;
  });

  return valid ? { sessionId: candidate.sessionId, discoveries } : null;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const after = Math.max(0, Number.parseInt(url.searchParams.get("after") ?? "0", 10) || 0);
  const limit = Math.min(100, Math.max(1, Number.parseInt(url.searchParams.get("limit") ?? "80", 10) || 80));
  return Response.json(
    { contributions: listContributions(after, limit) },
    { headers: responseHeaders },
  );
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const submission = parseSubmission(body);
  if (!submission) {
    return Response.json(
      { error: "The shared journey is incomplete or invalid." },
      { status: 422 },
    );
  }

  const glyphs: SharedGlyph[] = submission.discoveries.map((discovery) => {
    const artifact = artifactById.get(discovery.artifactId)!;
    return {
      artifactId: artifact.id,
      sequence: discovery.sequence,
      theme: artifact.theme,
      color: artifact.color,
    };
  });
  const narrative = generateJourneyNarrative(submission.discoveries, artifacts);
  const contribution = createContribution({
    publicId: randomUUID(),
    sessionId: submission.sessionId,
    glyphs,
    narrative,
  });

  return Response.json({ contribution }, { status: 201, headers: responseHeaders });
}
