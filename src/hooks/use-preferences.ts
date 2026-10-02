import { useLocalStorage } from "@mantine/hooks";

export interface Preferences {
  /** Show the rest timer after a set is ticked. */
  restTimerEnabled: boolean;
  /** Rest countdown length in seconds; 0 means the timer just counts up. */
  restSeconds: number;
}

export const REST_PRESETS = [0, 30, 60, 90, 120, 150, 180, 240, 300] as const;

export const DEFAULT_PREFERENCES: Preferences = { restTimerEnabled: true, restSeconds: 90 };

const STORAGE_KEY = "gym-jam:preferences";

function isRestPreset(value: unknown): value is Preferences["restSeconds"] {
  return REST_PRESETS.some((preset) => preset === value);
}

/** localStorage is user-editable, so every field is validated and falls back to its default. */
export function parsePreferences(raw: string | undefined): Preferences {
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    const value = typeof parsed === "object" && parsed !== null ? parsed : {};
    const restTimerEnabled = "restTimerEnabled" in value ? value.restTimerEnabled : undefined;
    const restSeconds = "restSeconds" in value ? value.restSeconds : undefined;
    return {
      restTimerEnabled:
        typeof restTimerEnabled === "boolean"
          ? restTimerEnabled
          : DEFAULT_PREFERENCES.restTimerEnabled,
      restSeconds: isRestPreset(restSeconds) ? restSeconds : DEFAULT_PREFERENCES.restSeconds,
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

/** Per-device preferences, synced across every component (and tab) that uses them. */
export function usePreferences() {
  const [preferences, setPreferences] = useLocalStorage<Preferences>({
    key: STORAGE_KEY,
    defaultValue: DEFAULT_PREFERENCES,
    deserialize: parsePreferences,
    getInitialValueInEffect: false,
  });

  const updatePreferences = (patch: Partial<Preferences>) =>
    setPreferences((prev) => ({ ...prev, ...patch }));

  return [preferences, updatePreferences] as const;
}
