# Fix PWA IndexedDB Slowdown

## Objective

Resolve the performance issue where saving and retrieving workout entries takes tens of seconds when the app is installed as a PWA. The issue is not platform-specific — it reproduces on Chromium and Firefox PWAs as well as WebKit/Safari.

## Analysis

### Root cause: double-write to the same key within one transaction

In `src/routes/log.tsx`, when a user logs an exercise on a day with no existing session, the `handleSave` function opened a single `"rw"` transaction and issued **two writes to the same record**:

1. `await db.sessions.add(sess)` — inserts the new session (key: `sess.id`).
2. Mutates `sess` in memory (appends exercise sets).
3. `await db.sessions.put(sess)` — updates the same key.

All IDB implementations (Chromium, Firefox, WebKit) must serialize writes to the same key within a transaction. The engine queues the second write as a dependent request that cannot start until the first completes and its cursor is released. This serialization stall, combined with the Dexie transaction zone keeping the `rw` lock alive across `await` points, blocks all concurrent `"r"` reads — including those issued by `useLiveQuery` to refresh the sessions list. The result is that both saving and data retrieval freeze for the duration of the stall, which browsers can extend to tens of seconds before forcing a recovery.

### Other write sites ruled out

- `src/routes/sessions/$sessionId.tsx` — single `put` per save; no conflict.
- `src/routes/exercises/index.tsx` — single `put` per call; no conflict.
- `src/components/exercises/CreateExerciseDrawer.tsx` — sequential `add` on two **different** tables (`categories` then `exercises`), outside a wrapping transaction; each becomes its own auto-committed micro-transaction. No conflict.
- `src/components/exercises/EditExerciseDrawer.tsx` — same pattern as above; no conflict.
- `src/lib/csv/import-archive.ts` — `bulkPut` on three tables inside one transaction, but each table is written exactly once; no double-write issue.

## Solution

Remove the redundant `db.sessions.add` call. Dexie's `put` is an upsert: it inserts the record if the key does not exist and updates it if it does. Building the complete session object in memory and issuing a single `put` at the end of the transaction eliminates the double-write entirely.

## Implementation

The fix has been applied in `src/routes/log.tsx`. The `await db.sessions.add(sess)` line inside the `if (!sess)` block was removed. The final `await db.sessions.put(sess)` now handles both the new-session and update cases.

```diff
-          await db.sessions.add(sess);
         }
```

## Verification

Run `vp check` and `vp test` to confirm no build or type errors are introduced.

## Alternatives considered

- **Splitting into two separate transactions** (read in one, write in another): avoids the double-write but introduces a TOCTOU race — another write could land between the read and write transactions. Rejected.
- **Using `update` instead of `put`**: `update` requires the record to already exist, so it cannot replace the `add` for the new-session path. Rejected.
