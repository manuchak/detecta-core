import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, AlertCircle, CheckCircle2, Phone, MapPin, Calendar, Award, Package } from 'lucide-react';
import { useArmedOperatives, ArmedOperative } from '@/hooks/useArmedOperatives';
import { toast } from 'sonner';

const EQUIPAMIENTO_OPTIONS = [
  'Chaleco antibalas',
  'Radio de comunicación',
  'Linterna táctica',
  'Esposas',
  'Gas pimienta',
  'Bastón retráctil'
];

export function ArmedsPendingValidation() {
  const { getPendingOperatives, completeVerification, getAssignmentCount } = useArmedOperatives();
  const [pendingOperatives, setPendingOperatives] = useState<ArmedOperative[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOperative, setSelectedOperative] = useState<ArmedOperative | null>(null);
  const [assignmentCounts, setAssignmentCounts] = useState<Record<string, number>>({});
  const [verificationDialogOpen, setVerificationDialogOpen] = useState(false);
  const [verificationData, setVerificationData] = useState({
    licencia_portacion: '',
    fecha_vencimiento_licencia: '',
    experiencia_anos: 0,
    equipamiento_disponible: [] as string[],
    email: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await getPendingOperatives();
    setPendingOperatives(data);

    // Get assignment counts for each operative
    const counts: Record<string, number> = {};
    for (const op of data) {
      counts[op.id] = await getAssignmentCount(op.id);
    }
    setAssignmentCounts(counts);
    setLoading(false);
  };

  const handleOpenVerification = (operative: ArmedOperative) => {
    setSelectedOperative(operative);
    setVerificationData({
      licencia_portacion: operative.licencia_portacion || '',
      fecha_vencimiento_licencia: operative.fecha_vencimiento_licencia || '',
      experiencia_anos: operative.experiencia_anos || 0,
      equipamiento_disponible: operative.equipamiento_disponible || [],
      email: operative.email || ''
    });
    setVerificationDialogOpen(true);
  };

  const handleCompleteVerification = async () => {
    if (!selectedOperative) return;

    setSubmitting(true);
    const success = await completeVerification(selectedOperative.id, verificationData);
    setSubmitting(false);

    if (success) {
      setVerificationDialogOpen(false);
      setSelectedOperative(null);
      await loadData();
    }
  };

  const toggleEquipamiento = (item: string) => {
    setVerificationData(prev => ({
      ...prev,
      equipamiento_disponible: prev.equipamiento_disponible.includes(item)
        ? prev.equipamiento_disponible.filter(e => e !== item)
        : [...prev.equipamiento_disponible, item]
    }));
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cargando...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-warning" />
            Armados Pendientes de Validación
          </CardTitle>
          <CardDescription>
            Estos armados fueron registrados de manera rápida y requieren completar su perfil. 
            Tienen un límite de 3 asignaciones hasta completar la verificación.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {pendingOperatives.length === 0 ? (
            <Alert>
              <CheckCircle2 className="h-4 w-4 text-success" />
              <AlertDescription>
                No hay armados pendientes de validación. ¡Todos los perfiles están completos!
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid gap-4">
              {pendingOperatives.map((operative) => {
                const count = assignmentCounts[operative.id] || 0;
                const isNearLimit = count >= 2;
                const isAtLimit = count >= 3;

                return (
                  <Card key={operative.id} className={isAtLimit ? 'border-destructive' : ''}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-primary" />
                            <h3 className="font-semibold text-lg">{operative.nombre}</h3>
                            {isAtLimit && (
                              <Badge variant="destructive">Límite Alcanzado</Badge>
                            )}
                            {isNearLimit && !isAtLimit && (
                              <Badge variant="outline" className="border-warning text-warning">
                                {count}/3 servicios
                              </Badge>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Phone className="h-4 w-4" />
                              {operative.telefono || 'Sin teléfono'}
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              {operative.zona_base}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            Registrado: {new Date(operative.created_at || '').toLocaleDateString('es-MX')}
                          </div>

                          {isAtLimit && (
                            <Alert variant="destructive" className="mt-2">
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription className="text-xs">
                                Este armado ha alcanzado el límite de 3 asignaciones. 
                                <strong> No podrá ser asignado a nuevos servicios</strong> hasta completar su verificación.
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>

                        <Button onClick={() => handleOpenVerification(operative)}>
                          Completar Perfil
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Verification Dialog */}
      <Dialog open={verificationDialogOpen} onOpenChange={setVerificationDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Completar Verificación: {selectedOperative?.nombre}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={verificationData.email}
                onChange={(e) => setVerificationData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="correo@ejemplo.com"
              />
            </div>

            {/* Licencia */}
            <div className="space-y-2">
              <Label htmlFor="licencia">Licencia de Portación</Label>
              <Input
                id="licencia"
                value={verificationData.licencia_portacion}
                onChange={(e) => setVerificationData(prev => ({ ...prev, licencia_portacion: e.target.value }))}
                placeholder="Número de licencia"
              />
            </div>

            {/* Fecha Vencimiento */}
            <div className="space-y-2">
              <Label htmlFor="fecha_vencimiento">Fecha de Vencimiento Licencia</Label>
              <Input
                id="fecha_vencimiento"
                type="date"
                value={verificationData.fecha_vencimiento_licencia}
                onChange={(e) => setVerificationData(prev => ({ ...prev, fecha_vencimiento_licencia: e.target.value }))}
              />
            </div>

            {/* Experiencia */}
            <div className="space-y-2">
              <Label htmlFor="experiencia" className="flex items-center gap-2">
                <Award className="h-4 w-4" />
                Años de Experiencia
              </Label>
              <Input
                id="experiencia"
                type="number"
                min="0"
                value={verificationData.experiencia_anos}
                onChange={(e) => setVerificationData(prev => ({ ...prev, experiencia_anos: parseInt(e.target.value) || 0 }))}
              />
            </div>

            {/* Equipamiento */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Equipamiento Disponible
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {EQUIPAMIENTO_OPTIONS.map(item => (
                  <div key={item} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`equip-${item}`}
                      checked={verificationData.equipamiento_disponible.includes(item)}
                      onChange={() => toggleEquipamiento(item)}
                      className="rounded border-border"
                    />
                    <label htmlFor={`equip-${item}`} className="text-sm cursor-pointer">
                      {item}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setVerificationDialogOpen(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button onClick={handleCompleteVerification} disabled={submitting}>
              {submitting ? 'Guardando...' : 'Completar Verificación'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
