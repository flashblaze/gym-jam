import { Button, FileButton } from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import IconSolarDownload from "~icons/solar/download-minimalistic-broken";
import IconSolarUpload from "~icons/solar/upload-minimalistic-broken";

import { createExportArchive, downloadExport } from "../lib/csv/export-archive";
import { importArchive } from "../lib/csv/import-archive";

export const Route = createFileRoute("/settings")({
  component: SettingsRoute,
});

function SettingsRoute() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const blob = await createExportArchive();
      downloadExport(blob);
      notifications.show({
        title: "Export complete",
        message: "Your data has been successfully exported.",
        color: "green",
      });
    } catch (err) {
      notifications.show({
        title: "Export failed",
        message: err instanceof Error ? err.message : "An unknown error occurred",
        color: "red",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (file: File | null) => {
    if (!file) return;

    modals.openConfirmModal({
      title: "Confirm data import",
      children: (
        <p className="text-sm text-[#d4d4e0]">
          Importing this archive will completely overwrite your local database. All current data
          will be lost and replaced with the contents of the archive. Are you sure you want to
          proceed?
        </p>
      ),
      labels: { confirm: "Import and Overwrite", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        try {
          setIsImporting(true);
          await importArchive(file);
          notifications.show({
            title: "Import complete",
            message: "Your data has been successfully imported.",
            color: "green",
          });
          // Refresh the page to reload the newly imported data everywhere
          window.location.reload();
        } catch (err) {
          notifications.show({
            title: "Import failed",
            message: err instanceof Error ? err.message : "An unknown error occurred",
            color: "red",
          });
        } finally {
          setIsImporting(false);
        }
      },
    });
  };

  return (
    <div className="px-4 pb-6">
      <header className="flex items-center justify-between py-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#d4d4e0]">Settings</h1>
        </div>
      </header>

      <div className="flex flex-col gap-6">
        <section>
          <h2 className="mb-2 text-lg font-semibold tracking-tight text-[#d4d4e0]">
            Data Management
          </h2>
          <p className="mb-4 text-sm text-[#565670]">
            Export your database to a ZIP archive containing CSV files, or import an existing
            archive to restore your data.
          </p>
          <div className="flex items-center gap-4">
            <Button
              loading={isExporting}
              onClick={handleExport}
              leftSection={<IconSolarDownload />}
              variant="light"
            >
              Export Archive
            </Button>
            <FileButton onChange={handleImport} accept=".zip,application/zip">
              {(props) => (
                <Button
                  {...props}
                  loading={isImporting}
                  leftSection={<IconSolarUpload />}
                  color="red"
                  variant="light"
                >
                  Import Archive
                </Button>
              )}
            </FileButton>
          </div>
        </section>
      </div>
    </div>
  );
}
