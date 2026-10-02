import { MantineProvider } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import { Notifications } from "@mantine/notifications";
import { RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { db } from "./db";
import { primeLiveCache } from "./hooks/cached-live-query";
import { categoriesCache } from "./hooks/use-categories";
import { exercisesCache } from "./hooks/use-exercises";
import { sessionsCache } from "./hooks/use-sessions";
import { installChunkReloadHandler } from "./lib/chunk-reload";
import { router } from "./router";
import theme from "./theme";

import "@fontsource/barlow/latin-500.css";
import "@fontsource/barlow/latin-600.css";
import "@fontsource/barlow/latin-700.css";
import "@fontsource/barlow-condensed/latin-600.css";
import "@fontsource/barlow-condensed/latin-700.css";
import "@fontsource/barlow-condensed/latin-800.css";
import "@mantine/core/styles.layer.css";
import "@mantine/charts/styles.layer.css";
import "@mantine/dates/styles.layer.css";
import "@mantine/notifications/styles.layer.css";
import "./index.css";

installChunkReloadHandler();

// Warm the shared queries so screens render with data on first visit, not a loading state.
primeLiveCache(sessionsCache);
primeLiveCache(exercisesCache);
primeLiveCache(categoriesCache);

// Request durable IDB storage — reduces browser throttling of IDB in PWA mode.
void navigator.storage?.persist();

// When the app returns to foreground, fire a trivial IDB read so the service
// worker thread is already awake and the IDB connection is warm before the
// user taps Save.
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    db.sessions.count().catch(() => {});
  }
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MantineProvider theme={theme} forceColorScheme="dark">
      <ModalsProvider>
        <Notifications
          position="top-center"
          autoClose={4000}
          limit={5}
          pauseResetOnHover="notification"
        />
        <RouterProvider router={router} />
      </ModalsProvider>
    </MantineProvider>
  </StrictMode>,
);
