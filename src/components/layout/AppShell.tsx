import { ActionIcon } from "@mantine/core";
import { Link, Outlet } from "@tanstack/react-router";
import IconSolarSettingsBroken from "~icons/solar/settings-broken";

import BottomNav from "./BottomNav";

const AppShell = () => {
  return (
    <div className="mx-auto flex h-dvh max-w-md flex-col bg-[#0f0f1c]">
      <header className="flex items-center justify-end px-4 pt-4 pb-0">
        <ActionIcon
          component={Link}
          to="/settings"
          variant="subtle"
          color="gray"
          radius="xl"
          aria-label="Settings"
        >
          <IconSolarSettingsBroken className="text-xl text-[#565670]" />
        </ActionIcon>
      </header>
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
};

export default AppShell;
