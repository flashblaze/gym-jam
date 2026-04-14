import { Link, useRouterState } from "@tanstack/react-router";
import IconSolarDumbbellBroken from "~icons/solar/dumbbell-broken";
import IconSolarListCheckBroken from "~icons/solar/list-check-broken";

const BottomNav = () => {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const isSessionsActive = pathname === "/sessions" || pathname.startsWith("/sessions/");
  const isExercisesActive = pathname === "/exercises" || pathname.startsWith("/exercises/");
  const isLogActive = pathname === "/log";

  return (
    <nav className="flex items-center border-t border-white/[0.07] bg-[#0f0f1c]">
      <Link
        to="/sessions"
        className="relative flex flex-1 flex-col items-center gap-1 py-3 no-underline transition-colors"
        style={{ color: isSessionsActive ? "#f59e0b" : "#565670" }}
      >
        {isSessionsActive && (
          <span className="absolute top-0 left-1/2 h-[2px] w-8 -translate-x-1/2 rounded-b-full bg-[#f59e0b]" />
        )}
        <IconSolarListCheckBroken className="text-xl" />
        <span className="text-[11px] font-medium tracking-wide">Sessions</span>
      </Link>

      <Link to="/log" className="flex flex-none items-center justify-center px-6 py-2 no-underline">
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
          <span className="absolute top-0 left-1/2 h-[2px] w-8 -translate-x-1/2 rounded-b-full bg-[#f59e0b]" />
        )}
        <IconSolarDumbbellBroken className="text-xl" />
        <span className="text-[11px] font-medium tracking-wide">Exercises</span>
      </Link>
    </nav>
  );
};

export default BottomNav;
