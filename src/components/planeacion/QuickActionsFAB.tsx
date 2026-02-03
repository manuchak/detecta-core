import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Zap, Users, List, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickActionsFABProps {
  pendingCount: number;
  onAssignUrgent: () => void;
  onViewAll: () => void;
  onCreateNew: () => void;
}

export function QuickActionsFAB({
  pendingCount,
  onAssignUrgent,
  onViewAll,
  onCreateNew
}: QuickActionsFABProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  if (pendingCount === 0) return null;
  
  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Backdrop para cerrar */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* Menu Items */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 flex flex-col gap-2 items-end z-50">
          <Button
            size="sm"
            variant="secondary"
            className="fab-menu-item shadow-lg whitespace-nowrap"
            style={{ animationDelay: '0ms' }}
            onClick={() => { onAssignUrgent(); setIsOpen(false); }}
          >
            <Users className="h-4 w-4 mr-2" />
            Asignar urgente
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="fab-menu-item shadow-lg whitespace-nowrap"
            style={{ animationDelay: '50ms' }}
            onClick={() => { onViewAll(); setIsOpen(false); }}
          >
            <List className="h-4 w-4 mr-2" />
            Ver todos
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="fab-menu-item shadow-lg whitespace-nowrap"
            style={{ animationDelay: '100ms' }}
            onClick={() => { onCreateNew(); setIsOpen(false); }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Crear servicio
          </Button>
        </div>
      )}
      
      {/* Main FAB */}
      <Button
        size="lg"
        className={cn(
          "h-14 w-14 rounded-full shadow-lg relative z-50",
          "bg-destructive hover:bg-destructive/90",
          "transition-all duration-200 hover:scale-105"
        )}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Cerrar menú de acciones' : `${pendingCount} servicios pendientes - abrir menú`}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Zap className="h-6 w-6" />
        )}
        {!isOpen && pendingCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-background text-destructive text-xs font-bold flex items-center justify-center border-2 border-destructive">
            {pendingCount > 9 ? '9+' : pendingCount}
          </span>
        )}
      </Button>
    </div>
  );
}
