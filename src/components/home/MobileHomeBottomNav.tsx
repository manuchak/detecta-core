import { useNavigate, useLocation } from 'react-router-dom';
import { Home, BarChart3, Calendar, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { id: 'home', icon: Home, label: 'Inicio', route: '/' },
  { id: 'dashboard', icon: BarChart3, label: 'Dashboard', route: '/executive-dashboard' },
  { id: 'services', icon: Calendar, label: 'Servicios', route: '/planeacion' },
  { id: 'more', icon: MoreHorizontal, label: 'Más', route: '/settings' },
];

export const MobileHomeBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="liquid-glass-bottom-nav">
      <div className="flex items-center justify-around px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.route || 
            (item.id === 'home' && location.pathname === '/');
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => navigate(item.route)}
              className={cn(
                'flex flex-col items-center gap-0.5 py-2 px-5 rounded-xl transition-all duration-200 touch-manipulation min-w-[56px]',
                isActive
                  ? 'text-foreground'
                  : 'text-muted-foreground/60'
              )}
            >
              <Icon className={cn(
                'w-[22px] h-[22px] transition-transform duration-200',
                isActive && 'scale-110'
              )} />
              <span className={cn(
                'text-[10px] font-medium',
                isActive && 'font-semibold'
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
