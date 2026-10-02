import { Button, FileButton, Select, Switch } from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import IconSolarDownload from "~icons/solar/download-minimalistic-broken";
import IconSolarUpload from "~icons/solar/upload-minimalistic-broken";

import PageHeader from "~/components/PageHeader";
import SectionHeading from "~/components/SectionHeading";
import CategoryManager from "~/components/settings/CategoryManager";
import StatTile from "~/components/StatTile";
import { db } from "~/db/index";
import { REST_PRESETS, usePreferences } from "~/hooks/use-preferences";
import { formatDuration, pluralize } from "~/lib/calc";
import { createExportArchive, downloadExport } from "~/lib/csv/export-archive";
import { type ParsedArchive, parseArchive, writeArchive } from "~/lib/csv/import-archive";
import { clearAllDrafts } from "~/lib/workout-draft-storage";

const REST_OPTIONS = REST_PRESETS.map((seconds) => ({
  value: String(seconds),
  label: seconds === 0 ? "No countdown (count up)" : formatDuration(seconds),
}));

function notifyError(title: string, err: unknown) {
  notifications.show({
    title,
    message: err instanceof Error ? err.message : "An unknown error occurred.",
    color: "red",
  });
}

interface ImportSummaryProps {
  archive: ParsedArchive;
  currentSessions: number;
  currentExercises: number;
}

const ImportSummary = ({ archive, currentSessions, currentExercises }: ImportSummaryProps) => (
  <div className="flex flex-col gap-3 text-sm text-fg-muted">
    <p>This archive contains:</p>
    <dl className="grid grid-cols-3 gap-px border border-line bg-line">
      <StatTile label="Workouts" value={archive.sessions.length} />
      <StatTile label="Exercises" value={archive.exercises.length} />
      <StatTile label="Categories" value={archive.categories.length} />
    </dl>
    <p>
      It will <strong className="text-fg">replace</strong> your current{" "}
      {pluralize(currentSessions, "workout")} and {pluralize(currentExercises, "exercise")},
      including any unfinished sets. This cannot be undone, so export a backup first if you might
      need it.
    </p>
  </div>
);

const SettingsPage = () => {
  const [preferences, updatePreferences] = usePreferences();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const resetFileInput = useRef<() => void>(null);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      downloadExport(await createExportArchive());
      notifications.show({
        title: "Export complete",
        message: "Your data was saved as a ZIP archive.",
        color: "green",
      });
    } catch (err) {
      notifyError("Export failed", err);
    } finally {
      setIsExporting(false);
    }
  };

  const confirmImport = async (archive: ParsedArchive) => {
    setIsImporting(true);
    try {
      await writeArchive(archive);
      clearAllDrafts();
      notifications.show({
        title: "Import complete",
        message: `${pluralize(archive.sessions.length, "workout")} restored.`,
        color: "green",
      });
      // Reload so every live query and in-memory draft starts from the imported data.
      window.location.reload();
    } catch (err) {
      notifyError("Import failed", err);
      setIsImporting(false);
    }
  };

  const handleFile = async (file: File | null) => {
    resetFileInput.current?.();
    if (!file) return;

    setIsImporting(true);
    let archive: ParsedArchive;
    let currentSessions: number;
    let currentExercises: number;
    try {
      [archive, currentSessions, currentExercises] = await Promise.all([
        parseArchive(file),
        db.sessions.count(),
        db.exercises.count(),
      ]);
    } catch (err) {
      notifyError("Invalid archive", err);
      return;
    } finally {
      setIsImporting(false);
    }

    modals.openConfirmModal({
      title: "Replace all data?",
      children: (
        <ImportSummary
          archive={archive}
          currentSessions={currentSessions}
          currentExercises={currentExercises}
        />
      ),
      labels: { confirm: "Replace my data", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: () => void confirmImport(archive),
    });
  };

  return (
    <div className="pb-6">
      <PageHeader title="Settings" />

      <div className="flex flex-col gap-8 px-4 pt-2">
        <section aria-labelledby="workout-settings">
          <SectionHeading id="workout-settings" className="mb-3 border-b-2 border-fg pb-1 text-fg">
            Workout
          </SectionHeading>
          <div className="flex flex-col gap-4">
            <Switch
              label="Rest timer"
              description="Show a timer after you tick a set. Saved on this device."
              checked={preferences.restTimerEnabled}
              onChange={(e) => updatePreferences({ restTimerEnabled: e.currentTarget.checked })}
              size="md"
            />
            {preferences.restTimerEnabled && (
              <Select
                label="Rest length"
                data={REST_OPTIONS}
                value={String(preferences.restSeconds)}
                onChange={(value) =>
                  value !== null && updatePreferences({ restSeconds: Number(value) })
                }
                allowDeselect={false}
                size="md"
              />
            )}
          </div>
        </section>

        <section aria-labelledby="category-settings">
          <SectionHeading id="category-settings" className="mb-1 border-b-2 border-fg pb-1 text-fg">
            Categories
          </SectionHeading>
          <CategoryManager />
        </section>

        <section aria-labelledby="data-settings">
          <SectionHeading id="data-settings" className="mb-1 border-b-2 border-fg pb-1 text-fg">
            Data
          </SectionHeading>
          <p className="mb-4 text-sm text-fg-faint">
            Your data lives only on this device. Export a ZIP of CSV files to back it up or move it;
            importing one replaces everything here.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              loading={isExporting}
              onClick={() => void handleExport()}
              leftSection={<IconSolarDownload />}
              variant="light"
            >
              Export
            </Button>
            <FileButton
              onChange={(file) => void handleFile(file)}
              accept=".zip,application/zip"
              resetRef={resetFileInput}
            >
              {(props) => (
                <Button
                  {...props}
                  loading={isImporting}
                  leftSection={<IconSolarUpload />}
                  color="red"
                  variant="light"
                >
                  Import…
                </Button>
              )}
            </FileButton>
          </div>
        </section>

        <section aria-labelledby="about-settings">
          <SectionHeading id="about-settings" className="mb-1 border-b-2 border-fg pb-1 text-fg">
            About
          </SectionHeading>
          <p className="text-sm text-fg-faint">Gym Jam · version {__APP_VERSION__}</p>
        </section>
      </div>
    </div>
  );
};

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});
