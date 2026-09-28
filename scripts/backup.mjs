#!/usr/bin/env node
// Encrypt a connector-exported Coffee Calendar snapshot with the migrations
// needed to rebuild its application tables. Never put snapshots or keys in Git.
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
import { readFile, readdir, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { gzipSync, gunzipSync } from "node:zlib";

const projectRef = "gvmhjkswotrfggrfmbov";
const format = "coffee-calendar-backup/v1";
const tables = [
  "auth_users", "auth_identities", "auth_mfa_factors",
  "auth_mfa_amr_claims", "auth_mfa_recovery_code_sets",
  "auth_mfa_recovery_codes", "coffees", "brew_logs",
  "process_profiles", "migration_history",
];

function option(name) {
  const index = process.argv.indexOf(`--${name}`);
  if (index < 0 || !process.argv[index + 1]) {
    throw new Error(`Missing --${name}`);
  }
  return resolve(process.argv[index + 1]);
}

function literalOption(name) {
  const index = process.argv.indexOf(`--${name}`);
  if (index < 0 || !process.argv[index + 1]) throw new Error(`Missing --${name}`);
  return process.argv[index + 1];
}

async function runBinary(executable, args, input) {
  return new Promise((resolve, reject) => {
    const child = spawn(executable, args, {
      env: { ...process.env, PGSSLMODE: "require" },
      stdio: [input ? "pipe" : "ignore", "pipe", "pipe"],
      windowsHide: true,
    });
    const chunks = [];
    const errors = [];
    child.stdout.on("data", (chunk) => chunks.push(chunk));
    child.stderr.on("data", (chunk) => errors.push(chunk));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) reject(new Error(Buffer.concat(errors).toString("utf8").trim() ||
        `PostgreSQL client exited with status ${code}`));
      else resolve(Buffer.concat(chunks));
    });
    if (input) child.stdin.end(input);
  });
}

function validateSnapshot(snapshot) {
  if (snapshot?.format !== "coffee-calendar-data-snapshot/v1" ||
      snapshot.projectRef !== projectRef || !snapshot.capturedAt ||
      !snapshot.tables || typeof snapshot.tables !== "object") {
    throw new Error("Snapshot format or project does not match Coffee Calendar");
  }
  for (const table of tables) {
    if (!Array.isArray(snapshot.tables[table])) {
      throw new Error(`Snapshot is missing ${table}`);
    }
  }
  const users = new Set(snapshot.tables.auth_users.map((row) => row.id));
  const coffees = new Map(snapshot.tables.coffees.map((row) => [row.id, row]));
  if (users.size !== snapshot.tables.auth_users.length ||
      coffees.size !== snapshot.tables.coffees.length ||
      snapshot.tables.coffees.some((row) => !users.has(row.user_id)) ||
      snapshot.tables.brew_logs.some((row) =>
        !users.has(row.user_id) || coffees.get(row.coffee_id)?.user_id !== row.user_id)) {
    throw new Error("Snapshot has duplicate IDs or broken coffee ownership");
  }
  return Object.fromEntries(tables.map((table) => [table, snapshot.tables[table].length]));
}

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  }
  return value;
}

async function readKey(path, create) {
  try {
    const value = (await readFile(path, "utf8")).trim();
    if (!/^[0-9a-f]{64}$/.test(value)) throw new Error("Invalid backup key file");
    return Buffer.from(value, "hex");
  } catch (error) {
    if (!create || error.code !== "ENOENT") throw error;
    const key = randomBytes(32);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, `${key.toString("hex")}\n`, { flag: "wx", mode: 0o600 });
    return key;
  }
}

async function migrations() {
  const directory = resolve("supabase/migrations");
  const names = (await readdir(directory)).filter((name) => /^\d+.*\.sql$/.test(name)).sort();
  if (!names.length) throw new Error("No repository migrations found");
  return Promise.all(names.map(async (name) => ({
    name, sql: await readFile(resolve(directory, name), "utf8"),
  })));
}

