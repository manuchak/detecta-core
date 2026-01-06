import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Play, FileText, AlignLeft, HelpCircle, Sparkles, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ContentOutline } from "./StepEstructura";

const CONTENT_TYPES = [
  { tipo: 'video' as const, label: 'Video', icon: Play, color: 'text-red-500 bg-red-50 hover:bg-red-100' },
  { tipo: 'documento' as const, label: 'Documento', icon: FileText, color: 'text-blue-500 bg-blue-50 hover:bg-blue-100' },
  { tipo: 'texto_enriquecido' as const, label: 'Texto', icon: AlignLeft, color: 'text-green-500 bg-green-50 hover:bg-green-100' },
  { tipo: 'quiz' as const, label: 'Quiz', icon: HelpCircle, color: 'text-purple-500 bg-purple-50 hover:bg-purple-100' },
  { tipo: 'interactivo' as const, label: 'Interactivo', icon: Sparkles, color: 'text-orange-500 bg-orange-50 hover:bg-orange-100' },
];

interface QuickContentCreatorProps {
  moduloTitulo?: string;
  cursoTitulo?: string;
  onAdd: (content: ContentOutline) => void;
  onCancel: () => void;
}

export function QuickContentCreator({ moduloTitulo, cursoTitulo, onAdd, onCancel }: QuickContentCreatorProps) {
  const [selectedType, setSelectedType] = useState<ContentOutline['tipo'] | null>(null);
  const [titulo, setTitulo] = useState("");
  const [duracion, setDuracion] = useState(10);

  const handleCreate = () => {
    if (!selectedType || !titulo.trim()) return;

    const content: ContentOutline = {
      id: crypto.randomUUID(),
      titulo: titulo.trim(),
      tipo: selectedType,
      duracion_min: duracion,
      orden: 0, // Will be set by parent
    };

    onAdd(content);
    // Reset for next
    setSelectedType(null);
    setTitulo("");
    setDuracion(10);
  };

  if (!selectedType) {
    return (
      <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
        <span className="text-xs text-muted-foreground shrink-0">Tipo:</span>
        <div className="flex gap-1 flex-wrap">
          {CONTENT_TYPES.map(({ tipo, label, icon: Icon, color }) => (
            <button
              key={tipo}
              onClick={() => setSelectedType(tipo)}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors",
                color
              )}
            >
              <Icon className="w-3 h-3" />
              {label}
            </button>
          ))}
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto" onClick={onCancel}>
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>
    );
  }

  const TypeInfo = CONTENT_TYPES.find(t => t.tipo === selectedType);
  const TypeIcon = TypeInfo?.icon || AlignLeft;

  return (
    <div className="p-3 bg-muted/30 rounded-lg space-y-3">
      <div className="flex items-center gap-2">
        <div className={cn("p-1.5 rounded", TypeInfo?.color)}>
          <TypeIcon className="w-4 h-4" />
        </div>
        <span className="text-sm font-medium">{TypeInfo?.label}</span>
        <button 
          onClick={() => setSelectedType(null)}
          className="text-xs text-muted-foreground hover:text-foreground ml-auto"
        >
          Cambiar tipo
        </button>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Título del contenido..."
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          className="h-8 text-sm flex-1"
          autoFocus
        />
        <div className="flex items-center gap-1">
          <Input
            type="number"
            value={duracion}
            onChange={(e) => setDuracion(parseInt(e.target.value) || 0)}
            className="w-14 h-8 text-sm text-center"
            min={1}
          />
          <span className="text-xs text-muted-foreground">min</span>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancelar
        </Button>
        <Button 
          size="sm" 
          onClick={handleCreate}
          disabled={!titulo.trim()}
          className="gap-1"
        >
          <Check className="w-3.5 h-3.5" />
          Agregar
        </Button>
      </div>
    </div>
  );
}
