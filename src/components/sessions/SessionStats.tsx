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
        <div key={label} className="rounded-xl border border-white/[0.06] bg-[#18182a] px-4 py-3">
          <dt className="text-[10px] font-medium uppercase tracking-widest text-[#565670]">
            {label}
          </dt>
          <dd className="mt-1 text-2xl font-bold text-[#f59e0b]">{value}</dd>
        </div>
      ))}
    </dl>
  );
};

export default SessionStats;
