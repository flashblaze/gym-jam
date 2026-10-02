import { createRouter } from "@tanstack/react-router";

import RouteError from "./components/RouteError";
import { routeTree } from "./routeTree.gen";

export const router = createRouter({
  routeTree,
  defaultErrorComponent: RouteError,
  // Start loading a screen's code as soon as a link is touched or hovered.
  defaultPreload: "intent",
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
