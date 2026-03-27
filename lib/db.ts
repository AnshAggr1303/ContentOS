import Database from 'better-sqlite3'
import path from 'path'
import type { AuditEntry } from './types'

interface AuditRow {
  id: number
  job_id: string
  agent_name: string
  model_used: string
  timestamp: string
  input_hash: string | null
  output_summary: string | null
  flags: string | null
  decision: string | null
  duration_ms: number | null
}

interface JobRow {
  id: string
  status: string
  input: string | null
  selected_languages: string | null
  selected_channels: string | null
  created_at: string
  updated_at: string
  data: string | null
}

function initDb(): Database.Database {
  const dbPath = path.join(process.cwd(), 'data', 'db.sqlite')
  const db = new Database(dbPath)

  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id        TEXT NOT NULL,
      agent_name    TEXT NOT NULL,
      model_used    TEXT NOT NULL,
      timestamp     DATETIME DEFAULT CURRENT_TIMESTAMP,
      input_hash    TEXT,
      output_summary TEXT,
      flags         TEXT,
      decision      TEXT,
      duration_ms   INTEGER
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id                TEXT PRIMARY KEY,
      status            TEXT NOT NULL,
      input             TEXT,
      selected_languages TEXT,
      selected_channels  TEXT,
      data              TEXT,
      created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at        DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `)

  return db
}

const db = initDb()

export function writeAuditEntry(entry: AuditEntry): void {
  const stmt = db.prepare(`
    INSERT INTO audit_log
      (job_id, agent_name, model_used, input_hash, output_summary, flags, decision, duration_ms)
    VALUES
      (@job_id, @agent_name, @model_used, @input_hash, @output_summary, @flags, @decision, @duration_ms)
  `)

  stmt.run({
    job_id: entry.jobId,
    agent_name: entry.agentName,
    model_used: entry.modelUsed,
    input_hash: entry.inputHash,
    output_summary: entry.outputSummary,
    flags: JSON.stringify(entry.flags),
    decision: entry.decision,
    duration_ms: entry.durationMs,
  })
}

export function getAuditLog(): AuditRow[] {
  const stmt = db.prepare(`
    SELECT id, job_id, agent_name, model_used, timestamp,
           input_hash, output_summary, flags, decision, duration_ms
    FROM audit_log
    ORDER BY timestamp DESC
  `)

  return stmt.all() as AuditRow[]
}

export function writeJobStatus(jobId: string, status: string, data?: object): void {
  const existing = db.prepare('SELECT id FROM jobs WHERE id = ?').get(jobId)

  if (existing) {
    db.prepare(`
      UPDATE jobs
      SET status = ?, data = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, data ? JSON.stringify(data) : null, jobId)
  } else {
    db.prepare(`
      INSERT INTO jobs (id, status, data)
      VALUES (?, ?, ?)
    `).run(jobId, status, data ? JSON.stringify(data) : null)
  }
}

export function getJob(jobId: string): JobRow | null {
  const row = db.prepare('SELECT * FROM jobs WHERE id = ?').get(jobId)
  return (row as JobRow) ?? null
}
