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
          variant="default"
          size="compact-sm"
          leftSection={<IconSolarAltArrowLeftBroken />}
          onClick={() => void navigate({ to: "/exercises" })}
        >
          Back
        </Button>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-[#d4d4e0]">{exercise.name}</h1>
        <p className="mt-0.5 text-xs capitalize text-[#565670]">{TYPE_LABELS[exercise.type]}</p>
      </div>

      {history.length === 0 ? (
        <p className="py-12 text-center text-sm text-[#565670]">No history yet</p>
      ) : (
        <>
          <dl className="grid grid-cols-2 gap-2 px-4 py-3">
            {isTimed ? (
              <div className="rounded-xl border border-white/[0.06] bg-[#18182a] px-4 py-3">
                <dt className="text-[10px] font-medium uppercase tracking-widest text-[#565670]">
                  Best time
                </dt>
                <dd className="mt-1 text-2xl font-bold text-[#f59e0b]">
                  {formatDuration(bestTime)}
                </dd>
                {bestTimeEntry && (
                  <p className="mt-0.5 text-[10px] text-[#565670]">{bestTimeEntry.date}</p>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-white/[0.06] bg-[#18182a] px-4 py-3">
                <dt className="text-[10px] font-medium uppercase tracking-widest text-[#565670]">
                  Top weight
                </dt>
                <dd className="mt-1 text-2xl font-bold text-[#f59e0b]">
                  {topWeight}
                  <span className="ml-1 text-sm font-normal text-[#565670]">kg</span>
                </dd>
                {topEntry && <p className="mt-0.5 text-[10px] text-[#565670]">{topEntry.date}</p>}
              </div>
            )}
            <div className="rounded-xl border border-white/[0.06] bg-[#18182a] px-4 py-3">
              <dt className="text-[10px] font-medium uppercase tracking-widest text-[#565670]">
                Sessions
              </dt>
              <dd className="mt-1 text-2xl font-bold text-[#f59e0b]">{history.length}</dd>
            </div>
          </dl>

          <WeightChart
            data={chartData}
            label={isTimed ? "Best duration (s)" : "Top set weight (kg)"}
          />

          <div className="px-4">
            <p className="mb-2 mt-2 text-[10px] font-medium uppercase tracking-widest text-[#565670]">
              History
            </p>
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
