import { createRootRoute } from "@tanstack/react-router";
import { useEffect } from "react";

import AppShell from "~/components/layout/AppShell";
import { seedIfEmpty } from "~/db/seed-runner";

const RootComponent = () => {
  useEffect(() => {
    seedIfEmpty().catch(console.error);
  }, []);

  return <AppShell />;
};

export const Route = createRootRoute({
  component: RootComponent,
});
