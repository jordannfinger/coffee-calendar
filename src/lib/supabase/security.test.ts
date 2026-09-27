import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { expect, it } from "vitest";

const ownerA = "10000000-0000-4000-8000-000000000001";
const ownerB = "10000000-0000-4000-8000-000000000002";
const sharedId = "20000000-0000-4000-8000-000000000001";
const privateId = "20000000-0000-4000-8000-000000000002";
const ownId = "20000000-0000-4000-8000-000000000003";
const token = "30000000-0000-4000-8000-000000000001";
const migration = (name: string) => readFileSync(resolve("supabase/migrations", name), "utf8");
const privacy = migration("20260927105109_protect_coffee_privacy.sql");
const ownership = migration("20260927105356_enforce_brew_log_owner.sql");

async function setup() {
  const db = new PGlite();
  // Only Supabase's auth schema/roles are simulated. RLS, grants, functions,
  // transactions and foreign keys execute in the actual PostgreSQL engine.
  await db.exec(`
    create role anon;
    create role authenticated;
    create schema auth;
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth, public to anon, authenticated;
  `);
  for (const file of ["0001_init.sql", "0002_fix_function_search_path.sql", "0003_brew_logs.sql", "0004_storage_and_sharing.sql"]) {
    // PGlite lacks pgcrypto; this schema only needs core gen_random_uuid().
    await db.exec(migration(file).replace('create extension if not exists "pgcrypto";', ""));
  }
  await db.exec(`
    grant select, insert, update, delete on all tables in schema public to anon, authenticated;
    insert into auth.users values ('${ownerA}'), ('${ownerB}');
    insert into public.coffees (id, user_id, name, roaster, origin, roast_date, process, roast_level, notes, share_token)
    values
      ('${sharedId}', '${ownerA}', 'Shared A', 'Roaster', 'Origin', '2026-09-01', 'washed', 'light', 'private A', '${token}'),
      ('${privateId}', '${ownerA}', 'Private A', 'Roaster', 'Origin', '2026-09-01', 'washed', 'light', 'secret A', null),
      ('${ownId}', '${ownerB}', 'Own B', 'Roaster', 'Origin', '2026-09-01', 'washed', 'light', 'private B', null);
  `);
  return db;
}

async function asRole(db: PGlite, role: "anon" | "authenticated", userId = "") {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [userId]);
  await db.exec(`set role ${role}`);
}

it("enforces private inventories, token-only public fields, revocation and brew parent ownership", async () => {
  const db = await setup();
  try {
    // Reproduce both original defects before applying their forward migrations.
    await asRole(db, "authenticated", ownerB);
    expect((await db.query<{ notes: string }>("select notes from public.coffees where id = $1", [sharedId])).rows)
      .toEqual([{ notes: "private A" }]);
    await db.query("insert into public.brew_logs (coffee_id,user_id) values ($1,$2)", [sharedId, ownerB]);
    await db.exec("reset role; delete from public.brew_logs;");
    await db.exec(privacy);
    await db.exec(ownership);

    await asRole(db, "anon");
    expect((await db.query("select * from public.coffees")).rows).toEqual([]);
    const shared = (await db.query<Record<string, unknown>>("select * from public.get_shared_coffee($1)", [token])).rows;
    expect(shared).toHaveLength(1);
    expect(Object.keys(shared[0]).sort()).toEqual([
      "name", "roaster", "origin", "region", "producer", "variety", "elevation_m", "process", "process_subtype",
      "roast_level", "roast_date", "tasting_notes", "brew_method", "grind_setting", "recipe", "dose_g", "water_g", "storage_method",
    ].sort());
    expect((await db.query("select * from public.get_shared_coffee(null)")).rows).toEqual([]);
    expect((await db.query("select * from public.get_shared_coffee($1)", [privateId])).rows).toEqual([]);
    await expect(db.query("select * from public.get_shared_coffee('invalid')")).rejects.toMatchObject({ code: "22P02" });
    await expect(db.query("select notes from public.get_shared_coffee($1)", [token])).rejects.toMatchObject({ code: "42703" });

    await asRole(db, "authenticated", ownerB);
    expect((await db.query("select id from public.coffees")).rows).toEqual([{ id: ownId }]);
    expect((await db.query("select * from public.coffees where id = $1", [sharedId])).rows).toEqual([]);
    expect((await db.query("update public.coffees set notes = 'changed' where id = $1 returning id", [sharedId])).rows).toEqual([]);
    expect((await db.query("select name from public.get_shared_coffee($1)", [token])).rows).toEqual([{ name: "Shared A" }]);
    await expect(db.query("insert into public.brew_logs (coffee_id,user_id) values ($1,$2)", [sharedId, ownerB])).rejects.toMatchObject({ code: "23503" });
    await expect(db.query("insert into public.brew_logs (coffee_id,user_id) values ($1,$2)", [sharedId, ownerA])).rejects.toMatchObject({ code: "42501" });
    await db.query("insert into public.brew_logs (coffee_id,user_id) values ($1,$2)", [ownId, ownerB]);
    await expect(db.query("update public.brew_logs set coffee_id=$1", [sharedId])).rejects.toMatchObject({ code: "23503" });

    await asRole(db, "authenticated", ownerA);
    expect((await db.query("select * from public.brew_logs")).rows).toEqual([]);
    await db.query("update public.coffees set share_token = null where id=$1", [sharedId]);
    await asRole(db, "anon");
    expect((await db.query("select * from public.get_shared_coffee($1)", [token])).rows).toEqual([]);

    await asRole(db, "authenticated", ownerB);
    await db.query("delete from public.coffees where id=$1", [ownId]);
    expect((await db.query("select * from public.brew_logs")).rows).toEqual([]);
  } finally { await db.close(); }
}, 30000);

it("stops an ownership migration without deleting inconsistent records or undoing privacy protection", async () => {
  const db = await setup();
  try {
    await db.query("insert into public.brew_logs (coffee_id,user_id) values ($1,$2)", [sharedId, ownerB]);
    await db.exec(privacy);
    await expect(db.exec(ownership)).rejects.toThrow("Resolve ownership before applying this migration");
    await db.exec("rollback");
    expect((await db.query("select * from public.brew_logs")).rows).toHaveLength(1);
    await asRole(db, "anon");
    expect((await db.query("select * from public.coffees")).rows).toEqual([]);
  } finally { await db.close(); }
}, 30000);
