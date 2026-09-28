# Coffee Calendar backup and recovery

Coffee Calendar runs on a Supabase Free project, which does not provide
downloadable automatic database backups. Keep encrypted exports outside the
repository and retain the recovery key separately from Google Drive.

## What is backed up

- A PostgreSQL 17 custom-format dump of the `public`, `auth`, and
  `supabase_migrations` schemas, including their data. The dump is captured
  and encrypted in memory; an unencrypted `pg_dump` file is not written during
  backup creation.
- A second, smaller application snapshot containing the account and identity
  records, MFA records, coffees, brew logs, process profiles, migration history,
  and the nine repository migrations. This gives a separately testable path
  for restoring the application's own tables.
- Both files use a fresh AES-256-GCM nonce and the recovery key stored outside
  Git at `C:\Users\Jordan\.codex\secrets\coffee-calendar-backup.key`.
  The key file is restricted to Jordan, SYSTEM, and local administrators.

The database dump does **not** contain Supabase Storage object bytes, Auth
project settings, redirect URLs, SMTP settings, API keys, or Vercel settings.
The application currently does not use Supabase Storage. Preserve those
settings separately if they are changed.

## Verified backup procedure

1. Create a temporary PostgreSQL login with `pg_read_all_data` and
   `BYPASSRLS`, using a random password. Scheduled runs also set a 20-minute
   login expiry. The login needs these read capabilities to capture
   owner-protected and managed Auth tables.
2. Run `scripts/backup.mjs pgdump-create` with PostgreSQL 17 `pg_dump`,
   `PGPASSWORD` set only for that process, and an output path outside Git.
3. Immediately disable and drop the temporary login, even if the dump fails.
   Verify it is absent from `pg_roles`.
4. Run `scripts/backup.mjs pgdump-verify` with PostgreSQL 17 `pg_restore`.
   This decrypts the archive in memory and confirms that required table-data
   entries are present.
5. Upload only the `.ccbackup` file to the private Coffee Calendar Backups
   folder in Google Drive. Read its metadata, download it again, compare its
   SHA-256 with the local encrypted file, and run `pgdump-verify` on the
   downloaded copy.
6. Keep the encrypted local copy as a second location. Never commit a dump,
   plaintext snapshot, password, or recovery key.

The initial backup on 2026-09-28 passed all six steps. Its PostgreSQL archive
has 296 listed entries. The separate application snapshot restored one account
ID and all seven coffees into a disposable PGlite database with matching
ownership; the Drive download matched the local encrypted file byte-for-byte.
The temporary database login was removed. A complete Supabase Auth login after
restoring into a *new hosted project* has not been tested.

The Codex heartbeat named **Coffee Calendar daily encrypted backup** is active
for 18:30 Brisbane time each day. It repeats the temporary-login, encrypted
dump, Drive upload, and readback checks and reports failed runs. It depends on
this local computer and its connected Supabase and Google Drive tools being
available; check its run history periodically. This is not a server-side backup
service, and the first scheduled run has not yet been observed.

The local recovery key must be copied to a password manager or another secure
location **separate from both this computer and the Drive backup folder**.
Without that separate copy, a loss of this computer would also lose the ability
to decrypt the off-site backups. Never put the key in this repository.

## Recovery

Download the encrypted archive from Google Drive and retrieve the recovery key
from its separate secure copy. From this repository:

```powershell
$backup = 'C:\path\to\downloaded.ccbackup'
$key = 'C:\path\to\coffee-calendar-backup.key'
$pgRestore = 'C:\path\to\pg_restore.exe'
$scratch = 'C:\secure\scratch\coffee-calendar.dump'
node scripts/backup.mjs pgdump-verify --file $backup --key-file $key --pg-restore $pgRestore
node scripts/backup.mjs pgdump-extract --file $backup --key-file $key --out $scratch
& $pgRestore --list $scratch
```

The extracted `.dump` is **unencrypted** and contains account data. Restore
only into a new, isolated PostgreSQL/Supabase target after reviewing its
existing schema and following Supabase's
[backup and restore guidance](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore).
Check Auth users and identities, coffee ownership, row counts, RLS policies,
share-token projection, and an actual login before switching production
traffic. Remove the plaintext scratch dump after recovery. Do not restore a
backup over the live project as a test.

The smaller snapshot can be decrypted with
`node scripts/backup.mjs extract --file $snapshot --key-file $key --out $scratchJson`
after setting those PowerShell variables to secure paths.
Use `restore-test` for a disposable application-table restore without touching
Supabase.
