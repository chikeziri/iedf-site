import { dbDialect, query } from "@/lib/db/client";

let ready: Promise<void> | null = null;

async function ensureMysql() {
  await query(`
    CREATE TABLE IF NOT EXISTS submissions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      form_type VARCHAR(64) NOT NULL,
      payload JSON NOT NULL,
      email VARCHAR(255) NOT NULL,
      status VARCHAR(32) NOT NULL DEFAULT 'new',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await query(`
    CREATE TABLE IF NOT EXISTS email_replies (
      id INT AUTO_INCREMENT PRIMARY KEY,
      submission_id INT NOT NULL,
      to_email VARCHAR(255) NOT NULL,
      subject VARCHAR(255) NOT NULL,
      body TEXT NOT NULL,
      resend_id VARCHAR(255) NULL,
      sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_email_replies_submission
        FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE
    )
  `);
  await query(`
    CREATE TABLE IF NOT EXISTS donations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      reference VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      amount DECIMAL(12, 2) NOT NULL,
      currency VARCHAR(10) DEFAULT 'NGN',
      status VARCHAR(50) DEFAULT 'success',
      paid_at DATETIME NULL,
      metadata JSON NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_donations_reference (reference)
    )
  `);
  await query(`
    CREATE TABLE IF NOT EXISTS lead_touches (
      id INT AUTO_INCREMENT PRIMARY KEY,
      source VARCHAR(64) NOT NULL,
      campaign VARCHAR(64) NOT NULL,
      kind VARCHAR(32) NOT NULL,
      path VARCHAR(255) NULL,
      email VARCHAR(255) NULL,
      amount DECIMAL(12, 2) NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function ensurePostgres() {
  await query(`
    CREATE TABLE IF NOT EXISTS submissions (
      id            SERIAL PRIMARY KEY,
      form_type     TEXT NOT NULL,
      payload       JSONB NOT NULL,
      email         TEXT NOT NULL,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
  await query(`
    ALTER TABLE submissions
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'new'
  `);
  await query(`
    CREATE TABLE IF NOT EXISTS email_replies (
      id              SERIAL PRIMARY KEY,
      submission_id   INTEGER NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
      to_email        TEXT NOT NULL,
      subject         TEXT NOT NULL,
      body            TEXT NOT NULL,
      resend_id       TEXT,
      sent_at         TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
  await query(`
    CREATE INDEX IF NOT EXISTS idx_email_replies_submission
    ON email_replies (submission_id, sent_at)
  `);
  await query(`
    CREATE TABLE IF NOT EXISTS donations (
      id SERIAL PRIMARY KEY,
      reference VARCHAR(255) UNIQUE NOT NULL,
      email VARCHAR(255) NOT NULL,
      amount DECIMAL(12, 2) NOT NULL,
      currency VARCHAR(10) DEFAULT 'NGN',
      status VARCHAR(50) DEFAULT 'success',
      paid_at TIMESTAMPTZ,
      metadata JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
  await query(`
    CREATE TABLE IF NOT EXISTS lead_touches (
      id SERIAL PRIMARY KEY,
      source TEXT NOT NULL,
      campaign TEXT NOT NULL,
      kind TEXT NOT NULL,
      path TEXT,
      email TEXT,
      amount DECIMAL(12, 2),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
}

/** Create the tables the site needs. Safe to call on every request. */
export function ensureAdminSchema() {
  if (!ready) {
    ready = (dbDialect() === "mysql" ? ensureMysql() : ensurePostgres()).catch((err) => {
      ready = null;
      throw err;
    });
  }
  return ready;
}
