import { useRouterState, Link } from "@tanstack/react-router";
import IconSolarDumbbellBroken from "~icons/solar/dumbbell-broken";
import IconSolarListCheckBroken from "~icons/solar/list-check-broken";

const BottomNav = () => {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const isSessionsActive = pathname === "/sessions" || pathname.startsWith("/sessions/");
  const isExercisesActive = pathname === "/exercises" || pathname.startsWith("/exercises/");
  const isLogActive = pathname === "/log";

  return (
    <nav className="flex items-center border-t border-t-gray-200 bg-white">
      <Link
        to="/sessions"
        className="flex flex-1 flex-col items-center gap-1 py-3"
        style={{
          color: isSessionsActive
            ? "var(--mantine-color-primary-6)"
            : "var(--mantine-color-dimmed)",
        }}
      >
        <IconSolarListCheckBroken className="text-xl" />
        <span className="text-[11px] font-medium">Sessions</span>
      </Link>

      <Link to="/log" className="flex flex-none items-center justify-center px-6 py-2">
        <span
          className="flex h-10 w-10 items-center justify-center rounded-full text-2xl font-light text-white"
          style={{
            background: isLogActive
              ? "var(--mantine-color-primary-7)"
              : "var(--mantine-color-primary-6)",
          }}
        >
          +
        </span>
      </Link>

      <Link
        to="/exercises"
        className="flex flex-1 flex-col items-center gap-1 py-3"
        style={{
          color: isExercisesActive
            ? "var(--mantine-color-primary-6)"
            : "var(--mantine-color-dimmed)",
        }}
      >
        <IconSolarDumbbellBroken className="text-xl" />
        <span className="text-[11px] font-medium">Exercises</span>
      </Link>
    </nav>
  );
};

export default BottomNav;
