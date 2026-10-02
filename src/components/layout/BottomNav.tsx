import { Link, useRouterState } from "@tanstack/react-router";
import type { ComponentType, SVGProps } from "react";
import IconSolarDumbbellBold from "~icons/solar/dumbbell-bold";
import IconSolarDumbbellBroken from "~icons/solar/dumbbell-broken";
import IconSolarHistoryBold from "~icons/solar/history-bold";
import IconSolarHistoryBroken from "~icons/solar/history-broken";
import IconSolarSettingsBold from "~icons/solar/settings-bold";
import IconSolarSettingsBroken from "~icons/solar/settings-broken";
import IconSolarStopwatchPlayBold from "~icons/solar/stopwatch-play-bold";
import IconSolarStopwatchPlayBroken from "~icons/solar/stopwatch-play-broken";

import { cn } from "~/cn";
import { todayIso } from "~/lib/calc";

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

interface TabContentProps {
  active: boolean;
  label: string;
  icon: Icon;
  activeIcon: Icon;
}

const TabContent = ({ active, label, icon: IconIdle, activeIcon: IconActive }: TabContentProps) => (
  <>
    {active && (
      <span className="absolute top-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-b-full bg-primary-500" />
    )}
    {active ? <IconActive className="text-xl" /> : <IconIdle className="text-xl" />}
    <span className="text-xs font-medium tracking-wide">{label}</span>
  </>
);

function tabClass(active: boolean): string {
  return cn(
    "relative flex min-h-14 flex-1 flex-col items-center justify-center gap-1 py-2 no-underline transition-colors",
    "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-500",
    active ? "text-primary-500" : "text-fg-faint hover:text-fg-subtle",
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
        <TabContent
          active={isWorkoutActive}
          label="Workout"
          icon={IconSolarStopwatchPlayBroken}
          activeIcon={IconSolarStopwatchPlayBold}
        />
      </Link>
      <Link
        to="/sessions"
        className={tabClass(isHistoryActive)}
        aria-current={isHistoryActive ? "page" : undefined}
      >
        <TabContent
          active={isHistoryActive}
          label="History"
          icon={IconSolarHistoryBroken}
          activeIcon={IconSolarHistoryBold}
        />
      </Link>
      <Link
        to="/exercises"
        className={tabClass(isExercisesActive)}
        aria-current={isExercisesActive ? "page" : undefined}
      >
        <TabContent
          active={isExercisesActive}
          label="Exercises"
          icon={IconSolarDumbbellBroken}
          activeIcon={IconSolarDumbbellBold}
        />
      </Link>
      <Link
        to="/settings"
        className={tabClass(isSettingsActive)}
        aria-current={isSettingsActive ? "page" : undefined}
      >
        <TabContent
          active={isSettingsActive}
          label="Settings"
          icon={IconSolarSettingsBroken}
          activeIcon={IconSolarSettingsBold}
        />
      </Link>
    </nav>
  );
};

export default BottomNav;
