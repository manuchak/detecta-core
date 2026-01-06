import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Users, RefreshCw, AlertCircle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useLMSAdminCursos } from "@/hooks/lms/useLMSAdminCursos";
import { useLMSInscripcionMasiva, useLMSContarUsuariosPorRol } from "@/hooks/lms/useLMSInscripcionMasiva";
import { LMS_ROLES_OBJETIVO } from "@/types/lms";

interface InscripcionMasivaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InscripcionMasivaDialog({ open, onOpenChange }: InscripcionMasivaDialogProps) {
  const [selectedCurso, setSelectedCurso] = useState<string>("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [plazoDias, setPlazoDias] = useState<string>("");
  const [usarPlazoDefault, setUsarPlazoDefault] = useState(true);

  const { data: cursos = [] } = useLMSAdminCursos();
  const { data: conteo, isLoading: isLoadingConteo } = useLMSContarUsuariosPorRol(
    selectedCurso || undefined, 
    selectedRoles
  );
  const inscribirMasivo = useLMSInscripcionMasiva();

  const cursoSeleccionado = cursos.find(c => c.id === selectedCurso);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedCurso("");
      setSelectedRoles([]);
      setPlazoDias("");
      setUsarPlazoDefault(true);
    }
  }, [open]);

  // Pre-seleccionar roles del curso cuando se selecciona
  useEffect(() => {
    if (cursoSeleccionado?.roles_objetivo?.length) {
      setSelectedRoles(cursoSeleccionado.roles_objetivo);
    }
  }, [cursoSeleccionado]);

  const handleRoleToggle = (role: string) => {
    setSelectedRoles(prev => 
      prev.includes(role) 
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  const handleInscribir = async () => {
    if (!selectedCurso || selectedRoles.length === 0) return;
    
    await inscribirMasivo.mutateAsync({
      cursoId: selectedCurso,
      roles: selectedRoles,
      tipoInscripcion: 'asignada',
      plazoDias: usarPlazoDefault ? undefined : parseInt(plazoDias) || undefined
    });
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Inscripción Masiva
          </DialogTitle>
          <DialogDescription>
            Inscribe a todos los usuarios activos con los roles seleccionados en un curso.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Selector de curso */}
          <div className="space-y-2">
            <Label>Curso</Label>
            <Select value={selectedCurso} onValueChange={setSelectedCurso}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un curso" />
              </SelectTrigger>
              <SelectContent>
                {cursos.filter(c => c.activo && c.publicado).map(curso => (
                  <SelectItem key={curso.id} value={curso.id}>
                    <div className="flex items-center gap-2">
                      <span>{curso.titulo}</span>
                      {curso.es_obligatorio && (
                        <span className="text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-1.5 rounded">
                          Obligatorio
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Selector de roles */}
          {selectedCurso && (
            <div className="space-y-3">
              <Label>Roles a inscribir</Label>
              <div className="grid grid-cols-2 gap-2">
                {LMS_ROLES_OBJETIVO.map(rol => (
                  <label
                    key={rol.value}
                    className={`
                      flex items-center gap-3 p-3 rounded-lg border cursor-pointer
                      transition-all duration-200
                      ${selectedRoles.includes(rol.value) 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'}
                    `}
                  >
                    <Checkbox
                      checked={selectedRoles.includes(rol.value)}
                      onCheckedChange={() => handleRoleToggle(rol.value)}
                    />
                    <span className="text-sm font-medium">{rol.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Plazo personalizado */}
          {selectedCurso && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="usarPlazoDefault"
                  checked={usarPlazoDefault}
                  onCheckedChange={(checked) => setUsarPlazoDefault(checked === true)}
                />
                <Label htmlFor="usarPlazoDefault" className="text-sm cursor-pointer">
                  Usar plazo por defecto del curso ({cursoSeleccionado?.plazo_dias_default || 30} días)
                </Label>
              </div>
              
              {!usarPlazoDefault && (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Días"
                    value={plazoDias}
                    onChange={(e) => setPlazoDias(e.target.value)}
                    className="w-24"
                    min={1}
                  />
                  <span className="text-sm text-muted-foreground">días para completar</span>
                </div>
              )}
            </div>
          )}

          {/* Preview de inscripción */}
          {selectedCurso && selectedRoles.length > 0 && (
            <Alert className={conteo?.pendientes_inscribir === 0 ? 'border-yellow-500' : 'border-primary'}>
              {isLoadingConteo ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : conteo?.pendientes_inscribir === 0 ? (
                <AlertCircle className="h-4 w-4 text-yellow-600" />
              ) : (
                <CheckCircle className="h-4 w-4 text-primary" />
              )}
              <AlertDescription>
                {isLoadingConteo ? (
                  'Calculando usuarios...'
                ) : (
                  <>
                    <strong>{conteo?.pendientes_inscribir || 0}</strong> usuarios serán inscritos.
                    {(conteo?.ya_inscritos || 0) > 0 && (
                      <span className="text-muted-foreground ml-1">
                        ({conteo?.ya_inscritos} ya inscritos)
                      </span>
                    )}
                  </>
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleInscribir}
            disabled={
              !selectedCurso || 
              selectedRoles.length === 0 || 
              inscribirMasivo.isPending ||
              conteo?.pendientes_inscribir === 0
            }
            className="apple-button-primary"
          >
            {inscribirMasivo.isPending && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
            Inscribir {conteo?.pendientes_inscribir || 0} usuarios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
