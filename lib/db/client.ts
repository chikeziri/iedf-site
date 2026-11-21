import fs from "fs";
import os from "os";
import path from "path";
import { Pool as PgPool, QueryResultRow } from "pg";
import mysql, { type Connection, Pool as MysqlPool } from "mysql2/promise";

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

const MYSQL_SOCKETS = [
  "/var/lib/mysql/mysql.sock",
  "/tmp/mysql.sock",
  "/var/run/mysqld/mysqld.sock",
  "/usr/local/mysql/mysql.sock",
];

type MysqlTarget = { socketPath: string } | { host: string; port: number };

function socketFromConfigs() {
  const files = [
    "/etc/my.cnf",
    "/etc/mysql/my.cnf",
    "/usr/local/directadmin/conf/mysql.conf",
    path.join(os.homedir(), ".my.cnf"),
  ];
  const found: string[] = [];
  for (const file of files) {
    try {
      const text = fs.readFileSync(file, "utf8");
      for (const match of text.matchAll(/^\s*socket\s*=\s*(\S+)/gm)) {
        if (match[1]) found.push(match[1]);
      }
    } catch {
      // The config is not readable from this account.
    }
  }
  return found;
}

function mysqlTargets(parsed: URL): MysqlTarget[] {
  const port = parsed.port ? Number(parsed.port) : 3306;
  const sockets = [
    process.env.MYSQL_SOCKET,
    ...socketFromConfigs(),
    ...MYSQL_SOCKETS,
  ].filter((value): value is string => Boolean(value));
  const targets: MysqlTarget[] = [...new Set(sockets)]
    .filter((socketPath) => fs.existsSync(socketPath))
    .map((socketPath) => ({ socketPath }));
  const host = parsed.hostname === "localhost" ? "127.0.0.1" : parsed.hostname;
  targets.push({ host, port });
  if (parsed.hostname !== "localhost") targets.push({ host: "localhost", port });
  return targets;
}

function targetLabel(target: MysqlTarget) {
  return "socketPath" in target ? "socket" : target.host;
}

async function mysqlPoolFromUrl() {
  if (mysqlPool) return mysqlPool;

  const parsed = new URL(databaseUrl());
  const user = decodeURIComponent(parsed.username);
  const password = decodeURIComponent(parsed.password);
  const database = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
  let lastError: unknown;

  // WhoGoHost accepts this database user on the Unix socket. TCP to
  // 127.0.0.1 is often dropped, so a single TCP attempt hangs the form.
  for (const target of mysqlTargets(parsed)) {
    let conn: Connection | null = null;
    try {
      conn = await mysql.createConnection({
        ...target,
        user,
        password,
        database,
        connectTimeout: 3000,
        dateStrings: true,
      });
      await conn.ping();
    } catch (err) {
      lastError = err;
      const code = err && typeof err === "object" && "code" in err ? String(err.code) : "FAILED";
      console.error(`[db] mysql ${targetLabel(target)} failed: ${code}`);
      continue;
    } finally {
      await conn?.end().catch(() => undefined);
    }

    mysqlPool = mysql.createPool({
      ...target,
      user,
      password,
      database,
      waitForConnections: true,
      connectionLimit: 5,
      connectTimeout: 5000,
      dateStrings: true,
    });
    return mysqlPool;
  }

  throw lastError instanceof Error ? lastError : new Error("MySQL connection failed");
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
    // query(), not execute(). MySQL prepared statements reject CREATE TABLE,
    // so ensureAdminSchema() was throwing and every form returned 500.
    const pool = await mysqlPoolFromUrl();
    const sql = placeholders(text);
    const [result] = params
      ? await pool.query(sql, params as never[])
      : await pool.query(sql);
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
