import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Check, BookOpen } from "lucide-react";
import { ModuloInlineEditor } from "./ModuloInlineEditor";
import { useLMSCrearModulo } from "@/hooks/lms/useLMSAdminModulos";
import type { LMSModulo, LMSContenido } from "@/types/lms";

interface TabEstructuraProps {
  cursoId: string;
  modulos: (LMSModulo & { contenidos: LMSContenido[] })[];
}

export function TabEstructura({ cursoId, modulos }: TabEstructuraProps) {
  const [showAddModulo, setShowAddModulo] = useState(false);
  const [newModuloTitle, setNewModuloTitle] = useState('');
  const crearModulo = useLMSCrearModulo();

  const modulosActivos = modulos.filter(m => m.activo);

  const handleAddModulo = () => {
    if (!newModuloTitle.trim()) return;
    crearModulo.mutate({
      cursoId,
      data: { titulo: newModuloTitle, orden: modulosActivos.length + 1 },
    }, {
      onSuccess: () => {
        setNewModuloTitle('');
        setShowAddModulo(false);
      },
    });
  };

  return (
    <div className="space-y-3 py-4">
      {modulosActivos.length === 0 && !showAddModulo && (
        <div className="text-center py-12 space-y-3">
          <BookOpen className="w-10 h-10 mx-auto text-muted-foreground/50" />
          <div>
            <p className="text-sm font-medium text-muted-foreground">Sin módulos</p>
            <p className="text-xs text-muted-foreground/70">Agrega el primer módulo para estructurar el curso</p>
          </div>
          <Button size="sm" onClick={() => setShowAddModulo(true)}>
            <Plus className="w-4 h-4 mr-1" /> Agregar módulo
          </Button>
        </div>
      )}

      {modulosActivos.map(modulo => (
        <ModuloInlineEditor
          key={modulo.id}
          modulo={modulo}
          cursoId={cursoId}
        />
      ))}

      {/* Add module inline */}
      {showAddModulo ? (
        <div className="p-3 rounded-lg border border-dashed space-y-2">
          <Input
            placeholder="Título del módulo"
            value={newModuloTitle}
            onChange={e => setNewModuloTitle(e.target.value)}
            autoFocus
            onKeyDown={e => { if (e.key === 'Enter') handleAddModulo(); if (e.key === 'Escape') setShowAddModulo(false); }}
          />
          <div className="flex gap-1">
            <Button size="sm" onClick={handleAddModulo} disabled={!newModuloTitle.trim() || crearModulo.isPending}>
              <Check className="w-3.5 h-3.5 mr-1" /> Crear módulo
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setShowAddModulo(false); setNewModuloTitle(''); }}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : modulosActivos.length > 0 ? (
        <Button
          variant="outline"
          size="sm"
          className="w-full border-dashed"
          onClick={() => setShowAddModulo(true)}
        >
          <Plus className="w-4 h-4 mr-1" /> Agregar módulo
        </Button>
      ) : null}
    </div>
  );
}
