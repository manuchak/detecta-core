import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Command, 
  CommandDialog, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem, 
  CommandList,
  CommandSeparator 
} from '@/components/ui/command';
import { navigationModules } from '@/config/navigationConfig';
import { useAuth } from '@/contexts/AuthContext';
import { Search, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CommandMenuProps {
  className?: string;
}

export function CommandMenu({ className }: CommandMenuProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { userRole } = useAuth();

  // Keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const handleSelect = useCallback((path: string) => {
    setOpen(false);
    navigate(path);
  }, [navigate]);

  // Filter modules by role
  const accessibleModules = navigationModules.filter(module => {
    if (!module.roles) return true;
    return module.roles.includes(userRole || '');
  });

  return (
    <>
      {/* Trigger Button */}
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className={cn(
          "relative h-9 w-full justify-start rounded-lg",
          "bg-background/50 backdrop-blur-sm border-border/50",
          "text-muted-foreground hover:text-foreground",
          "transition-all duration-200",
          "md:w-64 lg:w-80",
          className
        )}
      >
        <Search className="mr-2 h-4 w-4" />
        <span className="hidden md:inline-flex text-sm">Buscar módulos...</span>
        <span className="md:hidden text-sm">Buscar...</span>
        <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      {/* Command Dialog */}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Buscar módulos, acciones, candidatos..." />
        <CommandList>
          <CommandEmpty>No se encontraron resultados.</CommandEmpty>
          
          {/* Navigation */}
          <CommandGroup heading="Navegación">
            {accessibleModules.map((module) => {
              const Icon = module.icon;
              return (
                <CommandItem
                  key={module.id}
                  value={module.label}
                  onSelect={() => handleSelect(module.path)}
                  className="flex items-center gap-3 py-3 cursor-pointer"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium">{module.label}</span>
                    {module.children && (
                      <span className="text-xs text-muted-foreground">
                        {module.children.length} submódulos
                      </span>
                    )}
                  </div>
                  <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
                </CommandItem>
              );
            })}
          </CommandGroup>

          <CommandSeparator />

          {/* Quick Actions */}
          <CommandGroup heading="Acciones Rápidas">
            <CommandItem
              value="Crear nuevo servicio"
              onSelect={() => handleSelect('/planeacion/nuevo-servicio')}
              className="py-2"
            >
              <span>🚚 Crear nuevo servicio</span>
            </CommandItem>
            <CommandItem
              value="Nuevo candidato"
              onSelect={() => handleSelect('/leads?action=new')}
              className="py-2"
            >
              <span>➕ Nuevo candidato</span>
            </CommandItem>
            <CommandItem
              value="Ver servicios hoy"
              onSelect={() => handleSelect('/planeacion')}
              className="py-2"
            >
              <span>📅 Ver servicios de hoy</span>
            </CommandItem>
            <CommandItem
              value="Tickets abiertos"
              onSelect={() => handleSelect('/tickets?status=abierto')}
              className="py-2"
            >
              <span>🎫 Ver tickets abiertos</span>
            </CommandItem>
            <CommandItem
              value="Dashboard"
              onSelect={() => handleSelect('/dashboard')}
              className="py-2"
            >
              <span>📊 Dashboard ejecutivo</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
