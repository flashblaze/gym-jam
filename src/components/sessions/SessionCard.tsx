import { ActionIcon, UnstyledButton } from "@mantine/core";
import { useNavigate } from "@tanstack/react-router";
import IconSolarTrashBinMinimalisticBroken from "~icons/solar/trash-bin-minimalistic-broken";

import type { Session } from "~/db/index";
import { formatDate, sessSetCount } from "~/lib/calc";

interface SessionCardProps {
  session: Session;
  onDelete: () => void;
}

const SessionCard = ({ session, onDelete }: SessionCardProps) => {
  const navigate = useNavigate();

  return (
    <div className="flex items-stretch rounded-xl border border-white/[0.08] bg-[#18182a] transition-colors hover:border-white/[0.14] hover:bg-[#1e1e32]">
      <UnstyledButton
        onClick={() =>
          void navigate({ to: "/sessions/$sessionId", params: { sessionId: session.id } })
        }
        className="min-w-0 flex-1 px-4 py-3.5 text-left"
      >
        <div className="mb-1 flex items-baseline justify-between gap-2">
          <span className="text-sm font-semibold text-[#d4d4e0]">{formatDate(session.date)}</span>
          <span className="shrink-0 text-xs text-[#565670]">{session.exercises.length} ex</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#565670]">{session.name}</span>
          <span className="text-[#333348]">·</span>
          <span className="text-xs text-[#565670]">{sessSetCount(session)} sets</span>
        </div>
      </UnstyledButton>
      <div className="flex items-center pr-3">
        <ActionIcon
          variant="default"
          color="red"
          size="sm"
          onClick={onDelete}
          aria-label="Delete session"
        >
          <IconSolarTrashBinMinimalisticBroken />
        </ActionIcon>
      </div>
    </div>
  );
};

export default SessionCard;
