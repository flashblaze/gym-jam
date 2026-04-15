import { ActionIcon, UnstyledButton } from "@mantine/core";
import { useNavigate } from "@tanstack/react-router";
import IconSolarTrashBinMinimalisticBroken from "~icons/solar/trash-bin-minimalistic-broken";

import { cn } from "~/cn";
import type { Session } from "~/db/index";
import { formatDate, sessSetCount } from "~/lib/calc";

interface SessionCardProps {
  session: Session;
  onDelete: () => void;
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
}

const SessionCard = ({
  session,
  onDelete,
  selectionMode = false,
  isSelected = false,
  onToggleSelect,
}: SessionCardProps) => {
  const navigate = useNavigate();

  return (
    <UnstyledButton
      onClick={() => {
        if (selectionMode) {
          onToggleSelect?.();
        } else {
          void navigate({ to: "/sessions/$sessionId", params: { sessionId: session.id } });
        }
      }}
      className={cn(
        "flex w-full items-stretch overflow-hidden rounded-xl border transition-all duration-150",
        selectionMode && isSelected
          ? "border-primary-500/40 bg-[#1c1c2e]"
          : "border-white/8 bg-[#18182a]",
      )}
    >
      {/* Selection indicator */}
      {selectionMode && (
        <div className="flex items-center pl-3 pr-2">
          <span
            className={cn(
              "flex h-[22px] w-[22px] items-center justify-center rounded-full transition-all duration-150",
              isSelected ? "bg-primary-500" : "border-2 border-[#333348]",
            )}
          >
            {isSelected && (
              <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                <path
                  d="M1.5 4.5L4.5 7.5L9.5 1.5"
                  stroke="#0f0f1c"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </span>
        </div>
      )}

      {/* Card content */}
      <div className="min-w-0 flex-1 px-4 py-3.5 text-left">
        <div className="mb-1 flex items-baseline justify-between gap-2">
          <span className="text-sm font-semibold text-[#d4d4e0]">{formatDate(session.date)}</span>
          <span className="shrink-0 text-xs text-[#565670]">{session.exercises.length} ex</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#565670]">{session.name}</span>
          <span className="text-[#333348]">·</span>
          <span className="text-xs text-[#565670]">{sessSetCount(session)} sets</span>
        </div>
      </div>

      {/* Delete button (normal mode only) */}
      {!selectionMode && (
        <div className="flex items-center pr-3">
          <ActionIcon
            variant="transparent"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            aria-label="Delete session"
          >
            <IconSolarTrashBinMinimalisticBroken className="text-red-400/60" />
          </ActionIcon>
        </div>
      )}
    </UnstyledButton>
  );
};

export default SessionCard;
