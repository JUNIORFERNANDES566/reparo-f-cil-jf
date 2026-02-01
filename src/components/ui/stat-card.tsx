import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "primary" | "accent";
}

export function StatCard({ title, value, icon: Icon, trend, variant = "default" }: StatCardProps) {
  return (
    <div className={cn(
      "rounded-xl p-6 shadow-card card-hover",
      variant === "default" && "bg-card",
      variant === "primary" && "gradient-primary text-primary-foreground",
      variant === "accent" && "gradient-accent text-accent-foreground"
    )}>
      <div className="flex items-start justify-between">
        <div>
          <p className={cn(
            "text-sm font-medium",
            variant === "default" ? "text-muted-foreground" : "opacity-80"
          )}>
            {title}
          </p>
          <p className="text-3xl font-display font-bold mt-2">{value}</p>
          {trend && (
            <p className={cn(
              "text-sm mt-2 font-medium",
              variant === "default" 
                ? (trend.isPositive ? "text-success" : "text-destructive")
                : "opacity-80"
            )}>
              {trend.isPositive ? "+" : ""}{trend.value}% este mês
            </p>
          )}
        </div>
        <div className={cn(
          "p-3 rounded-lg",
          variant === "default" && "bg-primary/10",
          variant === "primary" && "bg-white/20",
          variant === "accent" && "bg-white/20"
        )}>
          <Icon className={cn(
            "h-6 w-6",
            variant === "default" && "text-primary"
          )} />
        </div>
      </div>
    </div>
  );
}
