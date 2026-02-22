interface StatusBadgeProps {
  status: "success" | "warning" | "danger" | "info";
  label: string;
}

const config = {
  success: { emoji: "✅", className: "badge-success" },
  warning: { emoji: "⚠️", className: "badge-warning" },
  danger: { emoji: "⚠️", className: "badge-danger" },
  info: { emoji: "ℹ️", className: "badge-info" },
};

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const { emoji, className } = config[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${className}`}>
      <span className="text-[10px]">{emoji}</span>
      {label}
    </span>
  );
}
