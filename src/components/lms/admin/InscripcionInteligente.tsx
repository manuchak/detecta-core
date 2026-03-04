import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Search, Users, BookOpen, X, CheckCircle, Clock, AlertTriangle,
  ArrowRight, ArrowLeft, RefreshCw, UserPlus, ChevronRight
} from "lucide-react";
import { useLMSUsuariosConContexto, type UsuarioConContexto } from "@/hooks/lms/useLMSUsuariosConContexto";
import { useLMSAdminCursos } from "@/hooks/lms/useLMSAdminCursos";
import { useLMSInscribirUsuarios } from "@/hooks/lms/useLMSAdminInscripciones";
import { LMS_ROLES_OBJETIVO } from "@/types/lms";
import type { LMSCurso } from "@/types/lms";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InscripcionInteligente({ open, onOpenChange }: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [searchUsers, setSearchUsers] = useState("");
  const [searchCursos, setSearchCursos] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [selectedCursoIds, setSelectedCursoIds] = useState<Set<string>>(new Set());

  const { data: usuarios = [], isLoading: loadingUsers } = useLMSUsuariosConContexto();
  const { data: cursos = [] } = useLMSAdminCursos();
  const inscribir = useLMSInscribirUsuarios();

  // Reset on open
  const handleOpenChange = (v: boolean) => {
    if (v) {
      setStep(1);
      setSearchUsers("");
      setSearchCursos("");
      setSelectedRoles([]);
      setSelectedUserIds(new Set());
      setSelectedCursoIds(new Set());
    }
    onOpenChange(v);
  };

  // Filter users
  const filteredUsers = useMemo(() => {
    let result = usuarios;
    if (selectedRoles.length > 0) {
      result = result.filter(u => u.roles.some(r => selectedRoles.includes(r)));
    }
    if (searchUsers.trim()) {
      const s = searchUsers.toLowerCase();
      result = result.filter(u =>
        u.display_name.toLowerCase().includes(s) ||
        u.email.toLowerCase().includes(s)
      );
    }
    return result;
  }, [usuarios, selectedRoles, searchUsers]);

  // Filter courses
  const activeCursos = useMemo(() => {
    let result = cursos.filter(c => c.activo && c.publicado);
    if (searchCursos.trim()) {
      const s = searchCursos.toLowerCase();
      result = result.filter(c => c.titulo.toLowerCase().includes(s) || c.codigo.toLowerCase().includes(s));
    }
    return result;
  }, [cursos, searchCursos]);

  // Selected users array
  const selectedUsers = useMemo(() =>
    usuarios.filter(u => selectedUserIds.has(u.id)),
    [usuarios, selectedUserIds]
  );

  // Conflict matrix
  const conflictMatrix = useMemo(() => {
    if (selectedUsers.length === 0) return new Map<string, { nuevos: UsuarioConContexto[]; yaInscritos: UsuarioConContexto[]; completados: UsuarioConContexto[] }>();

    const matrix = new Map<string, { nuevos: UsuarioConContexto[]; yaInscritos: UsuarioConContexto[]; completados: UsuarioConContexto[] }>();

    selectedCursoIds.forEach(cursoId => {
      const nuevos: UsuarioConContexto[] = [];
      const yaInscritos: UsuarioConContexto[] = [];
      const completados: UsuarioConContexto[] = [];

      selectedUsers.forEach(u => {
        const insc = u.inscripciones.find(i => i.curso_id === cursoId);
        if (!insc) {
          nuevos.push(u);
        } else if (insc.estado === 'completado') {
          completados.push(u);
        } else {
          yaInscritos.push(u);
        }
      });

      matrix.set(cursoId, { nuevos, yaInscritos, completados });
    });

    return matrix;
  }, [selectedUsers, selectedCursoIds]);

  // Total new enrollments
  const totalNuevos = useMemo(() => {
    let count = 0;
    conflictMatrix.forEach(v => { count += v.nuevos.length; });
    return count;
  }, [conflictMatrix]);

  const totalOmitidos = useMemo(() => {
    let count = 0;
    conflictMatrix.forEach(v => { count += v.yaInscritos.length + v.completados.length; });
    return count;
  }, [conflictMatrix]);

  // Toggle helpers
  const toggleUser = (id: string) => {
    setSelectedUserIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleCurso = (id: string) => {
    setSelectedCursoIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleRole = (role: string) => {
    setSelectedRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const selectAllFiltered = () => {
    setSelectedUserIds(prev => {
      const next = new Set(prev);
      filteredUsers.forEach(u => next.add(u.id));
      return next;
    });
  };

  const handleInscribir = async () => {
    const cursoIds = Array.from(selectedCursoIds);
    const userIds = Array.from(selectedUserIds);

    // Inscribe each curso×users batch
    try {
      for (const cursoId of cursoIds) {
        const conflict = conflictMatrix.get(cursoId);
        const nuevosIds = conflict ? conflict.nuevos.map(u => u.id) : userIds;
        if (nuevosIds.length === 0) continue;

        await inscribir.mutateAsync({
          cursoId,
          usuarioIds: nuevosIds,
          tipoInscripcion: 'asignada',
        });
      }
      toast.success(`${totalNuevos} inscripciones realizadas exitosamente`);
      handleOpenChange(false);
    } catch {
      toast.error('Error al realizar las inscripciones');
    }
  };

  const getRolLabel = (role: string) => {
    return LMS_ROLES_OBJETIVO.find(r => r.value === role)?.label || role;
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Nueva Inscripción
          </DialogTitle>
          <DialogDescription>
            {step === 1 ? "Selecciona los usuarios que deseas inscribir" : "Selecciona los cursos y revisa los conflictos"}
          </DialogDescription>
          {/* Step indicator */}
          <div className="flex items-center gap-2 pt-2">
            <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${step === 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
              <Users className="w-3 h-3" /> Usuarios
            </div>
            <ChevronRight className="w-3 h-3 text-muted-foreground" />
            <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${step === 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
              <BookOpen className="w-3 h-3" /> Cursos
            </div>
          </div>
        </DialogHeader>

        {/* Selected users chips (always visible) */}
        {selectedUserIds.size > 0 && (
          <div className="flex flex-wrap gap-1.5 px-1">
            <span className="text-xs text-muted-foreground self-center mr-1">
              {selectedUserIds.size} seleccionado{selectedUserIds.size !== 1 ? 's' : ''}:
            </span>
            {selectedUsers.slice(0, 8).map(u => (
              <Badge key={u.id} variant="secondary" className="gap-1 text-xs py-0.5">
                {u.display_name.split(' ')[0]}
                <X className="w-3 h-3 cursor-pointer hover:text-destructive" onClick={() => toggleUser(u.id)} />
              </Badge>
            ))}
            {selectedUsers.length > 8 && (
              <Badge variant="outline" className="text-xs py-0.5">
                +{selectedUsers.length - 8} más
              </Badge>
            )}
          </div>
        )}

        <Separator />

        {/* STEP 1: Select Users */}
        {step === 1 && (
          <div className="flex-1 min-h-0 flex flex-col gap-3">
            {/* Role filter chips */}
            <div className="flex flex-wrap gap-1.5">
              {LMS_ROLES_OBJETIVO.map(rol => (
                <Badge
                  key={rol.value}
                  variant={selectedRoles.includes(rol.value) ? "default" : "outline"}
                  className="cursor-pointer text-xs transition-colors"
                  onClick={() => toggleRole(rol.value)}
                >
                  {rol.label}
                </Badge>
              ))}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o email..."
                value={searchUsers}
                onChange={(e) => setSearchUsers(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Select all button */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {filteredUsers.length} usuario{filteredUsers.length !== 1 ? 's' : ''} encontrado{filteredUsers.length !== 1 ? 's' : ''}
              </span>
              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={selectAllFiltered}>
                Seleccionar todos
              </Button>
            </div>

            {/* User list */}
            <ScrollArea className="flex-1 min-h-0 max-h-[340px] border rounded-lg">
              {loadingUsers ? (
                <div className="p-8 text-center text-muted-foreground text-sm">Cargando usuarios...</div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">No se encontraron usuarios</div>
              ) : (
                <div className="divide-y">
                  {filteredUsers.map(user => (
                    <label
                      key={user.id}
                      className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors hover:bg-muted/50 ${selectedUserIds.has(user.id) ? 'bg-primary/5' : ''}`}
                    >
                      <Checkbox
                        checked={selectedUserIds.has(user.id)}
                        onCheckedChange={() => toggleUser(user.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{user.display_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {user.roles.slice(0, 2).map(r => (
                          <Badge key={r} variant="outline" className="text-[10px] px-1.5 py-0">
                            {getRolLabel(r)}
                          </Badge>
                        ))}
                        {user.cursosActivos > 0 && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-0.5">
                            <Clock className="w-2.5 h-2.5" /> {user.cursosActivos}
                          </Badge>
                        )}
                        {user.cursosCompletados > 0 && (
                          <Badge className="text-[10px] px-1.5 py-0 gap-0.5 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 hover:bg-green-100">
                            <CheckCircle className="w-2.5 h-2.5" /> {user.cursosCompletados}
                          </Badge>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        )}

        {/* STEP 2: Select Courses + Conflicts */}
        {step === 2 && (
          <div className="flex-1 min-h-0 flex flex-col gap-3">
            {/* Search courses */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar curso..."
                value={searchCursos}
                onChange={(e) => setSearchCursos(e.target.value)}
                className="pl-10"
              />
            </div>

            <ScrollArea className="flex-1 min-h-0 max-h-[280px] border rounded-lg">
              {activeCursos.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">No hay cursos disponibles</div>
              ) : (
                <div className="divide-y">
                  {activeCursos.map(curso => {
                    const isSelected = selectedCursoIds.has(curso.id);
                    const conflict = conflictMatrix.get(curso.id);

                    return (
                      <div key={curso.id} className={`transition-colors ${isSelected ? 'bg-primary/5' : ''}`}>
                        <label className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-muted/50">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleCurso(curso.id)}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{curso.titulo}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-muted-foreground">{curso.codigo}</span>
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">{curso.nivel}</Badge>
                              {curso.es_obligatorio && (
                                <Badge className="text-[10px] px-1.5 py-0 bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 hover:bg-amber-100">
                                  Obligatorio
                                </Badge>
                              )}
                            </div>
                          </div>
                        </label>

                        {/* Conflict details when selected */}
                        {isSelected && conflict && (conflict.yaInscritos.length > 0 || conflict.completados.length > 0) && (
                          <div className="px-10 pb-2.5 space-y-1">
                            {conflict.nuevos.length > 0 && (
                              <p className="text-xs text-muted-foreground">
                                <span className="inline-flex items-center gap-1 text-foreground font-medium">
                                  <UserPlus className="w-3 h-3" /> {conflict.nuevos.length} nuevo{conflict.nuevos.length !== 1 ? 's' : ''}
                                </span>
                              </p>
                            )}
                            {conflict.yaInscritos.length > 0 && (
                              <p className="text-xs flex items-center gap-1 text-blue-600 dark:text-blue-400">
                                <Clock className="w-3 h-3" />
                                {conflict.yaInscritos.length} ya inscrito{conflict.yaInscritos.length !== 1 ? 's' : ''}
                                <span className="text-muted-foreground">
                                  ({conflict.yaInscritos.map(u => u.display_name.split(' ')[0]).join(', ')})
                                </span>
                              </p>
                            )}
                            {conflict.completados.length > 0 && (
                              <p className="text-xs flex items-center gap-1 text-green-600 dark:text-green-400">
                                <CheckCircle className="w-3 h-3" />
                                {conflict.completados.length} completado{conflict.completados.length !== 1 ? 's' : ''}
                                <span className="text-muted-foreground">
                                  ({conflict.completados.map(u => u.display_name.split(' ')[0]).join(', ')})
                                </span>
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>

            {/* Summary */}
            {selectedCursoIds.size > 0 && (
              <div className="rounded-lg border bg-muted/30 p-3 space-y-1">
                <p className="text-sm font-medium">
                  Resumen: {totalNuevos} inscripción{totalNuevos !== 1 ? 'es' : ''} nueva{totalNuevos !== 1 ? 's' : ''}
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedUserIds.size} usuario{selectedUserIds.size !== 1 ? 's' : ''} × {selectedCursoIds.size} curso{selectedCursoIds.size !== 1 ? 's' : ''}
                  {totalOmitidos > 0 && (
                    <span className="ml-1">
                      — <AlertTriangle className="w-3 h-3 inline" /> {totalOmitidos} serán omitido{totalOmitidos !== 1 ? 's' : ''} (ya inscritos/completados)
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="flex-row justify-between sm:justify-between gap-2">
          {step === 2 ? (
            <>
              <Button variant="outline" onClick={() => setStep(1)} className="gap-1">
                <ArrowLeft className="w-4 h-4" /> Usuarios
              </Button>
              <Button
                onClick={handleInscribir}
                disabled={selectedCursoIds.size === 0 || totalNuevos === 0 || inscribir.isPending}
                className="apple-button-primary gap-1"
              >
                {inscribir.isPending && <RefreshCw className="w-4 h-4 animate-spin" />}
                Inscribir {totalNuevos} usuario{totalNuevos !== 1 ? 's' : ''}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Cancelar
              </Button>
              <Button
                onClick={() => setStep(2)}
                disabled={selectedUserIds.size === 0}
                className="gap-1"
              >
                Seleccionar Cursos <ArrowRight className="w-4 h-4" />
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
