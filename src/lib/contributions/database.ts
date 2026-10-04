import "server-only";

import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { ExhibitionContribution, SharedCreaturePart } from "@/types/contribution";
import { artifactById } from "@/data/artifacts";
import { artifacts } from "@/data/artifacts";
import { aggregateContributionDwellTimes } from "@/lib/contributions/heatmap";
import { isAquaticForm, type AquaticForm } from "@/lib/creature/aquaticForms";
import { generateJourneyNarrative } from "@/lib/narrative/generateJourneyNarrative";

type ContributionRow = {
  id: number;
  public_id: string;
  creature_form: string;
  glyphs_json: string;
  narrative_json: string;
  created_at: string;
};

const globalForDatabase = globalThis as typeof globalThis & {
  exhibitionDatabase?: DatabaseSync;
  exhibitionDatabaseSchemaVersion?: number;
};

const DATABASE_SCHEMA_VERSION = 2;

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

export function getCycleStartIso(now = new Date()) {
  return cycleStartIso(now);
}

function openDatabase() {
  let database = globalForDatabase.exhibitionDatabase;
  if (!database) {
    const databasePath =
      process.env.EXHIBITION_DATABASE_PATH ??
      join(process.cwd(), "data", "exhibition.sqlite");
    mkdirSync(dirname(databasePath), { recursive: true });
    database = new DatabaseSync(databasePath);
    globalForDatabase.exhibitionDatabase = database;
  }

  if (globalForDatabase.exhibitionDatabaseSchemaVersion !== DATABASE_SCHEMA_VERSION) {
    database.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;
      CREATE TABLE IF NOT EXISTS contributions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        public_id TEXT NOT NULL UNIQUE,
        session_id TEXT NOT NULL UNIQUE,
        creature_form TEXT NOT NULL DEFAULT 'fish',
        glyphs_json TEXT NOT NULL,
        narrative_json TEXT NOT NULL,
        is_synthetic INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
      );
      CREATE INDEX IF NOT EXISTS idx_contributions_created_at
        ON contributions(created_at DESC);
      PRAGMA optimize;
    `);
    const contributionColumns = database
      .prepare("PRAGMA table_info(contributions)")
      .all() as unknown as Array<{ name: string }>;
    if (!contributionColumns.some((column) => column.name === "creature_form")) {
      database.exec("ALTER TABLE contributions ADD COLUMN creature_form TEXT NOT NULL DEFAULT 'fish'");
    }
    if (!contributionColumns.some((column) => column.name === "is_synthetic")) {
      database.exec("ALTER TABLE contributions ADD COLUMN is_synthetic INTEGER NOT NULL DEFAULT 0");
    }
    globalForDatabase.exhibitionDatabaseSchemaVersion = DATABASE_SCHEMA_VERSION;
  }

  return database;
}

function deserialize(row: ContributionRow): ExhibitionContribution {
  const storedParts = JSON.parse(row.glyphs_json) as Array<
    Partial<SharedCreaturePart> & Pick<SharedCreaturePart, "artifactId" | "sequence" | "theme" | "color">
  >;
  const parts = storedParts.flatMap((part) => {
    const artifact = artifactById.get(part.artifactId);
    if (!artifact) return [];
    return [{
      ...part,
      partId: part.partId ?? artifact.creaturePart.id,
      label: part.label ?? artifact.creaturePart.label,
    } as SharedCreaturePart];
  });
  const createdAt = Date.parse(row.created_at);
  return {
    id: row.id,
    publicId: row.public_id,
    creatureForm: isAquaticForm(row.creature_form) ? row.creature_form : "fish",
    parts,
    narrative: generateJourneyNarrative(
      parts.map((part) => ({
        artifactId: part.artifactId,
        sequence: part.sequence,
        discoveredAt: createdAt + part.sequence,
      })),
      artifacts,
    ),
    createdAt: row.created_at,
  };
}

export function listContributions(afterId = 0, limit = 80) {
  const rows = openDatabase()
    .prepare(
      `SELECT id, public_id, creature_form, glyphs_json, narrative_json, created_at
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
      `SELECT id, public_id, creature_form, glyphs_json, narrative_json, created_at
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
  creatureForm: AquaticForm;
  parts: SharedCreaturePart[];
  narrative: string[];
  createdAt?: string;
  synthetic?: boolean;
}) {
  const database = openDatabase();
  database
    .prepare(
      `INSERT INTO contributions (public_id, session_id, creature_form, glyphs_json, narrative_json, is_synthetic, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(session_id) DO NOTHING`,
    )
    .run(
      input.publicId,
      input.sessionId,
      input.creatureForm,
      JSON.stringify(input.parts),
      JSON.stringify(input.narrative),
      input.synthetic ? 1 : 0,
      input.createdAt ?? new Date().toISOString(),
    );

  const row = database
    .prepare(
      `SELECT id, public_id, creature_form, glyphs_json, narrative_json, created_at
       FROM contributions
       WHERE session_id = ?`,
    )
    .get(input.sessionId) as unknown as ContributionRow;

  return deserialize(row);
}

export function getSyntheticContributionCount() {
  const row = openDatabase()
    .prepare(
      `SELECT COUNT(*) AS count
       FROM contributions
       WHERE is_synthetic = 1 AND created_at >= ?`,
    )
    .get(cycleStartIso()) as unknown as { count: number };
  return row.count;
}

export function clearSyntheticContributions() {
  const result = openDatabase()
    .prepare("DELETE FROM contributions WHERE is_synthetic = 1")
    .run();
  return Number(result.changes);
}
