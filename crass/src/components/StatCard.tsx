import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: string;
  trendUp?: boolean;
  className?: string;
}

export function StatCard({ title, value, subtitle, icon, trend, trendUp, className = "" }: StatCardProps) {
  return (
    <div className={`glass-card p-5 hover:border-primary/30 transition-all duration-300 group ${className}`}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-sm text-muted-foreground font-medium">{title}</span>
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors">
          {icon}
        </div>
      </div>
      <p className="text-3xl font-bold text-foreground">{value}</p>
      <div className="flex items-center gap-2 mt-1">
        {trend && (
          <span className={`text-xs font-medium ${trendUp ? "text-success" : "text-destructive"}`}>
            {trend}
          </span>
        )}
        {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
      </div>
    </div>
  );
}
