import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { 
  Search, UserPlus, Trash2, RefreshCw, CheckCircle, Clock, XCircle, 
  AlertTriangle, Filter, Users, PlayCircle
} from "lucide-react";
import { 
  useLMSAdminInscripciones, 
  useLMSInscribirUsuarios, 
  useLMSActualizarInscripcion, 
  useLMSEliminarInscripcion,
  useLMSUsuariosDisponibles,
  useLMSEstadisticasCurso
} from "@/hooks/lms/useLMSAdminInscripciones";
import { useLMSAdminCursos } from "@/hooks/lms/useLMSAdminCursos";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { EstadoInscripcion } from "@/types/lms";

// Configuración de estados alineada con la DB
const ESTADO_CONFIG: Record<EstadoInscripcion, { label: string; icon: React.ElementType; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  inscrito: { label: "Inscrito", icon: Clock, variant: "secondary" },
  en_progreso: { label: "En Progreso", icon: PlayCircle, variant: "default" },
  completado: { label: "Completado", icon: CheckCircle, variant: "default" },
  vencido: { label: "Vencido", icon: AlertTriangle, variant: "destructive" },
  abandonado: { label: "Abandonado", icon: XCircle, variant: "destructive" }
};

export function LMSInscripcionesPanel() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCurso, setFilterCurso] = useState<string>("all");
  const [filterEstado, setFilterEstado] = useState<string>("all");
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const [selectedCursoForEnroll, setSelectedCursoForEnroll] = useState<string>("");

  const { data: cursos = [] } = useLMSAdminCursos();
  const { data: inscripciones = [], isLoading } = useLMSAdminInscripciones({
    cursoId: filterCurso !== "all" ? filterCurso : undefined,
    estado: filterEstado !== "all" ? filterEstado as EstadoInscripcion : undefined
  });
  const { data: statsData } = useLMSEstadisticasCurso(filterCurso !== "all" ? filterCurso : undefined);
  const stats = statsData ? { totalInscritos: statsData.total, completados: statsData.completados, enProgreso: statsData.enProgreso, promedioProgreso: statsData.progresoPromedio } : null;

  const enrollUser = useLMSInscribirUsuarios();
  const updateInscripcion = useLMSActualizarInscripcion();
  const deleteInscripcion = useLMSEliminarInscripcion();

  const filteredInscripciones = inscripciones.filter(i => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      i.usuario?.display_name?.toLowerCase().includes(search) ||
      i.usuario?.email?.toLowerCase().includes(search) ||
      i.curso?.titulo?.toLowerCase().includes(search)
    );
  });

  const handleUpdateEstado = async (id: string, estado: EstadoInscripcion) => {
    try {
      await updateInscripcion.mutateAsync({ inscripcionId: id, data: { estado } });
      toast.success("Estado actualizado");
    } catch (error) {
      toast.error("Error al actualizar estado");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta inscripción?")) return;
    try {
      await deleteInscripcion.mutateAsync(id);
      toast.success("Inscripción eliminada");
    } catch (error) {
      toast.error("Error al eliminar inscripción");
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.totalInscritos}</div>
              <p className="text-sm text-muted-foreground">Total Inscritos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">{stats.completados}</div>
              <p className="text-sm text-muted-foreground">Completados</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-600">{stats.enProgreso}</div>
              <p className="text-sm text-muted-foreground">En Progreso</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.promedioProgreso}%</div>
              <p className="text-sm text-muted-foreground">Progreso Promedio</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Inscripciones
          </CardTitle>
          <Button onClick={() => setEnrollDialogOpen(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Nueva Inscripción
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, email o curso..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterCurso} onValueChange={setFilterCurso}>
              <SelectTrigger className="w-[200px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filtrar por curso" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los cursos</SelectItem>
                {cursos.map(curso => (
                  <SelectItem key={curso.id} value={curso.id}>
                    {curso.titulo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterEstado} onValueChange={setFilterEstado}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="inscrito">Inscrito</SelectItem>
                <SelectItem value="en_progreso">En Progreso</SelectItem>
                <SelectItem value="completado">Completado</SelectItem>
                <SelectItem value="vencido">Vencido</SelectItem>
                <SelectItem value="abandonado">Abandonado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : filteredInscripciones.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No se encontraron inscripciones</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Curso</TableHead>
                    <TableHead>Progreso</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha Inscripción</TableHead>
                    <TableHead>Fecha Límite</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInscripciones.map((inscripcion) => {
                    const estadoConfig = ESTADO_CONFIG[inscripcion.estado as EstadoInscripcion] || ESTADO_CONFIG.inscrito;
                    const StatusIcon = estadoConfig.icon;
                    
                    return (
                      <TableRow key={inscripcion.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{inscripcion.usuario?.display_name || 'N/A'}</p>
                            <p className="text-sm text-muted-foreground">{inscripcion.usuario?.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{inscripcion.curso?.titulo}</p>
                            <p className="text-sm text-muted-foreground">{inscripcion.curso?.codigo}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="w-32">
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span>{inscripcion.progreso_porcentaje}%</span>
                            </div>
                            <Progress value={inscripcion.progreso_porcentaje} className="h-2" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select 
                            value={inscripcion.estado} 
                            onValueChange={(v) => handleUpdateEstado(inscripcion.id, v as EstadoInscripcion)}
                          >
                            <SelectTrigger className="w-[140px]">
                              <Badge variant={estadoConfig.variant} className="gap-1">
                                <StatusIcon className="w-3 h-3" />
                                {estadoConfig.label}
                              </Badge>
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(ESTADO_CONFIG).map(([key, config]) => (
                                <SelectItem key={key} value={key}>
                                  <div className="flex items-center gap-2">
                                    <config.icon className="w-4 h-4" />
                                    {config.label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          {format(new Date(inscripcion.fecha_inscripcion), 'dd MMM yyyy', { locale: es })}
                        </TableCell>
                        <TableCell>
                          {inscripcion.fecha_limite ? (
                            <span className={new Date(inscripcion.fecha_limite) < new Date() ? 'text-destructive' : ''}>
                              {format(new Date(inscripcion.fecha_limite), 'dd MMM yyyy', { locale: es })}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">Sin límite</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDelete(inscripcion.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enroll Dialog */}
      <EnrollDialog
        open={enrollDialogOpen}
        onOpenChange={setEnrollDialogOpen}
        cursos={cursos}
        selectedCurso={selectedCursoForEnroll}
        onCursoChange={setSelectedCursoForEnroll}
        onEnroll={async (userId, cursoId) => {
          try {
            await enrollUser.mutateAsync({ cursoId, usuarioIds: [userId] });
            toast.success("Usuario inscrito exitosamente");
            setEnrollDialogOpen(false);
          } catch (error) {
            toast.error("Error al inscribir usuario");
          }
        }}
        isLoading={enrollUser.isPending}
      />
    </div>
  );
}

interface EnrollDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cursos: any[];
  selectedCurso: string;
  onCursoChange: (cursoId: string) => void;
  onEnroll: (userId: string, cursoId: string) => Promise<void>;
  isLoading: boolean;
}

function EnrollDialog({ open, onOpenChange, cursos, selectedCurso, onCursoChange, onEnroll, isLoading }: EnrollDialogProps) {
  const [selectedUser, setSelectedUser] = useState("");
  const [searchUser, setSearchUser] = useState("");
  
  const { data: availableUsers = [] } = useLMSUsuariosDisponibles(selectedCurso);

  const filteredUsers = availableUsers.filter(u => {
    if (!searchUser) return true;
    const search = searchUser.toLowerCase();
    return u.display_name?.toLowerCase().includes(search) || u.email?.toLowerCase().includes(search);
  });

  const handleEnroll = async () => {
    if (!selectedUser || !selectedCurso) return;
    await onEnroll(selectedUser, selectedCurso);
    setSelectedUser("");
    setSearchUser("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva Inscripción</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Curso</Label>
            <Select value={selectedCurso} onValueChange={onCursoChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un curso" />
              </SelectTrigger>
              <SelectContent>
                {cursos.map(curso => (
                  <SelectItem key={curso.id} value={curso.id}>
                    {curso.titulo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedCurso && (
            <div className="space-y-2">
              <Label>Usuario</Label>
              <Input
                placeholder="Buscar usuario..."
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
              />
              <div className="max-h-48 overflow-y-auto border rounded-md">
                {filteredUsers.length === 0 ? (
                  <p className="p-4 text-sm text-muted-foreground text-center">
                    No hay usuarios disponibles para inscribir
                  </p>
                ) : (
                  filteredUsers.map(user => (
                    <div
                      key={user.id}
                      className={`p-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                        selectedUser === user.id ? 'bg-muted' : ''
                      }`}
                      onClick={() => setSelectedUser(user.id)}
                    >
                      <p className="font-medium">{user.display_name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleEnroll} 
            disabled={!selectedUser || !selectedCurso || isLoading}
          >
            {isLoading && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
            Inscribir Usuario
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
