import { ActionIcon, Loader, Menu, Popover, TextInput, UnstyledButton } from "@mantine/core";
import { DatePicker } from "@mantine/dates";
import { useDisclosure } from "@mantine/hooks";
import { Link } from "@tanstack/react-router";
import dayjs from "dayjs";
import IconSolarAltArrowDownBroken from "~icons/solar/alt-arrow-down-broken";
import IconSolarAltArrowLeftBroken from "~icons/solar/alt-arrow-left-broken";
import IconSolarMenuDotsBold from "~icons/solar/menu-dots-bold";
import IconTablerCheck from "~icons/tabler/check";

import type { SaveStatus } from "~/hooks/use-workout-persistence";
import { todayIso } from "~/lib/calc";
import { formatSessionDate } from "~/lib/history";

interface WorkoutHeaderProps {
  date: string;
  name: string;
  summary: string;
  /** `null` when nothing has been logged yet. */
  saveStatus: SaveStatus | null;
  canDelete: boolean;
  onNameChange: (name: string) => void;
  onDateChange: (date: string) => void;
  onDelete: () => void;
}

function formatWorkoutDate(iso: string): string {
  const d = dayjs(iso);
  const today = dayjs();
  if (d.isSame(today, "day")) return "Today";
  if (d.isSame(today.subtract(1, "day"), "day")) return "Yesterday";
  return formatSessionDate(iso);
}

const WorkoutHeader = ({
  date,
  name,
  summary,
  saveStatus,
  canDelete,
  onNameChange,
  onDateChange,
  onDelete,
}: WorkoutHeaderProps) => {
  const [dateOpened, { toggle: toggleDate, close: closeDate }] = useDisclosure(false);

  return (
    <header className="px-4 pt-4 pb-3">
      <div className="flex items-center gap-2">
        <ActionIcon
          component={Link}
          to="/sessions"
          size="lg"
          variant="subtle"
          color="gray"
          aria-label="Back to history"
        >
          <IconSolarAltArrowLeftBroken className="text-lg" />
        </ActionIcon>

        <h1 className="text-2xl font-bold tracking-tight text-fg">
          <Popover opened={dateOpened} onChange={(o) => !o && closeDate()} position="bottom-start">
            <Popover.Target>
              <UnstyledButton
                onClick={toggleDate}
                className="flex items-center gap-1.5"
                aria-haspopup="dialog"
                aria-expanded={dateOpened}
              >
                {formatWorkoutDate(date)}
                <IconSolarAltArrowDownBroken className="text-base text-fg-faint" />
                <span className="sr-only">(change date)</span>
              </UnstyledButton>
            </Popover.Target>
            <Popover.Dropdown>
              <DatePicker
                value={date}
                maxDate={todayIso()}
                onChange={(value) => {
                  if (!value) return;
                  closeDate();
                  onDateChange(dayjs(value).format("YYYY-MM-DD"));
                }}
              />
            </Popover.Dropdown>
          </Popover>
        </h1>

        {canDelete && (
          <Menu position="bottom-end">
            <Menu.Target>
              <ActionIcon
                size="lg"
                variant="subtle"
                color="gray"
                className="ml-auto"
                aria-label="Workout options"
              >
                <IconSolarMenuDotsBold className="text-lg" />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item color="red" onClick={onDelete}>
                Delete workout
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        )}
      </div>

      <TextInput
        variant="unstyled"
        size="md"
        aria-label="Workout name"
        placeholder="Workout name"
        value={name}
        onChange={(e) => onNameChange(e.currentTarget.value)}
        className="mt-1"
        classNames={{ input: "text-fg-muted" }}
      />
      <p className="flex items-center gap-1.5 text-xs text-fg-faint" aria-live="polite">
        {saveStatus === "saved" && (
          <span className="flex items-center gap-1 text-green-500">
            <IconTablerCheck />
            Saved
          </span>
        )}
        {saveStatus === "saving" && (
          <span className="flex items-center gap-1">
            <Loader size={10} color="gray" />
            Saving…
          </span>
        )}
        {saveStatus === "error" && <span className="text-red-400">Not saved</span>}
        {saveStatus && <span aria-hidden>·</span>}
        <span>{summary}</span>
      </p>
    </header>
  );
};

export default WorkoutHeader;
