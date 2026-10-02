import { Outlet } from "@tanstack/react-router";

import RestTimer from "~/components/workout/RestTimer";
import { usePreferences } from "~/hooks/use-preferences";
import { useRestTimer } from "~/hooks/use-rest-timer";

import BottomNav from "./BottomNav";

const AppShell = () => {
  const timer = useRestTimer();
  const [preferences] = usePreferences();

  return (
    <div className="mx-auto flex h-dvh max-w-md flex-col bg-surface">
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
      {timer && preferences.restTimerEnabled && <RestTimer key={timer.startedAt} timer={timer} />}
      <BottomNav />
    </div>
  );
};

export default AppShell;
