import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Calendar, Star, Plus, Trash2, Save } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

export interface QuickFilterPreset {
  id: string;
  name: string;
  filters: {
    days?: number;
    dateFrom?: string;
    dateTo?: string;
    source?: string;
    status?: string;
    assignment?: string;
  };
  isDefault?: boolean;
}

interface QuickFiltersProps {
  onApplyFilter: (preset: QuickFilterPreset) => void;
  activePreset?: string;
}

// Filtros predefinidos del sistema
const defaultPresets: QuickFilterPreset[] = [
  {
    id: "yesterday",
    name: "Ayer",
    filters: { days: 1 },
    isDefault: true
  },
  {
    id: "last-3-days",
    name: "Últimos 3 días",
    filters: { days: 3 },
    isDefault: true
  },
  {
    id: "this-week",
    name: "Esta semana",
    filters: { days: 7 },
    isDefault: true
  },
  {
    id: "this-month",
    name: "Este mes",
    filters: { days: 30 },
    isDefault: true
  },
  {
    id: "unassigned-recent",
    name: "Sin asignar (2 días)",
    filters: { days: 2, assignment: "unassigned" },
    isDefault: true
  },
  {
    id: "unassigned-urgent",
    name: "Sin asignar (urgente)",
    filters: { days: 1, assignment: "unassigned" },
    isDefault: true
  },
];

export const QuickFilters = ({ onApplyFilter, activePreset }: QuickFiltersProps) => {
  const [customPresets, setCustomPresets] = useState<QuickFilterPreset[]>(() => {
    const saved = localStorage.getItem('leads-custom-presets');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPresetName, setNewPresetName] = useState("");
  const [newPresetFilters, setNewPresetFilters] = useState({
    days: "",
    source: "all",
    assignment: "all"
  });
  
  const { toast } = useToast();

  const handleApplyPreset = (preset: QuickFilterPreset) => {
    onApplyFilter(preset);
    toast({
      title: "Filtro aplicado",
      description: preset.name,
    });
  };

  const handleCreateCustomPreset = () => {
    if (!newPresetName.trim()) {
      toast({
        title: "Error",
        description: "El nombre del filtro es requerido",
        variant: "destructive",
      });
      return;
    }

    const newPreset: QuickFilterPreset = {
      id: `custom-${Date.now()}`,
      name: newPresetName.trim(),
      filters: {
        ...(newPresetFilters.days ? { days: parseInt(newPresetFilters.days) } : {}),
        ...(newPresetFilters.source !== "all" ? { source: newPresetFilters.source } : {}),
        ...(newPresetFilters.assignment !== "all" ? { assignment: newPresetFilters.assignment } : {})
      }
    };

    const updatedPresets = [...customPresets, newPreset];
    setCustomPresets(updatedPresets);
    localStorage.setItem('leads-custom-presets', JSON.stringify(updatedPresets));
    
    setShowCreateForm(false);
    setNewPresetName("");
    setNewPresetFilters({ days: "", source: "all", assignment: "all" });
    
    toast({
      title: "Filtro guardado",
      description: newPreset.name,
    });
  };

  const handleDeleteCustomPreset = (presetId: string) => {
    const updatedPresets = customPresets.filter(p => p.id !== presetId);
    setCustomPresets(updatedPresets);
    localStorage.setItem('leads-custom-presets', JSON.stringify(updatedPresets));
    
    toast({
      title: "Filtro eliminado",
    });
  };

  return (
    <div className="space-y-6">
      {/* Filtros del Sistema */}
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
          Filtros Rápidos
        </p>
        <div className="flex flex-wrap gap-2">
          {defaultPresets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleApplyPreset(preset)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all",
                "bg-background/60 border border-border/30",
                "hover:bg-background/80 hover:border-border/50",
                activePreset === preset.id && "bg-primary/10 border-primary/30 text-primary"
              )}
            >
              <Calendar className="h-3 w-3" />
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Filtros Personalizados */}
      {customPresets.length > 0 && (
        <>
          <Separator />
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
              Mis Filtros
            </p>
            <div className="flex flex-wrap gap-2">
              {customPresets.map((preset) => (
                <div key={preset.id} className="flex items-center gap-1">
                  <button
                    onClick={() => handleApplyPreset(preset)}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all",
                      "bg-background/60 border border-border/30",
                      "hover:bg-background/80 hover:border-border/50",
                      activePreset === preset.id && "bg-primary/10 border-primary/30 text-primary"
                    )}
                  >
                    <Star className="h-3 w-3" />
                    {preset.name}
                  </button>
                  <button
                    onClick={() => handleDeleteCustomPreset(preset.id)}
                    className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <Separator />

      {/* Crear Filtro Personalizado */}
      {!showCreateForm ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowCreateForm(true)}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Crear Filtro Personalizado
        </Button>
      ) : (
        <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
          <div className="space-y-2">
            <Label htmlFor="preset-name" className="text-xs">Nombre</Label>
            <Input
              id="preset-name"
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
              placeholder="Ej: Leads urgentes"
              className="h-8 text-sm"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="preset-days" className="text-xs">Últimos días</Label>
            <Input
              id="preset-days"
              type="number"
              value={newPresetFilters.days}
              onChange={(e) => setNewPresetFilters(prev => ({ ...prev, days: e.target.value }))}
              placeholder="Ej: 7"
              min="1"
              max="365"
              className="h-8 text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Fuente</Label>
            <Select
              value={newPresetFilters.source}
              onValueChange={(value) => setNewPresetFilters(prev => ({ ...prev, source: value }))}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="web">Web</SelectItem>
                <SelectItem value="referido">Referido</SelectItem>
                <SelectItem value="telefono">Teléfono</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Asignación</Label>
            <Select
              value={newPresetFilters.assignment}
              onValueChange={(value) => setNewPresetFilters(prev => ({ ...prev, assignment: value }))}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="unassigned">Sin asignar</SelectItem>
                <SelectItem value="assigned">Asignados</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={handleCreateCustomPreset} size="sm" className="flex-1">
              <Save className="h-3.5 w-3.5 mr-1.5" />
              Guardar
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowCreateForm(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};