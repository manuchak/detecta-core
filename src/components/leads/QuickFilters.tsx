import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Calendar, Star, Plus, Trash2, Save } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

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
    name: "Sin asignar (últimos 2 días)",
    filters: { days: 2, assignment: "unassigned" },
    isDefault: true
  },
  {
    id: "unassigned-urgent",
    name: "Sin asignar (urgente - 24h)",
    filters: { days: 1, assignment: "unassigned" },
    isDefault: true
  },
  {
    id: "web-leads-week",
    name: "Web - Esta semana",
    filters: { days: 7, source: "web" },
    isDefault: true
  },
  {
    id: "referidos-week",
    name: "Referidos - Esta semana",
    filters: { days: 7, source: "referido" },
    isDefault: true
  }
];

export const QuickFilters = ({ onApplyFilter, activePreset }: QuickFiltersProps) => {
  const [customPresets, setCustomPresets] = useState<QuickFilterPreset[]>(() => {
    // Cargar presets personalizados del localStorage
    const saved = localStorage.getItem('leads-custom-presets');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newPresetName, setNewPresetName] = useState("");
  const [newPresetFilters, setNewPresetFilters] = useState({
    days: "",
    source: "all",
    assignment: "all"
  });
  
  const { toast } = useToast();

  // Combinar presets predefinidos y personalizados
  const allPresets = [...defaultPresets, ...customPresets];

  const handleApplyPreset = (preset: QuickFilterPreset) => {
    onApplyFilter(preset);
    toast({
      title: "Filtro aplicado",
      description: `Se aplicó el filtro: ${preset.name}`,
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
    
    setShowCreateDialog(false);
    setNewPresetName("");
    setNewPresetFilters({ days: "", source: "all", assignment: "all" });
    
    toast({
      title: "Filtro guardado",
      description: `El filtro "${newPreset.name}" se guardó correctamente`,
    });
  };

  const handleDeleteCustomPreset = (presetId: string) => {
    const updatedPresets = customPresets.filter(p => p.id !== presetId);
    setCustomPresets(updatedPresets);
    localStorage.setItem('leads-custom-presets', JSON.stringify(updatedPresets));
    
    toast({
      title: "Filtro eliminado",
      description: "El filtro personalizado se eliminó correctamente",
    });
  };

  const getPresetDescription = (preset: QuickFilterPreset) => {
    const parts = [];
    if (preset.filters.days) {
      parts.push(`${preset.filters.days} días`);
    }
    if (preset.filters.source) {
      parts.push(`fuente: ${preset.filters.source}`);
    }
    if (preset.filters.assignment === "unassigned") {
      parts.push("sin asignar");
    }
    return parts.join(", ");
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <CardTitle className="text-sm font-medium">Filtros Rápidos</CardTitle>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Crear Filtro
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Crear Filtro Personalizado</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="preset-name">Nombre del filtro</Label>
                  <Input
                    id="preset-name"
                    value={newPresetName}
                    onChange={(e) => setNewPresetName(e.target.value)}
                    placeholder="Ej: Leads urgentes, Web últimos 5 días..."
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="preset-days">Últimos días</Label>
                  <Input
                    id="preset-days"
                    type="number"
                    value={newPresetFilters.days}
                    onChange={(e) => setNewPresetFilters(prev => ({ ...prev, days: e.target.value }))}
                    placeholder="Ej: 1, 3, 7, 14..."
                    min="1"
                    max="365"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="preset-source">Fuente</Label>
                  <Select
                    value={newPresetFilters.source}
                    onValueChange={(value) => setNewPresetFilters(prev => ({ ...prev, source: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las fuentes</SelectItem>
                      <SelectItem value="web">Web</SelectItem>
                      <SelectItem value="referido">Referido</SelectItem>
                      <SelectItem value="telefono">Teléfono</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="redes_sociales">Redes Sociales</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="preset-assignment">Asignación</Label>
                  <Select
                    value={newPresetFilters.assignment}
                    onValueChange={(value) => setNewPresetFilters(prev => ({ ...prev, assignment: value }))}
                  >
                    <SelectTrigger>
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
                  <Button onClick={handleCreateCustomPreset} className="flex-1">
                    <Save className="h-4 w-4 mr-2" />
                    Guardar Filtro
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Filtros predefinidos */}
          <div>
            <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">Filtros del Sistema</p>
            <div className="flex flex-wrap gap-2">
              {defaultPresets.map((preset) => (
                <Button
                  key={preset.id}
                  variant={activePreset === preset.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleApplyPreset(preset)}
                  className="h-8"
                >
                  <Calendar className="h-3 w-3 mr-2" />
                  {preset.name}
                  {activePreset === preset.id && (
                    <Badge variant="secondary" className="ml-2 h-4 text-xs">
                      Activo
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          </div>

          {/* Filtros personalizados */}
          {customPresets.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">Mis Filtros Personalizados</p>
              <div className="flex flex-wrap gap-2">
                {customPresets.map((preset) => (
                  <div key={preset.id} className="flex items-center gap-1">
                    <Button
                      variant={activePreset === preset.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleApplyPreset(preset)}
                      className="h-8"
                    >
                      <Star className="h-3 w-3 mr-2" />
                      {preset.name}
                      {activePreset === preset.id && (
                        <Badge variant="secondary" className="ml-2 h-4 text-xs">
                          Activo
                        </Badge>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteCustomPreset(preset.id)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Información del filtro activo */}
          {activePreset && (
            <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
              <strong>Filtro activo:</strong> {allPresets.find(p => p.id === activePreset)?.name}
              {(() => {
                const preset = allPresets.find(p => p.id === activePreset);
                const description = preset ? getPresetDescription(preset) : "";
                return description ? ` (${description})` : "";
              })()}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};