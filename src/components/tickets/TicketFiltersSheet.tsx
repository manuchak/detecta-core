import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, X, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface Filters {
  search: string;
  status: string;
  priority: string;
  sla: string;
}

interface TicketFiltersSheetProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  activeFiltersCount: number;
}

export const TicketFiltersSheet = ({
  filters,
  onFiltersChange,
  activeFiltersCount
}: TicketFiltersSheetProps) => {
  const [open, setOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters);

  const handleApply = () => {
    onFiltersChange(localFilters);
    setOpen(false);
  };

  const handleClear = () => {
    const cleared = {
      search: '',
      status: 'todos',
      priority: 'todas',
      sla: 'todos'
    };
    setLocalFilters(cleared);
    onFiltersChange(cleared);
  };

  const updateFilter = (key: keyof Filters, value: string) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 relative">
          <Filter className="h-4 w-4" />
          <span className="hidden sm:inline">Filtros</span>
          {activeFiltersCount > 0 && (
            <Badge 
              variant="secondary" 
              className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs bg-primary text-primary-foreground"
            >
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center justify-between">
            Filtrar Tickets
            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" onClick={handleClear} className="text-muted-foreground">
                <X className="h-4 w-4 mr-1" />
                Limpiar
              </Button>
            )}
          </SheetTitle>
          <SheetDescription>
            Aplica filtros para encontrar tickets específicos
          </SheetDescription>
        </SheetHeader>

        <div className="py-6 space-y-6">
          {/* Search */}
          <div className="space-y-2">
            <Label>Buscar</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por #ticket, asunto..."
                value={localFilters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* SLA Status */}
          <div className="space-y-2">
            <Label>Estado SLA</Label>
            <Select value={localFilters.sla} onValueChange={(v) => updateFilter('sla', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="vencidos">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-red-500" />
                    Vencidos
                  </span>
                </SelectItem>
                <SelectItem value="proximos">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-yellow-500" />
                    Próximos a vencer
                  </span>
                </SelectItem>
                <SelectItem value="en_tiempo">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                    En tiempo
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Estado del Ticket</Label>
            <Select value={localFilters.status} onValueChange={(v) => updateFilter('status', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="abierto">Abierto</SelectItem>
                <SelectItem value="en_progreso">En progreso</SelectItem>
                <SelectItem value="resuelto">Resuelto</SelectItem>
                <SelectItem value="cerrado">Cerrado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label>Prioridad</Label>
            <Select value={localFilters.priority} onValueChange={(v) => updateFilter('priority', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                <SelectItem value="baja">Baja</SelectItem>
                <SelectItem value="media">Media</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="urgente">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <SheetFooter className="flex-row gap-3">
          <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button className="flex-1" onClick={handleApply}>
            Aplicar Filtros
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default TicketFiltersSheet;
