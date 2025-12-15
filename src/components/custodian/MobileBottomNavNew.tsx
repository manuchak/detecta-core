import { Home, ClipboardList, Car, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type NavItem = 'home' | 'services' | 'vehicle' | 'support';

interface MobileBottomNavNewProps {
  activeItem: NavItem;
  onNavigate: (item: NavItem) => void;
  pendingCount?: number;
}

const navItems = [
  { id: 'home' as NavItem, icon: Home, label: 'Inicio' },
  { id: 'services' as NavItem, icon: ClipboardList, label: 'Servicios' },
  { id: 'vehicle' as NavItem, icon: Car, label: 'Vehículo' },
  { id: 'support' as NavItem, icon: MessageCircle, label: 'Soporte' },
];

const MobileBottomNavNew = ({
  activeItem,
  onNavigate,
  pendingCount = 0
}: MobileBottomNavNewProps) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border safe-area-inset-bottom z-50">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive = activeItem === item.id;
          const Icon = item.icon;
          const showBadge = item.id === 'support' && pendingCount > 0;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                "flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-all touch-manipulation min-w-[64px]",
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative">
                <Icon className={cn(
                  "w-6 h-6 transition-transform",
                  isActive && "scale-110"
                )} />
                {showBadge && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                    {pendingCount > 9 ? '9+' : pendingCount}
                  </span>
                )}
              </div>
              <span className={cn(
                "text-[10px] font-medium",
                isActive && "font-semibold"
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNavNew;
