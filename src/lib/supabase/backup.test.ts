import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, it } from "vitest";

function run(...args: string[]) {
  return spawnSync(process.execPath, ["scripts/backup.mjs", ...args], {
    cwd: process.cwd(), encoding: "utf8",
  });
}

it("encrypts an export, restores its public tables, and rejects tampering or a wrong key", () => {
  const dir = mkdtempSync(join(tmpdir(), "coffee-backup-test-"));
  try {
    const snapshot = join(dir, "snapshot.json");
    const key = join(dir, "key");
    const wrongKey = join(dir, "wrong-key");
    const backup = join(dir, "backup.ccbackup");
    const tampered = join(dir, "tampered.ccbackup");
    writeFileSync(snapshot, JSON.stringify({
      format: "coffee-calendar-data-snapshot/v1",
      projectRef: "gvmhjkswotrfggrfmbov",
      capturedAt: new Date().toISOString(),
      tables: {
        auth_users: [{ id: "10000000-0000-4000-8000-000000000001" }],
        auth_identities: [], auth_mfa_factors: [], auth_mfa_amr_claims: [],
        auth_mfa_recovery_code_sets: [], auth_mfa_recovery_codes: [],
        coffees: [{
          id: "20000000-0000-4000-8000-000000000001",
          user_id: "10000000-0000-4000-8000-000000000001",
          name: "private-synthetic-marker", roaster: "Test", origin: "Test",
          roast_date: "2026-09-01", process: "washed", roast_level: "light",
          created_at: "2026-09-01T00:00:00Z", updated_at: "2026-09-01T00:00:00Z",
        }],
        brew_logs: [], process_profiles: [], migration_history: [],
      },
    }));
    expect(run("init-key", "--key-file", key).status).toBe(0);
    const created = run("create", "--snapshot", snapshot, "--out", backup, "--key-file", key);
    expect(created.status, created.stderr).toBe(0);
    expect(readFileSync(backup, "utf8")).not.toContain("private-synthetic-marker");
    const verified = run("verify", "--file", backup, "--key-file", key);
    expect(verified.status, verified.stderr).toBe(0);
    const restored = run("restore-test", "--file", backup, "--key-file", key);
    expect(restored.status, restored.stderr).toBe(0);
    expect(restored.stdout).toContain('"coffees":1');

    writeFileSync(wrongKey, `${randomBytes(32).toString("hex")}\n`);
    expect(run("verify", "--file", backup, "--key-file", wrongKey).status).not.toBe(0);
    const envelope = JSON.parse(readFileSync(backup, "utf8"));
    const cipher = Buffer.from(envelope.ciphertext, "base64");
    cipher[0] ^= 1;
    envelope.ciphertext = cipher.toString("base64");
    writeFileSync(tampered, JSON.stringify(envelope));
    expect(run("verify", "--file", tampered, "--key-file", key).status).not.toBe(0);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}, 30000);
