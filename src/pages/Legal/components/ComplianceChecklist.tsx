import { useState } from 'react';
import { ShieldCheck, AlertTriangle, CheckCircle2, Clock, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  usePlantillasLegal,
  useComplianceChecks,
  useUpsertCompliance,
  COMPLIANCE_TYPES,
  COMPLIANCE_STATUS,
} from '@/hooks/useLegalTemplates';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const ComplianceChecklist = () => {
  const { data: plantillas } = usePlantillasLegal();
  const { data: checks, isLoading } = useComplianceChecks();
  const upsertCompliance = useUpsertCompliance();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    plantillaId: '',
    complianceType: '',
    status: 'review_needed',
    nextReviewDate: '',
    notes: '',
  });

  const handleSubmit = async () => {
    if (!form.plantillaId || !form.complianceType) return;
    await upsertCompliance.mutateAsync({
      plantillaId: form.plantillaId,
      complianceType: form.complianceType,
      status: form.status,
      nextReviewDate: form.nextReviewDate || undefined,
      notes: form.notes || undefined,
    });
    setDialogOpen(false);
    setForm({ plantillaId: '', complianceType: '', status: 'review_needed', nextReviewDate: '', notes: '' });
  };

  const getStatusConfig = (status: string) => {
    return COMPLIANCE_STATUS.find((s) => s.value === status) || COMPLIANCE_STATUS[1];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant': return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
      case 'non_compliant': return <AlertTriangle className="h-4 w-4 text-destructive" />;
      default: return <Clock className="h-4 w-4 text-amber-600" />;
    }
  };

  const getPlantillaName = (id: string) => plantillas?.find((p) => p.id === id)?.nombre || id;
  const getComplianceLabel = (type: string) => COMPLIANCE_TYPES.find((t) => t.value === type)?.label || type;

  // Group checks by plantilla
  const grouped = (checks || []).reduce<Record<string, typeof checks>>((acc, check) => {
    if (!acc[check.plantilla_id]) acc[check.plantilla_id] = [];
    acc[check.plantilla_id]!.push(check);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Checklists de cumplimiento legal por plantilla
        </p>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" /> Agregar Revisión
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nueva Revisión de Compliance</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <Select value={form.plantillaId} onValueChange={(v) => setForm({ ...form, plantillaId: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar plantilla..." /></SelectTrigger>
                <SelectContent>
                  {(plantillas || []).map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={form.complianceType} onValueChange={(v) => setForm({ ...form, complianceType: v })}>
                <SelectTrigger><SelectValue placeholder="Tipo de regulación..." /></SelectTrigger>
                <SelectContent>
                  {COMPLIANCE_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COMPLIANCE_STATUS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={form.nextReviewDate}
                onChange={(e) => setForm({ ...form, nextReviewDate: e.target.value })}
                placeholder="Próxima revisión"
              />
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Notas..."
                rows={3}
              />
              <Button onClick={handleSubmit} disabled={upsertCompliance.isPending} className="w-full">
                {upsertCompliance.isPending ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <ShieldCheck className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p>Sin revisiones de compliance registradas</p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(grouped).map(([plantillaId, plantillaChecks]) => (
          <Card key={plantillaId}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{getPlantillaName(plantillaId)}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {plantillaChecks!.map((check) => {
                const statusConfig = getStatusConfig(check.status);
                return (
                  <div
                    key={check.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(check.status)}
                      <div>
                        <p className="text-sm font-medium">{getComplianceLabel(check.compliance_type)}</p>
                        {check.notes && (
                          <p className="text-xs text-muted-foreground">{check.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <Badge className={statusConfig.color + ' border-0'} variant="outline">
                        {statusConfig.label}
                      </Badge>
                      {check.next_review_date && (
                        <span>Próx: {format(new Date(check.next_review_date), "d MMM yyyy", { locale: es })}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};

export default ComplianceChecklist;
