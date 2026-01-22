import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X } from "lucide-react";

interface LeadsInlineFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  dateFilter: string;
  onDateFilterChange: (value: string) => void;
  sourceFilter: string;
  onSourceFilterChange: (value: string) => void;
  onClearFilters: () => void;
}

export const LeadsInlineFilters = ({
  searchTerm,
  onSearchChange,
  dateFilter,
  onDateFilterChange,
  sourceFilter,
  onSourceFilterChange,
  onClearFilters
}: LeadsInlineFiltersProps) => {
  const [localSearch, setLocalSearch] = useState(searchTerm);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(localSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch, onSearchChange]);

  const hasActiveFilters = searchTerm || dateFilter !== 'all' || sourceFilter !== 'all';

  return (
    <div className="flex flex-wrap items-center gap-2 py-2">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Buscar por nombre, teléfono..." 
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          className="pl-9 h-8 bg-background/60 backdrop-blur-sm border-border/50"
        />
      </div>
      
      {/* Date Filter */}
      <Select value={dateFilter} onValueChange={onDateFilterChange}>
        <SelectTrigger className="w-[130px] h-8 bg-background/60 backdrop-blur-sm border-border/50">
          <SelectValue placeholder="Fecha" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas</SelectItem>
          <SelectItem value="today">Hoy</SelectItem>
          <SelectItem value="yesterday">Ayer</SelectItem>
          <SelectItem value="week">Esta semana</SelectItem>
          <SelectItem value="month">Este mes</SelectItem>
        </SelectContent>
      </Select>
      
      {/* Source Filter */}
      <Select value={sourceFilter} onValueChange={onSourceFilterChange}>
        <SelectTrigger className="w-[140px] h-8 bg-background/60 backdrop-blur-sm border-border/50">
          <SelectValue placeholder="Fuente" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas</SelectItem>
          <SelectItem value="indeed">Indeed</SelectItem>
          <SelectItem value="computrabajo">Computrabajo</SelectItem>
          <SelectItem value="occ">OCC Mundial</SelectItem>
          <SelectItem value="linkedin">LinkedIn</SelectItem>
          <SelectItem value="facebook">Facebook</SelectItem>
          <SelectItem value="whatsapp">WhatsApp</SelectItem>
          <SelectItem value="referido">Referido</SelectItem>
          <SelectItem value="telefono">Llamada</SelectItem>
          <SelectItem value="presencial">Presencial</SelectItem>
          <SelectItem value="otro">Otro</SelectItem>
        </SelectContent>
      </Select>
      
      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => {
            setLocalSearch('');
            onClearFilters();
          }}
          className="h-8 px-2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-3.5 w-3.5 mr-1" />
          Limpiar
        </Button>
      )}
    </div>
  );
};
