import React, { useState } from 'react';
import { useSafePoints, useCreateSafePoint, useDeleteSafePoint, useVerifySafePoint, useSafePointsStats, type CreateSafePointInput } from '@/hooks/security/useSafePoints';
import { CRITERIA_WEIGHTS, CERTIFICATION_THRESHOLDS, type SafePointType, type CertificationLevel } from '@/lib/security/safePointScoring';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Plus, Search, MapPin, Shield, CheckCircle2, XCircle, Trash2, Award } from 'lucide-react';

const TYPE_LABELS: Record<SafePointType, string> = {
  gasolinera: 'Gasolinera',
  base_custodia: 'Base Custodia',
  area_descanso: 'Área de Descanso',
  punto_encuentro: 'Punto de Encuentro',
  terminal: 'Terminal',
  cedis: 'CEDIS',
  otro: 'Otro',
};

const CERT_STYLES: Record<CertificationLevel, string> = {
  oro: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  plata: 'bg-slate-100 text-slate-700 dark:bg-slate-800/40 dark:text-slate-300',
  bronce: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  precaucion: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const CRITERIA_LABELS: Record<string, string> = {
  has_security_guard: 'Guardia de seguridad',
  has_employees_24h: 'Personal 24h',
  has_visible_cctv: 'CCTV visible',
  has_military_nearby: 'Presencia militar cercana',
  is_well_lit: 'Buena iluminación',
  is_recognized_chain: 'Cadena reconocida',
  has_perimeter_barrier: 'Barrera perimetral',
  has_commercial_activity: 'Actividad comercial',
  truck_fits_inside: 'Camión cabe adentro',
  has_alternate_exit: 'Salida alterna',
  has_restrooms: 'Sanitarios',
  has_cell_signal: 'Señal celular',
};

const CRITERIA_CATEGORIES = [
  { title: 'Vigilancia y Presencia (40 pts)', keys: ['has_security_guard', 'has_employees_24h', 'has_visible_cctv', 'has_military_nearby'] },
  { title: 'Visibilidad y Disuasión (35 pts)', keys: ['is_well_lit', 'is_recognized_chain', 'has_perimeter_barrier', 'has_commercial_activity'] },
  { title: 'Operacional (25 pts)', keys: ['truck_fits_inside', 'has_alternate_exit', 'has_restrooms', 'has_cell_signal'] },
];

function calculateScore(criteria: Record<string, boolean>): number {
  let score = 0;
  for (const [key, weight] of Object.entries(CRITERIA_WEIGHTS)) {
    if (criteria[key]) score += weight;
  }
  return score;
}

function getCertLevel(score: number): CertificationLevel {
  if (score >= CERTIFICATION_THRESHOLDS.oro) return 'oro';
  if (score >= CERTIFICATION_THRESHOLDS.plata) return 'plata';
  if (score >= CERTIFICATION_THRESHOLDS.bronce) return 'bronce';
  return 'precaucion';
}

export function SafePointsManager() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: points, isLoading } = useSafePoints({
    type: typeFilter !== 'all' ? typeFilter as SafePointType : undefined,
  });
  const { data: stats } = useSafePointsStats();
  const createMutation = useCreateSafePoint();
  const deleteMutation = useDeleteSafePoint();
  const verifyMutation = useVerifySafePoint();

  const filtered = (points || []).filter(p =>
    !search.trim() || p.name.toLowerCase().includes(search.toLowerCase()) || (p.address || '').toLowerCase().includes(search.toLowerCase())
  );

  const [form, setForm] = useState<CreateSafePointInput>({
    name: '', type: 'gasolinera', lng: -99.13, lat: 19.43,
    has_security_guard: false, has_employees_24h: false, has_visible_cctv: false,
    has_military_nearby: false, is_well_lit: false, is_recognized_chain: false,
    has_perimeter_barrier: false, has_commercial_activity: false, truck_fits_inside: false,
    has_alternate_exit: false, has_restrooms: false, has_cell_signal: false,
  });

  const formScore = calculateScore(form as any);
  const formCert = getCertLevel(formScore);

  const handleCreate = () => {
    createMutation.mutate(form, {
      onSuccess: () => {
        setDialogOpen(false);
        setForm({ name: '', type: 'gasolinera', lng: -99.13, lat: 19.43,
          has_security_guard: false, has_employees_24h: false, has_visible_cctv: false,
          has_military_nearby: false, is_well_lit: false, is_recognized_chain: false,
          has_perimeter_barrier: false, has_commercial_activity: false, truck_fits_inside: false,
          has_alternate_exit: false, has_restrooms: false, has_cell_signal: false,
        });
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Total', value: stats.total, icon: MapPin },
            { label: 'Oro', value: stats.byLevel.oro, color: 'text-yellow-600' },
            { label: 'Plata', value: stats.byLevel.plata, color: 'text-slate-500' },
            { label: 'Verificados', value: stats.byStatus.verified, icon: CheckCircle2 },
          ].map((s, i) => (
            <Card key={i}>
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className={cn("text-xs text-muted-foreground", s.color)}>{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Buscar punto seguro..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-8 text-xs" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            {Object.entries(TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-8 text-xs gap-1"><Plus className="h-3.5 w-3.5" />Nuevo Punto</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <MapPin className="h-4 w-4" />Registrar Punto Seguro
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Nombre</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="h-8 text-xs mt-1" placeholder="Ej: Gasolinera Pemex Km 45" /></div>
                <div><Label className="text-xs">Tipo</Label>
                  <Select value={form.type} onValueChange={v => setForm({ ...form, type: v as SafePointType })}>
                    <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Latitud</Label><Input type="number" step="0.0001" value={form.lat} onChange={e => setForm({ ...form, lat: parseFloat(e.target.value) })} className="h-8 text-xs mt-1" /></div>
                <div><Label className="text-xs">Longitud</Label><Input type="number" step="0.0001" value={form.lng} onChange={e => setForm({ ...form, lng: parseFloat(e.target.value) })} className="h-8 text-xs mt-1" /></div>
              </div>
              <div><Label className="text-xs">Dirección</Label><Input value={form.address || ''} onChange={e => setForm({ ...form, address: e.target.value })} className="h-8 text-xs mt-1" placeholder="Carretera..." /></div>

              {/* Criteria */}
              {CRITERIA_CATEGORIES.map(cat => (
                <div key={cat.title}>
                  <p className="text-xs font-medium text-muted-foreground mb-2">{cat.title}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {cat.keys.map(key => (
                      <label key={key} className="flex items-center gap-2 text-xs cursor-pointer">
                        <Checkbox
                          checked={!!(form as any)[key]}
                          onCheckedChange={(v) => setForm({ ...form, [key]: !!v })}
                        />
                        <span>{CRITERIA_LABELS[key]}</span>
                        <span className="text-muted-foreground ml-auto">+{(CRITERIA_WEIGHTS as any)[key]}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              {/* Live score */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
                <div>
                  <p className="text-xs text-muted-foreground">Puntuación estimada</p>
                  <p className="text-xl font-bold text-foreground">{formScore} / 100</p>
                </div>
                <Badge className={cn('text-xs', CERT_STYLES[formCert])}>
                  <Award className="h-3 w-3 mr-1" />{formCert.toUpperCase()}
                </Badge>
              </div>

              <Button onClick={handleCreate} disabled={!form.name || createMutation.isPending} className="w-full h-8 text-xs">
                {createMutation.isPending ? 'Guardando...' : 'Crear Punto Seguro'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 rounded" />)}</div>
      ) : (
        <div className="max-h-[400px] overflow-y-auto rounded-md border">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-muted/80 backdrop-blur">
              <tr>
                <th className="text-left p-2 font-medium text-muted-foreground">Nombre</th>
                <th className="text-center p-2 font-medium text-muted-foreground">Tipo</th>
                <th className="text-center p-2 font-medium text-muted-foreground">Score</th>
                <th className="text-center p-2 font-medium text-muted-foreground">Certificación</th>
                <th className="text-center p-2 font-medium text-muted-foreground">Estado</th>
                <th className="text-center p-2 font-medium text-muted-foreground">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(point => (
                <tr key={point.id} className="border-t border-border/50 hover:bg-muted/40 transition-colors">
                  <td className="p-2">
                    <div>
                      <span className="font-medium text-foreground">{point.name}</span>
                      {point.address && <p className="text-[10px] text-muted-foreground truncate max-w-[200px]">{point.address}</p>}
                    </div>
                  </td>
                  <td className="p-2 text-center text-muted-foreground">{TYPE_LABELS[point.type as SafePointType] || point.type}</td>
                  <td className="p-2 text-center font-medium text-foreground">{point.total_score}</td>
                  <td className="p-2 text-center">
                    <Badge variant="outline" className={cn('text-[10px]', CERT_STYLES[point.certification_level as CertificationLevel] || '')}>
                      {(point.certification_level || 'precaucion').toUpperCase()}
                    </Badge>
                  </td>
                  <td className="p-2 text-center">
                    <Badge variant="outline" className={cn('text-[10px]',
                      point.verification_status === 'verified' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      point.verification_status === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                      'bg-muted text-muted-foreground'
                    )}>
                      {point.verification_status}
                    </Badge>
                  </td>
                  <td className="p-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {point.verification_status === 'pending' && (
                        <>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => verifyMutation.mutate({ id: point.id, status: 'verified' })} title="Verificar">
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => verifyMutation.mutate({ id: point.id, status: 'rejected' })} title="Rechazar">
                            <XCircle className="h-3.5 w-3.5 text-red-500" />
                          </Button>
                        </>
                      )}
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteMutation.mutate(point.id)} title="Eliminar">
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Sin puntos seguros registrados</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
