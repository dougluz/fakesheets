interface ProgressBarProps {
  current: number;
  total: number;
  visible: boolean;
}

export default function ProgressBar({ current, total, visible }: ProgressBarProps) {
  if (!visible) return null;

  const percent = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between text-sm text-zinc-600 dark:text-zinc-400">
        <span>
          {current.toLocaleString()} / {total.toLocaleString()} rows
        </span>
        <span>{percent}%</span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
        <div
          className="h-full rounded-full bg-blue-600 transition-all duration-150"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
