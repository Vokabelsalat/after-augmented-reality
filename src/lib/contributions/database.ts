import "server-only";

import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { ExhibitionContribution, SharedCreaturePart } from "@/types/contribution";
import { artifactById } from "@/data/artifacts";
import { artifacts } from "@/data/artifacts";
import { aggregateContributionDwellTimes } from "@/lib/contributions/heatmap";

type ContributionRow = {
  id: number;
  public_id: string;
  glyphs_json: string;
  narrative_json: string;
  created_at: string;
};

const globalForDatabase = globalThis as typeof globalThis & {
  exhibitionDatabase?: DatabaseSync;
};

const exhibitionClock = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Oslo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

function cycleStartIso(now = new Date()) {
  const parts = Object.fromEntries(
    exhibitionClock.formatToParts(now).map((part) => [part.type, part.value]),
  );
  const localMidnightAsUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
  );
  const guess = new Date(localMidnightAsUtc);
  const guessParts = Object.fromEntries(
    exhibitionClock.formatToParts(guess).map((part) => [part.type, part.value]),
  );
  const representedLocalTime = Date.UTC(
    Number(guessParts.year),
    Number(guessParts.month) - 1,
    Number(guessParts.day),
    Number(guessParts.hour),
    Number(guessParts.minute),
    Number(guessParts.second),
  );
  return new Date(localMidnightAsUtc - (representedLocalTime - localMidnightAsUtc)).toISOString();
}

export function getCycleDate(now = new Date()) {
  return exhibitionClock.format(now).slice(0, 10);
}

function openDatabase() {
  if (globalForDatabase.exhibitionDatabase) {
    return globalForDatabase.exhibitionDatabase;
  }

  const databasePath =
    process.env.EXHIBITION_DATABASE_PATH ??
    join(process.cwd(), "data", "exhibition.sqlite");
  mkdirSync(dirname(databasePath), { recursive: true });

  const database = new DatabaseSync(databasePath);
  database.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS contributions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      public_id TEXT NOT NULL UNIQUE,
      session_id TEXT NOT NULL UNIQUE,
      glyphs_json TEXT NOT NULL,
      narrative_json TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );
    CREATE INDEX IF NOT EXISTS idx_contributions_created_at
      ON contributions(created_at DESC);
    PRAGMA optimize;
  `);

  globalForDatabase.exhibitionDatabase = database;
  return database;
}

function deserialize(row: ContributionRow): ExhibitionContribution {
  const storedParts = JSON.parse(row.glyphs_json) as Array<
    Partial<SharedCreaturePart> & Pick<SharedCreaturePart, "artifactId" | "sequence" | "theme" | "color">
  >;
  return {
    id: row.id,
    publicId: row.public_id,
    parts: storedParts.flatMap((part) => {
      const artifact = artifactById.get(part.artifactId);
      if (!artifact) return [];
      return [{
        ...part,
        partId: part.partId ?? artifact.creaturePart.id,
        label: part.label ?? artifact.creaturePart.label,
      } as SharedCreaturePart];
    }),
    narrative: JSON.parse(row.narrative_json) as string[],
    createdAt: row.created_at,
  };
}

export function listContributions(afterId = 0, limit = 80) {
  const rows = openDatabase()
    .prepare(
      `SELECT id, public_id, glyphs_json, narrative_json, created_at
       FROM contributions
       WHERE id > ? AND created_at >= ?
       ORDER BY id ASC
       LIMIT ?`,
    )
    .all(afterId, cycleStartIso(), limit) as unknown as ContributionRow[];

  return rows.map(deserialize);
}

export function getCollectiveHeatmap() {
  const rows = openDatabase()
    .prepare(
      `SELECT id, public_id, glyphs_json, narrative_json, created_at
       FROM contributions
       WHERE created_at >= ?
       ORDER BY id ASC`,
    )
    .all(cycleStartIso()) as unknown as ContributionRow[];

  return aggregateContributionDwellTimes(
    rows.map(deserialize),
    artifacts.map((artifact) => artifact.id),
  );
}

export function createContribution(input: {
  publicId: string;
  sessionId: string;
  parts: SharedCreaturePart[];
  narrative: string[];
}) {
  const database = openDatabase();
  database
    .prepare(
      `INSERT INTO contributions (public_id, session_id, glyphs_json, narrative_json)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(session_id) DO NOTHING`,
    )
    .run(
      input.publicId,
      input.sessionId,
      JSON.stringify(input.parts),
      JSON.stringify(input.narrative),
    );

  const row = database
    .prepare(
      `SELECT id, public_id, glyphs_json, narrative_json, created_at
       FROM contributions
       WHERE session_id = ?`,
    )
    .get(input.sessionId) as unknown as ContributionRow;

  return deserialize(row);
}
