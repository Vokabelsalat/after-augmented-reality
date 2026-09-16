import "server-only";

import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { ExhibitionContribution, SharedGlyph } from "@/types/contribution";

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
  return {
    id: row.id,
    publicId: row.public_id,
    glyphs: JSON.parse(row.glyphs_json) as SharedGlyph[],
    narrative: JSON.parse(row.narrative_json) as string[],
    createdAt: row.created_at,
  };
}

export function listContributions(afterId = 0, limit = 80) {
  const rows = openDatabase()
    .prepare(
      `SELECT id, public_id, glyphs_json, narrative_json, created_at
       FROM contributions
       WHERE id > ?
       ORDER BY id ASC
       LIMIT ?`,
    )
    .all(afterId, limit) as unknown as ContributionRow[];

  return rows.map(deserialize);
}

export function createContribution(input: {
  publicId: string;
  sessionId: string;
  glyphs: SharedGlyph[];
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
      JSON.stringify(input.glyphs),
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
