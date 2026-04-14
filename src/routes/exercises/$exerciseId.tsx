import { Button, Skeleton } from "@mantine/core";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import IconSolarAltArrowLeftBroken from "~icons/solar/alt-arrow-left-broken";

import ExerciseHistoryItem from "~/components/exercises/ExerciseHistoryItem";
import WeightChart from "~/components/exercises/WeightChart";
import { useExerciseHistory } from "~/hooks/use-exercise-history";
import { useExercise } from "~/hooks/use-exercises";
import { formatDuration } from "~/lib/calc";
import { TYPE_LABELS } from "~/lib/constants";

const ExerciseDetailPage = () => {
  const { exerciseId } = Route.useParams();
  const navigate = useNavigate();
  const exercise = useExercise(exerciseId);
  const history = useExerciseHistory(exerciseId);

  if (exercise === undefined || history === undefined) {
    return (
      <div className="px-4 py-5">
        <Skeleton height={28} width={120} mb={8} />
        <Skeleton height={24} width={200} mb={4} />
      </div>
    );
  }

  if (!exercise) {
    void navigate({ to: "/exercises" });
    return null;
  }

  const isTimed = exercise.type === "timed";

  const topWeight = !isTimed && history.length ? Math.max(...history.map((h) => h.maxWeight)) : 0;
  const topEntry = !isTimed ? history.find((h) => h.maxWeight === topWeight) : undefined;

  const bestTime = isTimed && history.length ? Math.max(...history.map((h) => h.bestTime)) : 0;
  const bestTimeEntry = isTimed ? history.find((h) => h.bestTime === bestTime) : undefined;

  const chartData = isTimed
    ? history.map((h) => ({ date: h.date, value: h.bestTime }))
    : history.map((h) => ({ date: h.date, value: h.maxWeight }));

  return (
    <div className="pb-6">
      <div className="px-4 pt-4">
        <Button
          variant="subtle"
          size="compact-sm"
          color="gray"
          leftSection={<IconSolarAltArrowLeftBroken />}
          onClick={() => void navigate({ to: "/exercises" })}
        >
          Back
        </Button>
        <h1 className="mt-2 text-2xl font-semibold text-gray-900">{exercise.name}</h1>
        <p className="mt-0.5 text-xs capitalize text-gray-500">{TYPE_LABELS[exercise.type]}</p>
      </div>

      {history.length === 0 ? (
        <p className="py-12 text-center text-sm text-gray-400">No history yet</p>
      ) : (
        <>
          <dl className="grid grid-cols-2 gap-2 px-4 py-3">
            {isTimed ? (
              <div className="rounded-xl bg-gray-50 px-3 py-2.5">
                <dt className="text-[10px] uppercase tracking-wide text-gray-500">Best time</dt>
                <dd className="mt-0.5 text-xl font-semibold text-gray-900">
                  {formatDuration(bestTime)}
                </dd>
                {bestTimeEntry && (
                  <p className="mt-0.5 text-[10px] text-gray-400">{bestTimeEntry.date}</p>
                )}
              </div>
            ) : (
              <div className="rounded-xl bg-gray-50 px-3 py-2.5">
                <dt className="text-[10px] uppercase tracking-wide text-gray-500">Top weight</dt>
                <dd className="mt-0.5 text-xl font-semibold text-gray-900">
                  {topWeight} <span className="text-xs font-normal text-gray-500">kg</span>
                </dd>
                {topEntry && <p className="mt-0.5 text-[10px] text-gray-400">{topEntry.date}</p>}
              </div>
            )}
            <div className="rounded-xl bg-gray-50 px-3 py-2.5">
              <dt className="text-[10px] uppercase tracking-wide text-gray-500">Sessions</dt>
              <dd className="mt-0.5 text-xl font-semibold text-gray-900">{history.length}</dd>
            </div>
          </dl>

          <WeightChart
            data={chartData}
            label={isTimed ? "Best duration (s)" : "Top set weight (kg)"}
          />

          <div className="px-4">
            <p className="mb-2 mt-2 text-[10px] uppercase tracking-wider text-gray-400">History</p>
            <div className="flex flex-col gap-1.5">
              {[...history].reverse().map((entry, i) => (
                <ExerciseHistoryItem key={i} entry={entry} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export const Route = createFileRoute("/exercises/$exerciseId")({
  component: ExerciseDetailPage,
});
