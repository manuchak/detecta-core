import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BigCategoryButtonProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  color: string;
  selected?: boolean;
  onClick: () => void;
}

export const BigCategoryButton = ({
  icon: Icon,
  title,
  subtitle,
  color,
  selected,
  onClick
}: BigCategoryButtonProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full min-h-[72px] p-4 rounded-2xl border-2 transition-all duration-200",
        "flex items-center gap-4 text-left",
        "active:scale-[0.98] touch-manipulation",
        selected
          ? "border-primary bg-primary/10 shadow-md"
          : "border-border bg-card hover:border-primary/50 hover:bg-accent/50"
      )}
    >
      <div
        className={cn(
          "w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0",
          color
        )}
      >
        <Icon className="w-7 h-7 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-lg font-semibold text-foreground truncate">{title}</p>
        <p className="text-sm text-muted-foreground line-clamp-2">{subtitle}</p>
      </div>
      {selected && (
        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
    </button>
  );
};
