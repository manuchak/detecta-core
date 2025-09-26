import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, AlertTriangle, Clock, User, Shield, Plus, RotateCcw, Trash2, Edit } from 'lucide-react';
import { useArmedIndisponibilidades, CreateArmedIndisponibilidadData } from '@/hooks/useArmedIndisponibilidades';
import { useArmedGuardsOperativos } from '@/hooks/useArmedGuardsOperativos';

export function ArmedUnavailabilityManager() {
  const { 
    indisponibilidades, 
    activeIndisponibilidades,
    expiringSoonIndisponibilidades,
    loading, 
    createIndisponibilidad, 
    deactivateIndisponibilidad,
    reactivateIndisponibilidad,
    deleteIndisponibilidad 
  } = useArmedIndisponibilidades();
  
  const { armedGuards } = useArmedGuardsOperativos();
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState<Partial<CreateArmedIndisponibilidadData>>({
    tipo: 'temporal'
  });

  const tiposIndisponibilidad = [
    { value: 'temporal', label: 'Temporal', icon: Clock },
    { value: 'medica', label: 'Médica', icon: AlertTriangle },
    { value: 'personal', label: 'Personal', icon: User },
    { value: 'administrativa', label: 'Administrativa', icon: Shield },
    { value: 'indefinida', label: 'Indefinida', icon: Calendar }
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (indisponibilidad: any) => {
    if (!indisponibilidad.esta_activa) return 'bg-gray-500';
    if (indisponibilidad.dias_restantes && indisponibilidad.dias_restantes <= 1) return 'bg-red-500';
    if (indisponibilidad.dias_restantes && indisponibilidad.dias_restantes <= 3) return 'bg-orange-500';
    return 'bg-green-500';
  };

  const handleCreate = async () => {
    if (!formData.armado_id || !formData.tipo || !formData.fecha_inicio) return;
    
    const success = await createIndisponibilidad(formData as CreateArmedIndisponibilidadData);
    if (success) {
      setShowCreateDialog(false);
      setFormData({ tipo: 'temporal' });
    }
  };

  const handleDeactivate = async (id: string) => {
    await deactivateIndisponibilidad(id);
  };

  const handleReactivate = async (id: string) => {
    await reactivateIndisponibilidad(id);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta indisponibilidad?')) {
      await deleteIndisponibilidad(id);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span>Cargando indisponibilidades...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{activeIndisponibilidades.length}</p>
                <p className="text-sm text-muted-foreground">Actualmente No Disponibles</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-2xl font-bold">{expiringSoonIndisponibilidades.length}</p>
                <p className="text-sm text-muted-foreground">Expiran Pronto</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{armedGuards.length - activeIndisponibilidades.length}</p>
                <p className="text-sm text-muted-foreground">Armados Disponibles</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Gestión de Indisponibilidades</h2>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nueva Indisponibilidad
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Registrar Indisponibilidad</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label>Armado</Label>
                <Select 
                  value={formData.armado_id} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, armado_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un armado..." />
                  </SelectTrigger>
                  <SelectContent>
                    {armedGuards.map(guard => (
                      <SelectItem key={guard.id} value={guard.id}>
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          {guard.nombre}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Tipo de Indisponibilidad</Label>
                <Select 
                  value={formData.tipo} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, tipo: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposIndisponibilidad.map(tipo => {
                      const Icon = tipo.icon;
                      return (
                        <SelectItem key={tipo.value} value={tipo.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {tipo.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Fecha de Inicio</Label>
                <input
                  type="date"
                  className="w-full p-2 border rounded-md"
                  value={formData.fecha_inicio || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, fecha_inicio: e.target.value }))}
                />
              </div>

              {formData.tipo !== 'indefinida' && (
                <div>
                  <Label>Fecha de Fin (Opcional)</Label>
                  <input
                    type="date"
                    className="w-full p-2 border rounded-md"
                    value={formData.fecha_fin || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, fecha_fin: e.target.value }))}
                  />
                </div>
              )}

              <div>
                <Label>Motivo</Label>
                <Textarea
                  placeholder="Describe el motivo de la indisponibilidad..."
                  value={formData.motivo || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, motivo: e.target.value }))}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setShowCreateDialog(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleCreate}
                  disabled={!formData.armado_id || !formData.fecha_inicio}
                  className="flex-1"
                >
                  Crear
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Indisponibilidades List */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Indisponibilidades</CardTitle>
        </CardHeader>
        <CardContent>
          {indisponibilidades.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay indisponibilidades registradas
            </div>
          ) : (
            <div className="space-y-3">
              {indisponibilidades.map((indis) => (
                <Card key={indis.id} className="border-l-4" style={{
                  borderLeftColor: indis.esta_activa ? '#ef4444' : '#94a3b8'
                }}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <Badge 
                            variant={indis.esta_activa ? "destructive" : "secondary"}
                            className="capitalize"
                          >
                            {indis.tipo}
                          </Badge>
                          <span className="font-medium">{indis.armado_nombre}</span>
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(indis)}`} />
                        </div>
                        
                        <div className="text-sm text-muted-foreground">
                          <p><strong>Periodo:</strong> {formatDate(indis.fecha_inicio)} 
                            {indis.fecha_fin && ` - ${formatDate(indis.fecha_fin)}`}
                            {indis.dias_restantes !== null && (
                              <span className="ml-2 text-orange-600">
                                ({indis.dias_restantes} día{indis.dias_restantes !== 1 ? 's' : ''} restante{indis.dias_restantes !== 1 ? 's' : ''})
                              </span>
                            )}
                          </p>
                          {indis.motivo && (
                            <p><strong>Motivo:</strong> {indis.motivo}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-1">
                        {indis.esta_activa ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeactivate(indis.id)}
                            title="Reactivar disponibilidad"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReactivate(indis.id)}
                            title="Marcar como activa"
                          >
                            <Clock className="h-4 w-4" />
                          </Button>
                        )}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(indis.id)}
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}