import { Skeleton } from "@mantine/core";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import IconSolarAltArrowLeftBroken from "~icons/solar/alt-arrow-left-broken";

import ExerciseCard from "~/components/sessions/ExerciseCard";
import SessionStats from "~/components/sessions/SessionStats";
import type { Exercise } from "~/db/index";
import { useExercises } from "~/hooks/use-exercises";
import { useSession } from "~/hooks/use-sessions";
import { formatDate } from "~/lib/calc";

const SessionDetailPage = () => {
  const { sessionId } = Route.useParams();
  const navigate = useNavigate();
  const session = useSession(sessionId);
  const exercisesArr = useExercises();

  const exercises: Record<string, Exercise> =
    exercisesArr?.reduce(
      (acc, ex) => {
        acc[ex.id] = ex;
        return acc;
      },
      {} as Record<string, Exercise>,
    ) ?? {};

  if (session === undefined || exercisesArr === undefined) {
    return (
      <div className="px-4 py-5">
        <Skeleton height={28} width={120} mb={8} />
        <Skeleton height={24} width={200} mb={4} />
        <Skeleton height={96} radius="xl" mt={16} />
        <Skeleton height={64} radius="xl" mt={8} />
        <Skeleton height={64} radius="xl" mt={8} />
      </div>
    );
  }

  if (!session) {
    void navigate({ to: "/sessions" });
    return null;
  }

  return (
    <div className="pb-6">
      <div className="px-4 pt-4">
        <button
          type="button"
          onClick={() => navigate({ to: "/sessions" })}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <IconSolarAltArrowLeftBroken className="text-base" />
          Back
        </button>
        <h1 className="mt-2 text-2xl font-semibold text-gray-900">{formatDate(session.date)}</h1>
        <p className="mt-0.5 text-sm text-gray-500">{session.name}</p>
      </div>

      <SessionStats session={session} />

      <div className="flex flex-col gap-2 px-4 pt-2">
        {session.exercises.map((entry) => (
          <ExerciseCard key={entry.exerciseId} entry={entry} exercises={exercises} />
        ))}
      </div>
    </div>
  );
};

export const Route = createFileRoute("/sessions/$sessionId")({
  component: SessionDetailPage,
});