async function decrypt(path, key) {
  const envelope = JSON.parse(await readFile(path, "utf8"));
  if (envelope.format !== format || envelope.projectRef !== projectRef ||
      envelope.algorithm !== "aes-256-gcm+gzip") {
    throw new Error("Unrecognized Coffee Calendar backup");
  }
  const nonce = Buffer.from(envelope.nonce, "base64");
  const tag = Buffer.from(envelope.tag, "base64");
  if (nonce.length !== 12 || tag.length !== 16) throw new Error("Invalid backup envelope");
  const decipher = createDecipheriv("aes-256-gcm", key, nonce);
  decipher.setAAD(Buffer.from(format));
  decipher.setAuthTag(tag);
  const compressed = Buffer.concat([
    decipher.update(Buffer.from(envelope.ciphertext, "base64")), decipher.final(),
  ]);
  const payload = JSON.parse(gunzipSync(compressed).toString("utf8"));
  const counts = validateSnapshot(payload.snapshot);
  if (!Array.isArray(payload.migrations) || !payload.migrations.length ||
      payload.migrations.some((item) => !/^\d+.*\.sql$/.test(item.name) ||
        typeof item.sql !== "string")) {
    throw new Error("Backup has no usable migration set");
  }
  const names = new Set(payload.migrations.map((item) => item.name));
  if (names.size !== payload.migrations.length) throw new Error("Duplicate migration in backup");
  return { payload, counts };
}

async function create() {
  const snapshot = JSON.parse(await readFile(option("snapshot"), "utf8"));
  const counts = validateSnapshot(snapshot);
  const key = await readKey(option("key-file"), false);
  const payload = { snapshot, migrations: await migrations() };
  const nonce = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, nonce);
  cipher.setAAD(Buffer.from(format));
  const plaintext = gzipSync(Buffer.from(JSON.stringify(payload)));
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const envelope = {
    format, projectRef, algorithm: "aes-256-gcm+gzip",
    nonce: nonce.toString("base64"), tag: cipher.getAuthTag().toString("base64"),
    ciphertext: ciphertext.toString("base64"),
  };
  const output = option("out");
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify(envelope)}\n`, { flag: "wx", mode: 0o600 });
  await decrypt(output, key);
  console.log(JSON.stringify({ result: "created", output, counts, migrations: payload.migrations.length }));
}

async function initKey() {
  const path = option("key-file");
  await readKey(path, true);
  console.log(JSON.stringify({ result: "key-ready", path }));
}

async function verify() {
  const key = await readKey(option("key-file"), false);
  const { payload, counts } = await decrypt(option("file"), key);
  console.log(JSON.stringify({ result: "verified", capturedAt: payload.snapshot.capturedAt,
    counts, migrations: payload.migrations.length }));
}

async function extract() {
  const key = await readKey(option("key-file"), false);
  const { payload } = await decrypt(option("file"), key);
  const output = option("out");
  await writeFile(output, `${JSON.stringify(payload)}\n`, { flag: "wx", mode: 0o600 });
  console.log(JSON.stringify({ result: "extracted", output,
    warning: "This file contains unencrypted account and coffee data" }));
}

async function restoreTest() {
  const { PGlite } = await import("@electric-sql/pglite");
  const key = await readKey(option("key-file"), false);
  const { payload, counts } = await decrypt(option("file"), key);
  const db = new PGlite();
  try {
    await db.exec(`create role anon; create role authenticated;
      create schema auth; create table auth.users (id uuid primary key);
      create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema auth, public to anon, authenticated;`);
    for (const { sql } of payload.migrations) {
      await db.exec(sql.replace('create extension if not exists "pgcrypto";', ""));
    }
    for (const row of payload.snapshot.tables.auth_users) {
      await db.query("insert into auth.users(id) values ($1)", [row.id]);
    }
    for (const table of ["process_profiles", "coffees", "brew_logs"]) {
      for (const row of payload.snapshot.tables[table]) {
        await db.query(`insert into public.${table} select * from
          jsonb_populate_record(null::public.${table}, $1::jsonb)`, [JSON.stringify(row)]);
      }
      const result = await db.query(`select count(*)::integer as count from public.${table}`);
      if (result.rows[0].count !== counts[table]) {
        throw new Error(`Restored ${table} count does not match the backup`);
      }
      const actualRows = await db.query(`select to_jsonb(t) as data from public.${table} t order by id`);
      const expectedRows = [...payload.snapshot.tables[table]]
        .sort((a, b) => a.id.localeCompare(b.id));
      for (let i = 0; i < expectedRows.length; i += 1) {
        for (const [key, expected] of Object.entries(expectedRows[i])) {
          const actual = actualRows.rows[i]?.data?.[key];
          if ((key === "created_at" || key === "updated_at") &&
              typeof actual === "string" && typeof expected === "string" &&
              Date.parse(actual) === Date.parse(expected)) continue;
          if (JSON.stringify(canonical(actual)) !== JSON.stringify(canonical(expected))) {
            throw new Error(`Restored ${table}.${key} does not match the backup`);
          }
        }
      }
    }
    console.log(JSON.stringify({ result: "restore-test-passed", authUserIds: counts.auth_users,
      coffees: counts.coffees, brewLogs: counts.brew_logs,
      note: "Application tables restored in disposable PGlite; hosted Auth login is not tested" }));
  } finally {
    await db.close();
  }
}

async function pgDumpCreate() {
  if (!process.env.PGPASSWORD) throw new Error("PGPASSWORD must be set for this run");
  const archive = await runBinary(option("pg-dump"), [
    "-Fc", "--no-owner", "--no-privileges", "--schema=public",
    "--schema=auth", "--schema=supabase_migrations",
    "--host=aws-0-us-east-1.pooler.supabase.com", "--port=5432",
    `--username=${literalOption("user")}`, "--dbname=postgres",
  ]);
  if (archive.subarray(0, 5).toString() !== "PGDMP") {
    throw new Error("pg_dump did not return a PostgreSQL custom archive");
  }
  const key = await readKey(option("key-file"), false);
  const nonce = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, nonce);
  cipher.setAAD(Buffer.from(`${format}:pgdump`));
  const ciphertext = Buffer.concat([cipher.update(archive), cipher.final()]);
  const output = option("out");
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify({
    format, projectRef, algorithm: "aes-256-gcm+pgdump",
    nonce: nonce.toString("base64"), tag: cipher.getAuthTag().toString("base64"),
    ciphertext: ciphertext.toString("base64"),
  })}\n`, { flag: "wx", mode: 0o600 });
  console.log(JSON.stringify({ result: "pgdump-created", output, archiveBytes: archive.length }));
}

