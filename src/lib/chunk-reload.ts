const LAST_RELOAD_KEY = "gym-jam:chunk-reload-at";
/** A second failure within this window means reloading didn't help, so let the error show. */
export const RELOAD_GUARD_MS = 10_000;

export function shouldReloadAfterChunkError(now: number, lastReloadAt: number | null): boolean {
  return lastReloadAt === null || now - lastReloadAt >= RELOAD_GUARD_MS;
}

function readLastReload(): number | null {
  try {
    const raw = sessionStorage.getItem(LAST_RELOAD_KEY);
    const value = raw === null ? Number.NaN : Number(raw);
    return Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

/**
 * After a deploy, an already-open app can request a lazily loaded route chunk that no longer
 * exists (the host answers with index.html), so the import fails. Reload once to pick up the new
 * build; unticked rows survive in the draft and ticked sets are already in IndexedDB.
 */
export function installChunkReloadHandler(): void {
  window.addEventListener("vite:preloadError", (event) => {
    const now = Date.now();
    if (!shouldReloadAfterChunkError(now, readLastReload())) return;
    try {
      sessionStorage.setItem(LAST_RELOAD_KEY, String(now));
    } catch {
      // Without storage we can't detect a loop; reloading once is still the best recovery.
    }
    event.preventDefault();
    window.location.reload();
  });
}
