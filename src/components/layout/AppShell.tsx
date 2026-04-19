import { Outlet } from "@tanstack/react-router";

import BottomNav from "./BottomNav";

const AppShell = () => {
  return (
    <div className="mx-auto flex h-dvh max-w-md flex-col bg-[#0f0f1c]">
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
};

export default AppShell;
