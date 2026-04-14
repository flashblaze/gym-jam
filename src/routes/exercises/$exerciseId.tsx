import { Skeleton } from "@mantine/core";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import IconSolarAltArrowLeftBroken from "~icons/solar/alt-arrow-left-broken";

import ExerciseHistoryItem from "~/components/exercises/ExerciseHistoryItem";
import WeightChart from "~/components/exercises/WeightChart";
import { useExerciseHistory } from "~/hooks/use-exercise-history";
import { useExercise } from "~/hooks/use-exercises";
import { CATEGORY_LABELS, TYPE_LABELS } from "~/lib/constants";

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

  const topWeight = history.length ? Math.max(...history.map((h) => h.maxWeight)) : 0;
  const topEntry = history.find((h) => h.maxWeight === topWeight);
  const chartData = history.map((h) => ({ date: h.date, value: h.maxWeight }));

  return (
    <div className="pb-6">
      <div className="px-4 pt-4">
        <button
          type="button"
          onClick={() => navigate({ to: "/exercises" })}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <IconSolarAltArrowLeftBroken className="text-base" />
          Back
        </button>
        <h1 className="mt-2 text-2xl font-semibold text-gray-900">{exercise.name}</h1>
        <p className="mt-0.5 text-xs capitalize text-gray-500">
          {CATEGORY_LABELS[exercise.category]} · {TYPE_LABELS[exercise.type]}
        </p>
      </div>

      {history.length === 0 ? (
        <p className="py-12 text-center text-sm text-gray-400">No history yet</p>
      ) : (
        <>
          <dl className="grid grid-cols-2 gap-2 px-4 py-3">
            <div className="rounded-xl bg-gray-50 px-3 py-2.5">
              <dt className="text-[10px] uppercase tracking-wide text-gray-500">Top weight</dt>
              <dd className="mt-0.5 text-xl font-semibold text-gray-900">
                {topWeight} <span className="text-xs font-normal text-gray-500">kg</span>
              </dd>
              {topEntry && <p className="mt-0.5 text-[10px] text-gray-400">{topEntry.date}</p>}
            </div>
            <div className="rounded-xl bg-gray-50 px-3 py-2.5">
              <dt className="text-[10px] uppercase tracking-wide text-gray-500">Sessions</dt>
              <dd className="mt-0.5 text-xl font-semibold text-gray-900">{history.length}</dd>
            </div>
          </dl>

          <WeightChart data={chartData} />

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
