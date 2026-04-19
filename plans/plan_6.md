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

---

## Follow-up fix: existing-session saves also stall (save #4+)

### Symptom

After logging 3 exercises to the same day's session (each with supersets or drop sets), the 4th save stalls for tens of seconds. Saves 1–3 completed normally.

### Root cause

The prior fix only addressed the new-session path (`!sess`). The existing-session path still used `db.transaction("rw", db.sessions, async () => {...})`, which spans **two `await` points**:

1. `await db.sessions.where("date").equals(today).first()` — reads and deserializes the session
2. `await db.sessions.put(sess)` — writes the updated session

Dexie must keep the IDB transaction alive across both awaits via a keep-alive mechanism. As the session document grows (more exercises, sets, and segments), structured-clone deserialization of the read result takes longer. This widens the gap between the read resolving and Dexie's keep-alive dummy request. In PWA mode — where the service worker alters the browser's event loop scheduling — this gap can exceed the browser's inactivity threshold, causing an auto-commit of the IDB transaction. Dexie catches the `TransactionInactiveError` and enters its retry path, which stalls for tens of seconds.

Saves #1–3 succeed because the session is small enough that deserialization is fast and the keep-alive fires in time. Save #4 fails because the session (now holding 3 exercises worth of sets and segments) takes long enough to deserialize that the threshold is crossed.

### Fix

Remove the `db.transaction()` wrapper entirely. The read and write become two separate single-operation implicit Dexie transactions, each auto-committing immediately. No keep-alive mechanism is needed; the browser can never auto-commit the wrong transaction.

The theoretical TOCTOU race between read and write is not a concern: this is a local-only single-user app with no background writers to `db.sessions`.

```diff
-      // Single transaction: one round-trip instead of 3–4 separate ones.
-      const savedSessionId = await db.transaction("rw", db.sessions, async () => {
-        let sess = await db.sessions.where("date").equals(today).first();
-        if (!sess) {
-          const newId = nanoid("s-");
-          sess = { id: newId, date: today, name: "Session", exercises: [] };
-        }
-        const existing = sess.exercises.find((e) => e.exerciseId === exerciseId);
-        if (existing) {
-          existing.sets.push(...valid);
-        } else {
-          sess.exercises.push({ exerciseId, sets: valid });
-        }
-        await db.sessions.put(sess);
-        return sess.id;
-      });
+      let sess = await db.sessions.where("date").equals(today).first();
+      if (!sess) {
+        sess = { id: nanoid("s-"), date: today, name: "Session", exercises: [] };
+      }
+      const existing = sess.exercises.find((e) => e.exerciseId === exerciseId);
+      if (existing) {
+        existing.sets.push(...valid);
+      } else {
+        sess.exercises.push({ exerciseId, sets: valid });
+      }
+      await db.sessions.put(sess);
+      const savedSessionId = sess.id;
```
