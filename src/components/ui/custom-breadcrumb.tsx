import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ComponentType<any>;
}

interface CustomBreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function CustomBreadcrumb({ items, className }: CustomBreadcrumbProps) {
  const navigate = useNavigate();

  return (
    <nav className={cn("flex items-center space-x-2", className)}>
      {/* Always show home first */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/dashboard')}
        className="h-8 px-2 text-muted-foreground hover:text-foreground"
      >
        <Home className="h-3 w-3" />
      </Button>
      
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight className="h-3 w-3 text-muted-foreground" />
          
          {item.href ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(item.href!)}
              className="h-8 px-2 text-muted-foreground hover:text-foreground hover:underline"
            >
              <div className="flex items-center space-x-1">
                {item.icon && <item.icon className="h-3 w-3" />}
                <span className="text-xs font-medium">{item.label}</span>
              </div>
            </Button>
          ) : (
            <div className="flex items-center space-x-1 px-2">
              {item.icon && <item.icon className="h-3 w-3 text-foreground" />}
              <span className="text-xs font-semibold text-foreground">{item.label}</span>
            </div>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}