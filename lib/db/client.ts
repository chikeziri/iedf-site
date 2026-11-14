import { Pool as PgPool, QueryResultRow } from "pg";
import mysql, { Pool as MysqlPool } from "mysql2/promise";

/**
 * One query helper for both databases.
 *
 * WhoGoHost JavaScript hosting provides MySQL/MariaDB:
 *   DATABASE_URL=mysql://user:password@localhost:3306/iedf
 *
 * Neon Postgres still works when the URL starts with postgres:// or postgresql://.
 * SQL in the app uses $1, $2 placeholders. They are rewritten to ? for MySQL.
 */

export type DbDialect = "mysql" | "postgres";

export type QueryResult<T extends QueryResultRow = QueryResultRow> = {
  rows: T[];
  insertId?: number;
};

function databaseUrl() {
  return process.env.DATABASE_URL || "";
}

export function dbDialect(): DbDialect {
  const url = databaseUrl();
  if (url.startsWith("mysql:") || url.startsWith("mariadb:")) return "mysql";
  return "postgres";
}

let pgPool: PgPool | null = null;
let mysqlPool: MysqlPool | null = null;

function postgres() {
  if (!pgPool) {
    pgPool = new PgPool({ connectionString: databaseUrl() });
  }
  return pgPool;
}

function mysqlPoolFromUrl() {
  if (!mysqlPool) {
    const parsed = new URL(databaseUrl());
    mysqlPool = mysql.createPool({
      host: parsed.hostname,
      port: parsed.port ? Number(parsed.port) : 3306,
      user: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
      database: decodeURIComponent(parsed.pathname.replace(/^\//, "")),
      waitForConnections: true,
      connectionLimit: 5,
      timezone: "Z",
      dateStrings: true,
    });
  }
  return mysqlPool;
}

function placeholders(sql: string) {
  return sql.replace(/\$\d+/g, "?");
}

function normalize(value: unknown): unknown {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (
      (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
      (trimmed.startsWith("[") && trimmed.endsWith("]"))
    ) {
      try {
        return JSON.parse(trimmed);
      } catch {
        return value;
      }
    }
  }
  return value;
}

function normalizeRow<T extends QueryResultRow>(row: T): T {
  const next = { ...row } as Record<string, unknown>;
  for (const key of Object.keys(next)) {
    if (key === "payload" || key === "metadata") {
      next[key] = normalize(next[key]);
    }
  }
  return next as T;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  if (!databaseUrl()) {
    throw new Error("DATABASE_URL is not set.");
  }

  if (dbDialect() === "mysql") {
    const [result] = await mysqlPoolFromUrl().execute(placeholders(text), params as never[]);
    if (Array.isArray(result)) {
      return { rows: (result as T[]).map((row) => normalizeRow(row)) };
    }
    const header = result as { insertId?: number };
    return { rows: [], insertId: header.insertId ? Number(header.insertId) : undefined };
  }

  const client = await postgres().connect();
  try {
    const result = await client.query<T>(text, params);
    return {
      rows: result.rows.map((row) => normalizeRow(row)),
    };
  } finally {
    client.release();
  }
}
