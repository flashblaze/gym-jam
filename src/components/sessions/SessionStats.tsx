import type { Session } from "~/db/index";
import { sessSetCount } from "~/lib/calc";

interface SessionStatsProps {
  session: Session;
}

const SessionStats = ({ session }: SessionStatsProps) => {
  const stats = [
    { label: "Exercises", value: session.exercises.length },
    { label: "Sets", value: sessSetCount(session) },
  ];

  return (
    <dl className="grid grid-cols-2 gap-2 px-4 py-3">
      {stats.map(({ label, value }) => (
        <div key={label} className="rounded-xl bg-gray-50 px-3 py-2.5">
          <dt className="text-[10px] uppercase tracking-wide text-gray-500">{label}</dt>
          <dd className="mt-0.5 text-lg font-semibold text-gray-900">{value}</dd>
        </div>
      ))}
    </dl>
  );
};

export default SessionStats;
