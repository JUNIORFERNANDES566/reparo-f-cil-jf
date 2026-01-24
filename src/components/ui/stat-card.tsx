import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  variant?: "default" | "primary" | "accent";
}

export function StatCard({ title, value, icon: Icon, variant = "default" }: StatCardProps) {
  const variantStyles = {
    default: "bg-card",
    primary: "bg-primary/5 border-primary/20",
    accent: "bg-accent/5 border-accent/20",
  };

  const iconStyles = {
    default: "bg-secondary text-foreground",
    primary: "bg-primary/10 text-primary",
    accent: "bg-accent/10 text-accent",
  };

  return (
    <div className={cn(
      "rounded-xl p-6 shadow-card border transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5",
      variantStyles[variant]
    )}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
        </div>
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", iconStyles[variant])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
