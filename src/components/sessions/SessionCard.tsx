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
    <div className="flex items-stretch rounded-xl border border-gray-200 bg-white shadow-xs transition-colors hover:border-gray-300">
      <UnstyledButton
        onClick={() =>
          void navigate({ to: "/sessions/$sessionId", params: { sessionId: session.id } })
        }
        className="min-w-0 flex-1 px-4 py-3 text-left"
      >
        <div className="mb-1.5 flex items-baseline justify-between">
          <span className="text-sm font-medium text-gray-900">
            {formatDate(session.date)} · {session.name}
          </span>
          <span className="ml-2 shrink-0 text-xs text-gray-400">{session.exercises.length} ex</span>
        </div>
        <div className="flex gap-3 text-xs text-gray-500">
          <span>{sessSetCount(session)} sets</span>
        </div>
      </UnstyledButton>
      <div className="flex items-center pr-3">
        <ActionIcon
          variant="subtle"
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
