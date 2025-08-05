import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Eye, 
  Plus, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Star,
  Calendar,
  FileText,
  Award,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useInstaladorData } from '@/hooks/useInstaladorData';

interface AuditoriaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instalador: any;
}

export const AuditoriaDialog: React.FC<AuditoriaDialogProps> = ({
  open,
  onOpenChange,
  instalador
}) => {
  const { createAuditoria, updateAuditoria } = useInstaladorData();
  const [loading, setLoading] = useState(false);
  const [auditorias, setAuditorias] = useState<any[]>([]);
  const [showNewAuditoriaForm, setShowNewAuditoriaForm] = useState(false);
  
  const [newAuditoria, setNewAuditoria] = useState({
    programacion_id: '',
    puntuacion_tecnica: 5,
    puntuacion_evidencias: 5,
    puntuacion_documentacion: 5,
    puntuacion_general: 5,
    aspectos_positivos: [] as string[],
    aspectos_mejora: [] as string[],
    observaciones: '',
    requiere_seguimiento: false,
    estado_auditoria: 'en_revision'
  });

  const [newAspectoPositivo, setNewAspectoPositivo] = useState('');
  const [newAspectoMejora, setNewAspectoMejora] = useState('');

  useEffect(() => {
    if (instalador && open) {
      loadAuditorias();
    }
  }, [instalador, open]);

  const loadAuditorias = async () => {
    // Simulamos carga de auditorías - en implementación real sería desde la base de datos
    setAuditorias([]);
  };

  const handleCreateAuditoria = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instalador) return;

    try {
      setLoading(true);
      const auditoriaData = {
        ...newAuditoria,
        instalador_id: instalador.id,
        auditor_id: 'current-user-id' // En implementación real, obtener del contexto de usuario
      };

      await createAuditoria(auditoriaData);
      
      // Reset form
      setNewAuditoria({
        programacion_id: '',
        puntuacion_tecnica: 5,
        puntuacion_evidencias: 5,
        puntuacion_documentacion: 5,
        puntuacion_general: 5,
        aspectos_positivos: [],
        aspectos_mejora: [],
        observaciones: '',
        requiere_seguimiento: false,
        estado_auditoria: 'en_revision'
      });
      setNewAspectoPositivo('');
      setNewAspectoMejora('');
      setShowNewAuditoriaForm(false);
      
      // Reload auditorías
      await loadAuditorias();
    } catch (error) {
      console.error('Error creating auditoria:', error);
    } finally {
      setLoading(false);
    }
  };

  const addAspectoPositivo = () => {
    if (newAspectoPositivo.trim()) {
      setNewAuditoria(prev => ({
        ...prev,
        aspectos_positivos: [...prev.aspectos_positivos, newAspectoPositivo.trim()]
      }));
      setNewAspectoPositivo('');
    }
  };

  const removeAspectoPositivo = (index: number) => {
    setNewAuditoria(prev => ({
      ...prev,
      aspectos_positivos: prev.aspectos_positivos.filter((_, i) => i !== index)
    }));
  };

  const addAspectoMejora = () => {
    if (newAspectoMejora.trim()) {
      setNewAuditoria(prev => ({
        ...prev,
        aspectos_mejora: [...prev.aspectos_mejora, newAspectoMejora.trim()]
      }));
      setNewAspectoMejora('');
    }
  };

  const removeAspectoMejora = (index: number) => {
    setNewAuditoria(prev => ({
      ...prev,
      aspectos_mejora: prev.aspectos_mejora.filter((_, i) => i !== index)
    }));
  };

  const getEstadoBadge = (estado: string) => {
    const variants = {
      'en_revision': { variant: 'secondary' as const, className: 'bg-yellow-100 text-yellow-800', icon: Eye },
      'aprobada': { variant: 'secondary' as const, className: 'bg-green-100 text-green-800', icon: CheckCircle },
      'rechazada': { variant: 'secondary' as const, className: 'bg-red-100 text-red-800', icon: XCircle },
      'requiere_correccion': { variant: 'secondary' as const, className: 'bg-orange-100 text-orange-800', icon: AlertTriangle }
    };

    const config = variants[estado as keyof typeof variants] || variants['en_revision'];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className={config.className}>
        <Icon className="h-3 w-3 mr-1" />
        {estado.replace('_', ' ').charAt(0).toUpperCase() + estado.replace('_', ' ').slice(1)}
      </Badge>
    );
  };

  const getPuntuacionColor = (puntuacion: number) => {
    if (puntuacion >= 8) return 'text-green-600';
    if (puntuacion >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Calcular puntuación general promedio
  const calcularPuntuacionGeneral = () => {
    const { puntuacion_tecnica, puntuacion_evidencias, puntuacion_documentacion } = newAuditoria;
    const promedio = (puntuacion_tecnica + puntuacion_evidencias + puntuacion_documentacion) / 3;
    setNewAuditoria(prev => ({ ...prev, puntuacion_general: Math.round(promedio * 10) / 10 }));
  };

  useEffect(() => {
    calcularPuntuacionGeneral();
  }, [newAuditoria.puntuacion_tecnica, newAuditoria.puntuacion_evidencias, newAuditoria.puntuacion_documentacion]);

  if (!instalador) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Auditoría de Instalaciones - {instalador.nombre_completo}
          </DialogTitle>
          <DialogDescription>
            Evalúa el desempeño del instalador y registra auditorías de calidad.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Métricas del instalador */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Calificación General</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getPuntuacionColor(instalador.calificacion_promedio || 0)}`}>
                  {(instalador.calificacion_promedio || 0).toFixed(1)}/10
                </div>
                <p className="text-xs text-muted-foreground">Promedio histórico</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Instalaciones</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{instalador.total_instalaciones || 0}</div>
                <p className="text-xs text-muted-foreground">Total completadas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Éxito</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {instalador.total_instalaciones > 0 
                    ? Math.round(((instalador.instalaciones_exitosas || 0) / instalador.total_instalaciones) * 100)
                    : 0}%
                </div>
                <p className="text-xs text-muted-foreground">Tasa de éxito</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Auditorías</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{auditorias.length}</div>
                <p className="text-xs text-muted-foreground">Auditorías realizadas</p>
              </CardContent>
            </Card>
          </div>

          {/* Formulario para nueva auditoría */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Nueva Auditoría</CardTitle>
                <Button 
                  onClick={() => setShowNewAuditoriaForm(!showNewAuditoriaForm)}
                  variant={showNewAuditoriaForm ? "outline" : "default"}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {showNewAuditoriaForm ? 'Cancelar' : 'Nueva Auditoría'}
                </Button>
              </div>
            </CardHeader>
            
            {showNewAuditoriaForm && (
              <CardContent>
                <form onSubmit={handleCreateAuditoria} className="space-y-6">
                  <div>
                    <Label htmlFor="programacion_id">ID de Programación</Label>
                    <Input
                      id="programacion_id"
                      value={newAuditoria.programacion_id}
                      onChange={(e) => setNewAuditoria(prev => ({ ...prev, programacion_id: e.target.value }))}
                      placeholder="UUID de la instalación a auditar"
                      required
                    />
                  </div>

                  {/* Puntuaciones */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Evaluación Técnica</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="puntuacion_tecnica">Calidad Técnica (1-10)</Label>
                          <Input
                            id="puntuacion_tecnica"
                            type="number"
                            min="1"
                            max="10"
                            value={newAuditoria.puntuacion_tecnica}
                            onChange={(e) => setNewAuditoria(prev => ({ 
                              ...prev, 
                              puntuacion_tecnica: parseInt(e.target.value) || 1 
                            }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="puntuacion_evidencias">Evidencias (1-10)</Label>
                          <Input
                            id="puntuacion_evidencias"
                            type="number"
                            min="1"
                            max="10"
                            value={newAuditoria.puntuacion_evidencias}
                            onChange={(e) => setNewAuditoria(prev => ({ 
                              ...prev, 
                              puntuacion_evidencias: parseInt(e.target.value) || 1 
                            }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="puntuacion_documentacion">Documentación (1-10)</Label>
                          <Input
                            id="puntuacion_documentacion"
                            type="number"
                            min="1"
                            max="10"
                            value={newAuditoria.puntuacion_documentacion}
                            onChange={(e) => setNewAuditoria(prev => ({ 
                              ...prev, 
                              puntuacion_documentacion: parseInt(e.target.value) || 1 
                            }))}
                          />
                        </div>
                      </div>

                      <div className="bg-muted p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Puntuación General:</span>
                          <span className={`text-xl font-bold ${getPuntuacionColor(newAuditoria.puntuacion_general)}`}>
                            {newAuditoria.puntuacion_general}/10
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Aspectos positivos */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Aspectos Positivos</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex gap-2">
                        <Input
                          value={newAspectoPositivo}
                          onChange={(e) => setNewAspectoPositivo(e.target.value)}
                          placeholder="Ej: Instalación limpia y ordenada"
                        />
                        <Button type="button" onClick={addAspectoPositivo}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {newAuditoria.aspectos_positivos.map((aspecto, index) => (
                          <div key={index} className="flex items-center justify-between bg-green-50 p-2 rounded">
                            <span className="text-green-800">{aspecto}</span>
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="sm"
                              onClick={() => removeAspectoPositivo(index)}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Aspectos de mejora */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Aspectos de Mejora</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex gap-2">
                        <Input
                          value={newAspectoMejora}
                          onChange={(e) => setNewAspectoMejora(e.target.value)}
                          placeholder="Ej: Mejorar el manejo de cables"
                        />
                        <Button type="button" onClick={addAspectoMejora}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {newAuditoria.aspectos_mejora.map((aspecto, index) => (
                          <div key={index} className="flex items-center justify-between bg-orange-50 p-2 rounded">
                            <span className="text-orange-800">{aspecto}</span>
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="sm"
                              onClick={() => removeAspectoMejora(index)}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Observaciones y estado */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="observaciones">Observaciones Generales</Label>
                      <Textarea
                        id="observaciones"
                        value={newAuditoria.observaciones}
                        onChange={(e) => setNewAuditoria(prev => ({ ...prev, observaciones: e.target.value }))}
                        placeholder="Comentarios adicionales sobre la auditoría..."
                        rows={4}
                      />
                    </div>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="estado_auditoria">Estado de la Auditoría</Label>
                        <Select 
                          value={newAuditoria.estado_auditoria} 
                          onValueChange={(value) => setNewAuditoria(prev => ({ ...prev, estado_auditoria: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar estado" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="en_revision">En Revisión</SelectItem>
                            <SelectItem value="aprobada">Aprobada</SelectItem>
                            <SelectItem value="requiere_correccion">Requiere Corrección</SelectItem>
                            <SelectItem value="rechazada">Rechazada</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="requiere_seguimiento"
                          checked={newAuditoria.requiere_seguimiento}
                          onChange={(e) => setNewAuditoria(prev => ({ ...prev, requiere_seguimiento: e.target.checked }))}
                        />
                        <Label htmlFor="requiere_seguimiento">Requiere seguimiento</Label>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setShowNewAuditoriaForm(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Creando...' : 'Crear Auditoría'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            )}
          </Card>

          {/* Lista de auditorías */}
          <Card>
            <CardHeader>
              <CardTitle>Historial de Auditorías</CardTitle>
            </CardHeader>
            <CardContent>
              {auditorias.length === 0 ? (
                <div className="text-center py-8">
                  <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay auditorías registradas</h3>
                  <p className="text-muted-foreground">Este instalador aún no tiene auditorías en el sistema.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Programación</TableHead>
                      <TableHead>Puntuación</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Seguimiento</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditorias.map((auditoria) => (
                      <TableRow key={auditoria.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>{format(new Date(auditoria.fecha_auditoria), 'dd/MM/yyyy', { locale: es })}</span>
                          </div>
                        </TableCell>
                        <TableCell>{auditoria.programacion_id}</TableCell>
                        <TableCell>
                          <div className={`font-medium ${getPuntuacionColor(auditoria.puntuacion_general)}`}>
                            {auditoria.puntuacion_general}/10
                          </div>
                        </TableCell>
                        <TableCell>
                          {getEstadoBadge(auditoria.estado_auditoria)}
                        </TableCell>
                        <TableCell>
                          {auditoria.requiere_seguimiento && (
                            <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Seguimiento
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            Ver Detalles
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};