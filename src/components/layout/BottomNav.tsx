import { Link, useRouterState } from "@tanstack/react-router";

import { cn } from "~/cn";
import { todayIso } from "~/lib/calc";

function tabClass(active: boolean): string {
  return cn(
    "flex min-h-14 flex-1 items-center justify-center text-xs font-bold uppercase tracking-[0.12em] no-underline transition-colors",
    "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-500",
    active
      ? "text-fg shadow-[inset_0_3px_0_var(--color-primary-500)]"
      : "text-fg-subtle hover:text-fg",
  );
}

const BottomNav = () => {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const today = todayIso();

  const isWorkoutActive = pathname === `/workout/${today}`;
  // Past workouts are reached from History, so they keep History highlighted.
  const isHistoryActive =
    pathname.startsWith("/sessions") || (pathname.startsWith("/workout/") && !isWorkoutActive);
  const isExercisesActive = pathname.startsWith("/exercises");
  const isSettingsActive = pathname.startsWith("/settings");

  return (
    <nav
      aria-label="Main"
      className="flex border-t border-line bg-surface pb-[env(safe-area-inset-bottom)]"
    >
      <Link
        to="/workout/$date"
        params={{ date: today }}
        className={tabClass(isWorkoutActive)}
        aria-current={isWorkoutActive ? "page" : undefined}
      >
        Workout
      </Link>
      <Link
        to="/sessions"
        className={tabClass(isHistoryActive)}
        aria-current={isHistoryActive ? "page" : undefined}
      >
        History
      </Link>
      <Link
        to="/exercises"
        className={tabClass(isExercisesActive)}
        aria-current={isExercisesActive ? "page" : undefined}
      >
        Exercises
      </Link>
      <Link
        to="/settings"
        className={tabClass(isSettingsActive)}
        aria-current={isSettingsActive ? "page" : undefined}
      >
        Settings
      </Link>
    </nav>
  );
};

export default BottomNav;
