import { createRouter } from "@tanstack/react-router";

import RouteError from "./components/RouteError";
import { routeTree } from "./routeTree.gen";

export const router = createRouter({ routeTree, defaultErrorComponent: RouteError });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
