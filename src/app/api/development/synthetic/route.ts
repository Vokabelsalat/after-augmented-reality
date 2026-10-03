import {
  clearSyntheticContributions,
  createContribution,
  getCycleStartIso,
  getSyntheticContributionCount,
} from "@/lib/contributions/database";
import {
  createSyntheticDataset,
  SYNTHETIC_VISITOR_COUNT,
} from "@/lib/development/syntheticDataset";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const responseHeaders = { "Cache-Control": "no-store" };

function developmentOnly() {
  return process.env.NODE_ENV !== "production";
}

function unavailable() {
  return Response.json(
    { error: "Synthetic exhibition data is only available during development." },
    { status: 404, headers: responseHeaders },
  );
}

export async function GET() {
  if (!developmentOnly()) return unavailable();
  const count = getSyntheticContributionCount();
  return Response.json(
    { active: count > 0, count, availableCount: SYNTHETIC_VISITOR_COUNT },
    { headers: responseHeaders },
  );
}

export async function POST(request: Request) {
  if (!developmentOnly()) return unavailable();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  if (!body || typeof body !== "object" || typeof (body as { active?: unknown }).active !== "boolean") {
    return Response.json({ error: "The active state is required." }, { status: 422 });
  }

  const active = (body as { active: boolean }).active;
  clearSyntheticContributions();
  if (active) {
    for (const contribution of createSyntheticDataset(getCycleStartIso())) {
      createContribution({ ...contribution, synthetic: true });
    }
  }

  const count = getSyntheticContributionCount();
  return Response.json(
    { active: count > 0, count, availableCount: SYNTHETIC_VISITOR_COUNT },
    { headers: responseHeaders },
  );
}
