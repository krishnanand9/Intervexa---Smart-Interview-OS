import type { LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  label: string;
  value: string;
  change: string;
}

export default function StatCard({ icon: Icon, label, value, change }: Props) {
  return (
    <div className="intervexa-card rounded-2xl border border-white/10 bg-card p-5">
      <div className="flex items-center justify-between">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-purple/10 text-purple">
          <Icon size={19} />
        </span>
        <span className="text-xs font-medium text-emerald-400">{change}</span>
      </div>
      <p className="mt-5 text-sm text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}
