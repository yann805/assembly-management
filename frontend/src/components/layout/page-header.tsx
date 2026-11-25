import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="mb-6 flex min-w-0 flex-col items-start gap-4 sm:flex-row sm:justify-between">
      <div className="min-w-0">
        <h1 className="break-words text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="w-full sm:w-auto">{action}</div>}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  description?: string;
  className?: string;
}

export function StatCard({ label, value, icon, description, className }: StatCardProps) {
  return (
    <div className={cn('min-w-0 rounded-lg border bg-card p-4 shadow-sm sm:p-5', className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="min-w-0 text-sm font-medium text-muted-foreground">{label}</p>
        {icon && <div className="shrink-0 text-muted-foreground">{icon}</div>}
      </div>
      <p className="mt-2 break-words text-2xl font-bold sm:text-3xl">{value}</p>
      {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
    </div>
  );
}
