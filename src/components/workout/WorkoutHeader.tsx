import { ActionIcon, Loader, Menu, Popover, TextInput, UnstyledButton } from "@mantine/core";
import { DatePicker } from "@mantine/dates";
import { useDisclosure } from "@mantine/hooks";
import { Link } from "@tanstack/react-router";
import dayjs from "dayjs";
import IconSolarAltArrowDownBroken from "~icons/solar/alt-arrow-down-broken";
import IconSolarAltArrowLeftBroken from "~icons/solar/alt-arrow-left-broken";
import IconSolarMenuDotsBold from "~icons/solar/menu-dots-bold";
import IconTablerCheck from "~icons/tabler/check";

import StatTile from "~/components/StatTile";
import type { SaveStatus } from "~/hooks/use-workout-persistence";
import { todayIso } from "~/lib/calc";
import { formatSessionDate } from "~/lib/history";
import { METRIC_INFO } from "~/lib/progress";

export interface WorkoutStats {
  sets: number;
  /** Total lifted in whole kg, already formatted (e.g. "2,035"). */
  volume: string;
}

interface WorkoutHeaderProps {
  date: string;
  name: string;
  /** `null` when nothing has been logged yet; `emptyHint` is shown instead. */
  stats: WorkoutStats | null;
  emptyHint: string;
  saveStatus: SaveStatus;
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

const SaveStatusValue = ({ status }: { status: SaveStatus }) => {
  if (status === "saving") return <Loader size={18} color="gray" aria-label="Saving" />;
  if (status === "error") return <span className="text-danger">Error</span>;
  return <IconTablerCheck className="text-success" role="img" aria-label="Saved" />;
};

const WorkoutHeader = ({
  date,
  name,
  stats,
  emptyHint,
  saveStatus,
  canDelete,
  onNameChange,
  onDateChange,
  onDelete,
}: WorkoutHeaderProps) => {
  const [dateOpened, { toggle: toggleDate, close: closeDate }] = useDisclosure(false);

  return (
    <header className="flex flex-col gap-3 border-b border-line px-4 pt-4 pb-4">
      <div className="flex items-center justify-between">
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
        {canDelete && (
          <Menu position="bottom-end">
            <Menu.Target>
              <ActionIcon size="lg" variant="default" aria-label="Workout options">
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

      <div>
        <h1 className="font-display text-[44px] leading-[0.9] font-extrabold uppercase text-fg">
          <Popover opened={dateOpened} onChange={(o) => !o && closeDate()} position="bottom-start">
            <Popover.Target>
              <UnstyledButton
                onClick={toggleDate}
                className="flex items-center gap-2 text-left"
                aria-haspopup="dialog"
                aria-expanded={dateOpened}
              >
                {formatWorkoutDate(date)}
                <IconSolarAltArrowDownBroken className="text-xl text-primary-500" />
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
        <TextInput
          variant="unstyled"
          size="md"
          aria-label="Workout name"
          placeholder="Name this workout"
          value={name}
          onChange={(e) => onNameChange(e.currentTarget.value)}
          classNames={{
            input: "text-sm font-bold uppercase tracking-[0.14em] text-fg-subtle",
          }}
        />
      </div>

      {stats ? (
        <dl className="m-0 grid grid-cols-3 gap-px border border-line bg-line" aria-live="polite">
          <StatTile label="Sets" value={stats.sets} />
          <StatTile
            label="Total lifted"
            value={stats.volume}
            unit="kg"
            info={METRIC_INFO.volume.description}
          />
          <StatTile label="Status" value={<SaveStatusValue status={saveStatus} />} />
        </dl>
      ) : (
        <p className="text-sm font-semibold uppercase tracking-[0.1em] text-fg-faint">
          {emptyHint}
        </p>
      )}
    </header>
  );
};

export default WorkoutHeader;
