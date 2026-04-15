import { Link, useMatchRoute, useRouterState } from "@tanstack/react-router";
import type { ComponentProps } from "react";
import IconSolarDumbbellBold from "~icons/solar/dumbbell-bold";
import IconSolarDumbbellBroken from "~icons/solar/dumbbell-broken";
import IconSolarListCheckBold from "~icons/solar/list-check-bold";
import IconSolarListCheckBroken from "~icons/solar/list-check-broken";

import { useSession } from "~/hooks/use-sessions";

const BottomNav = () => {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const matchRoute = useMatchRoute();
  const sessionMatch = matchRoute({ to: "/sessions/$sessionId" });
  /** Fallback if `matchRoute` does not match but URL is clearly a session detail. */
  const sessionIdFromPath = (() => {
    if (!pathname.startsWith("/sessions/")) return "";
    const rest = pathname.slice("/sessions/".length).split("/")[0];
    return rest && rest !== "" ? rest : "";
  })();
  const sessionId = (sessionMatch ? sessionMatch.sessionId : "") || sessionIdFromPath;
  const session = useSession(sessionId);

  const isSessionsActive = pathname === "/sessions" || pathname.startsWith("/sessions/");
  const isExercisesActive = pathname === "/exercises" || pathname.startsWith("/exercises/");
  const isLogActive = pathname === "/log";

  /** Pass `search` so route `validateSearch` / `useSearch()` receive `date` (query on `to` alone is unreliable). */
  const logLinkProps =
    sessionId && session?.date
      ? { to: "/log" as const, search: { date: session.date } }
      : { to: "/log" as const };

  return (
    <nav className="flex items-center border-t border-white/[0.07] bg-[#0f0f1c]">
      <Link
        to="/sessions"
        className="relative flex flex-1 flex-col items-center gap-1 py-3 no-underline transition-colors"
        style={{ color: isSessionsActive ? "#f59e0b" : "#565670" }}
      >
        {isSessionsActive && (
          <span className="absolute top-0 left-1/2 h-[2px] w-8 -translate-x-1/2 rounded-b-full bg-primary-500" />
        )}
        {isSessionsActive ? (
          <IconSolarListCheckBold className="text-xl" />
        ) : (
          <IconSolarListCheckBroken className="text-xl" />
        )}
        <span className="text-[11px] font-medium tracking-wide">Sessions</span>
      </Link>

      <Link
        {...(logLinkProps as ComponentProps<typeof Link>)}
        className="flex flex-none items-center justify-center px-6 py-2 no-underline"
      >
        <span
          className="flex h-11 w-11 items-center justify-center rounded-full text-2xl font-light text-[#0f0f1c] transition-transform active:scale-95"
          style={{ background: isLogActive ? "#d97706" : "#f59e0b" }}
        >
          +
        </span>
      </Link>

      <Link
        to="/exercises"
        className="relative flex flex-1 flex-col items-center gap-1 py-3 no-underline transition-colors"
        style={{ color: isExercisesActive ? "#f59e0b" : "#565670" }}
      >
        {isExercisesActive && (
          <span className="absolute top-0 left-1/2 h-[2px] w-8 -translate-x-1/2 rounded-b-full bg-primary-500" />
        )}
        {isExercisesActive ? (
          <IconSolarDumbbellBold className="text-xl" />
        ) : (
          <IconSolarDumbbellBroken className="text-xl" />
        )}
        <span className="text-[11px] font-medium tracking-wide">Exercises</span>
      </Link>
    </nav>
  );
};

export default BottomNav;
