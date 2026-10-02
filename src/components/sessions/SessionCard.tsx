import { UnstyledButton } from "@mantine/core";
import { useNavigate } from "@tanstack/react-router";

import { selectableRowClass } from "~/components/selectable-row";
import SelectionIndicator from "~/components/SelectionIndicator";
import type { Exercise, Session } from "~/db/index";
import { useLongPressSelect } from "~/hooks/use-long-press-select";
import { formatVolume, pluralize, sessSetCount, sessVolume } from "~/lib/calc";
import { formatSessionDate } from "~/lib/history";
import { DELETED_EXERCISE_LABEL } from "~/lib/sets";
import { DEFAULT_SESSION_NAME } from "~/lib/workout";

const NAMES_SHOWN = 3;

interface SessionCardProps {
  session: Session;
  exercises: Record<string, Exercise>;
  selectionMode: boolean;
  isSelected: boolean;
  onToggleSelect: () => void;
  /** Long-press entry into selection mode. */
  onLongPress: () => void;
}

const SessionCard = ({
  session,
  exercises,
  selectionMode,
  isSelected,
  onToggleSelect,
  onLongPress,
}: SessionCardProps) => {
  const navigate = useNavigate();
  const longPress = useLongPressSelect(onLongPress);

  const names = session.exercises.map(
    (block) => exercises[block.exerciseId]?.name ?? DELETED_EXERCISE_LABEL,
  );
  const extra = names.length - NAMES_SHOWN;
  const customName = session.name.trim() && session.name !== DEFAULT_SESSION_NAME;

  return (
    <UnstyledButton
      {...longPress.handlers}
      onClick={() => {
        if (longPress.consumeClick()) return;
        if (selectionMode) {
          onToggleSelect();
        } else {
          void navigate({
            to: "/workout/$date",
            params: { date: session.date },
            search: { session: session.id },
          });
        }
      }}
      aria-pressed={selectionMode ? isSelected : undefined}
      className={selectableRowClass(selectionMode, isSelected)}
    >
      {selectionMode && <SelectionIndicator selected={isSelected} />}

      <article className="min-w-0 flex-1 py-3 text-left">
        <header className="flex items-baseline justify-between gap-2">
          <h3 className="font-display text-xl leading-tight font-bold uppercase text-fg">
            {formatSessionDate(session.date)}
          </h3>
          <span className="shrink-0 font-display text-xl font-bold tabular-nums text-primary-500">
            {formatVolume(sessVolume(session))}
          </span>
        </header>
        {customName && (
          <p className="truncate text-xs font-bold uppercase tracking-[0.1em] text-fg-muted">
            {session.name}
          </p>
        )}
        <p className="mt-1 truncate text-sm text-fg-muted">
          {names.length === 0
            ? "No exercises"
            : names.slice(0, NAMES_SHOWN).join(", ") + (extra > 0 ? ` +${extra} more` : "")}
        </p>
        <p className="mt-0.5 text-xs font-semibold uppercase tracking-[0.08em] text-fg-faint">
          {pluralize(sessSetCount(session), "set")} · {pluralize(names.length, "exercise")}
        </p>
      </article>
    </UnstyledButton>
  );
};

export default SessionCard;
