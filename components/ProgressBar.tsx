interface ProgressBarProps {
  current: number;
  total: number;
  visible: boolean;
  onCancel?: () => void;
}

export default function ProgressBar({ current, total, visible, onCancel }: ProgressBarProps) {
  if (!visible) return null;

  const percent = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between text-sm text-slate-400">
        <span>
          {current.toLocaleString()} / {total.toLocaleString()} rows
        </span>
        <div className="flex items-center gap-2">
          <span>{percent}%</span>
          {onCancel && (
            <button
              onClick={onCancel}
              className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-700 text-slate-400 hover:bg-red-600 hover:text-white transition-colors"
              title="Cancel generation"
            >
              <span className="material-icons text-sm">close</span>
            </button>
          )}
        </div>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-slate-700">
        <div
          className="h-full rounded-full bg-primary transition-all duration-150"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
