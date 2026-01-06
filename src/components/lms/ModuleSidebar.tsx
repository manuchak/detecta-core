import { CheckCircle2, Circle, Play, FileText, Code, HelpCircle, Sparkles, ChevronDown, ChevronRight, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import type { LMSModulo, LMSContenido, LMSProgreso, TipoContenido } from "@/types/lms";
import { useState } from "react";

interface ModuleSidebarProps {
  modulos: (LMSModulo & { contenidos: LMSContenido[] })[];
  progresos: LMSProgreso[];
  contenidoActualId?: string;
  onSelectContenido: (contenidoId: string) => void;
  progresoGeneral: number;
}

const iconosContenido: Record<TipoContenido, React.ReactNode> = {
  video: <Play className="h-4 w-4" />,
  documento: <FileText className="h-4 w-4" />,
  embed: <Code className="h-4 w-4" />,
  texto_enriquecido: <FileText className="h-4 w-4" />,
  quiz: <HelpCircle className="h-4 w-4" />,
  interactivo: <Sparkles className="h-4 w-4" />,
};

export function ModuleSidebar({ 
  modulos, 
  progresos, 
  contenidoActualId, 
  onSelectContenido,
  progresoGeneral 
}: ModuleSidebarProps) {
  // Determinar qué módulo abrir inicialmente
  const moduloConContenidoActual = modulos.findIndex(m => 
    m.contenidos.some(c => c.id === contenidoActualId)
  );
  
  const [openModules, setOpenModules] = useState<string[]>(
    moduloConContenidoActual >= 0 ? [modulos[moduloConContenidoActual].id] : 
    modulos.length > 0 ? [modulos[0].id] : []
  );

  const toggleModule = (moduloId: string) => {
    setOpenModules(prev => 
      prev.includes(moduloId) 
        ? prev.filter(id => id !== moduloId)
        : [...prev, moduloId]
    );
  };

  const isContenidoCompletado = (contenidoId: string) => {
    return progresos.some(p => p.contenido_id === contenidoId && p.completado);
  };

  const getModuloProgreso = (modulo: LMSModulo & { contenidos: LMSContenido[] }) => {
    const total = modulo.contenidos.filter(c => c.es_obligatorio).length;
    if (total === 0) return 100;
    const completados = modulo.contenidos.filter(
      c => c.es_obligatorio && isContenidoCompletado(c.id)
    ).length;
    return Math.round((completados / total) * 100);
  };

  return (
    <div className="h-full flex flex-col bg-card border-r border-border">
      {/* Header con progreso general */}
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-sm text-foreground mb-2">Contenido del curso</h3>
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progreso general</span>
            <span className="font-medium">{Math.round(progresoGeneral)}%</span>
          </div>
          <Progress value={progresoGeneral} className="h-2" />
        </div>
      </div>

      {/* Lista de módulos */}
      <div className="flex-1 overflow-y-auto">
        {modulos.map((modulo, moduloIndex) => {
          const moduloProgreso = getModuloProgreso(modulo);
          const isOpen = openModules.includes(modulo.id);
          const isCompleto = moduloProgreso === 100;

          return (
            <Collapsible
              key={modulo.id}
              open={isOpen}
              onOpenChange={() => toggleModule(modulo.id)}
            >
              <CollapsibleTrigger className="w-full">
                <div className={cn(
                  "flex items-center gap-3 p-3 hover:bg-accent/50 transition-colors",
                  "border-b border-border/50"
                )}>
                  <div className={cn(
                    "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
                    isCompleto 
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                      : "bg-muted text-muted-foreground"
                  )}>
                    {isCompleto ? <CheckCircle2 className="h-4 w-4" /> : moduloIndex + 1}
                  </div>
                  
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-medium text-foreground truncate">
                      {modulo.titulo}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {modulo.contenidos.length} elementos · {moduloProgreso}%
                    </p>
                  </div>

                  {isOpen ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <div className="bg-accent/20">
                  {modulo.contenidos.map((contenido) => {
                    const completado = isContenidoCompletado(contenido.id);
                    const isActive = contenido.id === contenidoActualId;

                    return (
                      <button
                        key={contenido.id}
                        onClick={() => onSelectContenido(contenido.id)}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 pl-6 transition-colors text-left",
                          "hover:bg-accent/50",
                          isActive && "bg-primary/10 border-l-2 border-primary"
                        )}
                      >
                        {/* Icono de estado */}
                        <div className={cn(
                          "flex-shrink-0",
                          completado ? "text-green-600" : "text-muted-foreground"
                        )}>
                          {completado ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <Circle className="h-4 w-4" />
                          )}
                        </div>

                        {/* Icono de tipo */}
                        <div className="flex-shrink-0 text-muted-foreground">
                          {iconosContenido[contenido.tipo]}
                        </div>

                        {/* Título */}
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "text-sm truncate",
                            isActive ? "text-primary font-medium" : "text-foreground"
                          )}>
                            {contenido.titulo}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {contenido.duracion_min > 0 && `${contenido.duracion_min} min`}
                            {!contenido.es_obligatorio && " · Opcional"}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
}
