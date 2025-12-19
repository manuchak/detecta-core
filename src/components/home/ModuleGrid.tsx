import { Link } from 'react-router-dom';
import type { ModuleConfig } from '@/config/roleHomeConfig';

interface ModuleGridProps {
  modules: ModuleConfig[];
}

export const ModuleGrid = ({ modules }: ModuleGridProps) => {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
      {modules.map((module, index) => {
        const Icon = module.icon;
        
        return (
          <Link
            key={module.id}
            to={module.route}
            className="liquid-glass-app animate-apple-slide-in"
            style={{ 
              animationDelay: `${(index + 3) * 50}ms`,
            }}
          >
            <div 
              className="p-2 rounded-xl"
              style={{ 
                backgroundColor: `${module.color}15`,
              }}
            >
              <Icon 
                className="h-6 w-6" 
                style={{ color: module.color }}
              />
            </div>
            <span className="text-xs font-medium text-foreground text-center leading-tight">
              {module.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
};
