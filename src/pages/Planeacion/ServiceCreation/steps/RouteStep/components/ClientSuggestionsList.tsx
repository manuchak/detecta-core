import { Building2, Route, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ClienteUnificado } from '@/hooks/useClientesFromPricing';

interface ClientSuggestionsListProps {
  suggestions: ClienteUnificado[];
  searchTerm: string;
  onSelect: (cliente: ClienteUnificado) => void;
  isLoading?: boolean;
}

export function ClientSuggestionsList({
  suggestions,
  searchTerm,
  onSelect,
  isLoading,
}: ClientSuggestionsListProps) {
  if (isLoading) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <div className="animate-pulse">Buscando clientes...</div>
      </div>
    );
  }

  if (searchTerm.length < 2) {
    return (
      <div className="p-4 text-center text-muted-foreground text-sm">
        Escribe al menos 2 caracteres para buscar
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null; // NewClientBanner will show instead
  }

  return (
    <div className="divide-y divide-border">
      {suggestions.map((cliente) => (
        <button
          key={cliente.nombre}
          type="button"
          onClick={() => onSelect(cliente)}
          className={cn(
            "w-full px-4 py-3 flex items-center gap-3 text-left",
            "hover:bg-accent/50 transition-colors duration-150",
            "focus:outline-none focus:bg-accent"
          )}
        >
          <div
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
              cliente.tiene_rutas
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground"
            )}
          >
            <Building2 className="w-5 h-5" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="font-medium text-foreground truncate">
              {highlightMatch(cliente.nombre, searchTerm)}
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
              {cliente.tiene_rutas ? (
                <>
                  <Route className="w-3 h-3" />
                  <span>{cliente.rutas_count} rutas configuradas</span>
                </>
              ) : (
                <span>Sin rutas configuradas</span>
              )}
            </div>
          </div>

          {cliente.origen === 'ambos' && (
            <div className="flex-shrink-0">
              <Sparkles className="w-4 h-4 text-amber-500" />
            </div>
          )}
        </button>
      ))}
    </div>
  );
}

function highlightMatch(text: string, searchTerm: string): React.ReactNode {
  if (!searchTerm) return text;
  
  const lowerText = text.toLowerCase();
  const lowerSearch = searchTerm.toLowerCase();
  const index = lowerText.indexOf(lowerSearch);
  
  if (index === -1) return text;
  
  return (
    <>
      {text.slice(0, index)}
      <span className="bg-yellow-200 dark:bg-yellow-900/50 rounded px-0.5">
        {text.slice(index, index + searchTerm.length)}
      </span>
      {text.slice(index + searchTerm.length)}
    </>
  );
}
