import { Home, PlusCircle, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

export type NavItem = 'home' | 'create' | 'list';

export interface MobileBottomNavProps {
  activeItem: NavItem;
  onNavigate: (item: NavItem) => void;
  pendingCount?: number;
}

const MobileBottomNav = ({
  activeItem,
  onNavigate,
  pendingCount = 0
}: MobileBottomNavProps) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border safe-area-inset-bottom z-50">
      <div className="flex items-end justify-around px-4 py-2">
        {/* Home */}
        <button
          onClick={() => onNavigate('home')}
          className={cn(
            "flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-colors touch-manipulation",
            activeItem === 'home'
              ? "text-primary"
              : "text-muted-foreground"
          )}
        >
          <Home className="w-6 h-6" />
          <span className="text-xs font-medium">Inicio</span>
        </button>

        {/* Create - Prominent center button */}
        <button
          onClick={() => onNavigate('create')}
          className={cn(
            "flex flex-col items-center gap-1 -mt-4 touch-manipulation",
          )}
        >
          <div className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95",
            activeItem === 'create'
              ? "bg-primary text-primary-foreground"
              : "bg-primary text-primary-foreground"
          )}>
            <PlusCircle className="w-8 h-8" />
          </div>
          <span className={cn(
            "text-xs font-semibold",
            activeItem === 'create' ? "text-primary" : "text-foreground"
          )}>
            Reportar
          </span>
        </button>

        {/* List */}
        <button
          onClick={() => onNavigate('list')}
          className={cn(
            "flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-colors touch-manipulation relative",
            activeItem === 'list'
              ? "text-primary"
              : "text-muted-foreground"
          )}
        >
          <div className="relative">
            <FileText className="w-6 h-6" />
            {pendingCount > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground text-xs font-bold rounded-full flex items-center justify-center">
                {pendingCount > 9 ? '9+' : pendingCount}
              </span>
            )}
          </div>
          <span className="text-xs font-medium">Mis Quejas</span>
        </button>
      </div>
    </nav>
  );
};

export default MobileBottomNav;
