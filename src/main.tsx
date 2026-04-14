import { MantineProvider } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import { Notifications } from "@mantine/notifications";
import { RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { router } from "./router";
import theme from "./theme";

import "@fontsource-variable/geist";
import "@mantine/core/styles.layer.css";
import "@mantine/dates/styles.layer.css";
import "@mantine/notifications/styles.layer.css";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MantineProvider theme={theme}>
      <ModalsProvider>
        <Notifications position="top-center" />
        <RouterProvider router={router} />
      </ModalsProvider>
    </MantineProvider>
  </StrictMode>,
);