async function readPgDump() {
  const envelope = JSON.parse(await readFile(option("file"), "utf8"));
  if (envelope.format !== format || envelope.projectRef !== projectRef ||
      envelope.algorithm !== "aes-256-gcm+pgdump") {
    throw new Error("Unrecognized encrypted PostgreSQL dump");
  }
  const key = await readKey(option("key-file"), false);
  const nonce = Buffer.from(envelope.nonce, "base64");
  const tag = Buffer.from(envelope.tag, "base64");
  if (nonce.length !== 12 || tag.length !== 16) throw new Error("Invalid dump envelope");
  const decipher = createDecipheriv("aes-256-gcm", key, nonce);
  decipher.setAAD(Buffer.from(`${format}:pgdump`));
  decipher.setAuthTag(tag);
  const archive = Buffer.concat([
    decipher.update(Buffer.from(envelope.ciphertext, "base64")), decipher.final(),
  ]);
  if (archive.subarray(0, 5).toString() !== "PGDMP") throw new Error("Invalid pg_dump archive");
  return archive;
}

async function pgDumpVerify() {
  const archive = await readPgDump();
  const listing = (await runBinary(option("pg-restore"), ["--list"], archive)).toString("utf8");
  for (const table of ["coffees", "brew_logs", "process_profiles", "users", "identities"]) {
    if (!new RegExp(`\\bTABLE DATA\\s+(?:public|auth)\\s+${table}\\b`).test(listing)) {
      throw new Error(`PostgreSQL archive is missing table data for ${table}`);
    }
  }
  console.log(JSON.stringify({ result: "pgdump-verified", archiveBytes: archive.length,
    listedEntries: listing.split("\n").filter((line) => /^\d+;/.test(line)).length }));
}

async function pgDumpExtract() {
  const archive = await readPgDump();
  const output = option("out");
  await writeFile(output, archive, { flag: "wx", mode: 0o600 });
  console.log(JSON.stringify({ result: "pgdump-extracted", output, archiveBytes: archive.length,
    warning: "This file contains unencrypted database data" }));
}

try {
  const command = process.argv[2];
  if (command === "init-key") await initKey();
  else if (command === "create") await create();
  else if (command === "verify") await verify();
  else if (command === "extract") await extract();
  else if (command === "restore-test") await restoreTest();
  else if (command === "pgdump-create") await pgDumpCreate();
  else if (command === "pgdump-verify") await pgDumpVerify();
  else if (command === "pgdump-extract") await pgDumpExtract();
  else throw new Error("Use init-key, create, verify, extract, restore-test, pgdump-create, pgdump-verify, or pgdump-extract");
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
