import Database from "better-sqlite3";
import { existsSync, mkdirSync } from "fs";
import { homedir } from "os";
import { join } from "path";

const DB_DIR = join(homedir(), ".veyra-snippets");
const DB_PATH = join(DB_DIR, "data.db");

if (!existsSync(DB_DIR)) {
  mkdirSync(DB_DIR, { recursive: true });
}

const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS snippets (
    id         TEXT PRIMARY KEY,
    title      TEXT NOT NULL,
    code       TEXT NOT NULL,
    language   TEXT NOT NULL,
    tags       TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )
`);

export interface Snippet {
  id: string;
  title: string;
  code: string;
  language: string;
  tags: string | null;
  created_at: string;
  updated_at: string;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function list(filters: {
  language?: string;
  tag?: string;
}): Snippet[] {
  const conditions: string[] = [];
  const params: string[] = [];

  if (filters.language) {
    conditions.push("language = ?");
    params.push(filters.language);
  }
  if (filters.tag) {
    conditions.push("tags LIKE ?");
    params.push(`%${filters.tag}%`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const stmt = db.prepare(
    `SELECT * FROM snippets ${where} ORDER BY updated_at DESC`
  );
  return stmt.all(...params) as Snippet[];
}

export function get(id: string): Snippet | undefined {
  const stmt = db.prepare("SELECT * FROM snippets WHERE id = ?");
  return stmt.get(id) as Snippet | undefined;
}

export function search(query: string, limit = 50): Snippet[] {
  const stmt = db.prepare(
    "SELECT * FROM snippets WHERE title LIKE ? OR code LIKE ? OR language LIKE ? OR tags LIKE ? ORDER BY updated_at DESC LIMIT ?"
  );
  const pattern = `%${query}%`;
  return stmt.all(pattern, pattern, pattern, pattern, limit) as Snippet[];
}

export function save(
  title: string,
  code: string,
  language: string,
  tags?: string
): Snippet {
  const now = new Date().toISOString();
  const id = generateId();
  const stmt = db.prepare(
    "INSERT INTO snippets (id, title, code, language, tags, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
  );
  stmt.run(id, title, code, language, tags ?? null, now, now);
  return get(id)!;
}

export function update(
  id: string,
  fields: { code?: string; title?: string }
): Snippet | undefined {
  const existing = get(id);
  if (!existing) return undefined;
  const now = new Date().toISOString();
  const title = fields.title ?? existing.title;
  const code = fields.code ?? existing.code;
  const stmt = db.prepare(
    "UPDATE snippets SET title = ?, code = ?, updated_at = ? WHERE id = ?"
  );
  stmt.run(title, code, now, id);
  return get(id)!;
}

export function del(id: string): boolean {
  const stmt = db.prepare("DELETE FROM snippets WHERE id = ?");
  const result = stmt.run(id);
  return result.changes > 0;
}
