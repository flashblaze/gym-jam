import { Button } from "@mantine/core";
import IconSolarRestartBroken from "~icons/solar/restart-broken";

import EmptyState from "./EmptyState";

/** Router fallback, e.g. when a page's code can't be loaded after a deploy. */
const RouteError = () => (
  <EmptyState
    message="This page failed to load. Reloading usually fixes it; your workout is saved."
    action={
      <Button
        size="md"
        leftSection={<IconSolarRestartBroken />}
        onClick={() => window.location.reload()}
      >
        Reload
      </Button>
    }
  />
);

export default RouteError;
