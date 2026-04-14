import { useNavigate } from "@tanstack/react-router";

import type { Session } from "~/db/index";
import { formatDate, formatVolume, sessSetCount, sessVolume } from "~/lib/calc";

interface SessionCardProps {
  session: Session;
}

const SessionCard = ({ session }: SessionCardProps) => {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate({ to: "/sessions/$sessionId", params: { sessionId: session.id } })}
      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-left shadow-xs transition-colors hover:border-gray-300 hover:bg-gray-50"
    >
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-sm font-medium text-gray-900">
          {formatDate(session.date)} · {session.name}
        </span>
        <span className="text-xs text-gray-400">{session.exercises.length} ex</span>
      </div>
      <div className="flex gap-3 text-xs text-gray-500">
        <span>{sessSetCount(session)} sets</span>
        <span>{formatVolume(sessVolume(session))} volume</span>
      </div>
    </button>
  );
};

export default SessionCard;
