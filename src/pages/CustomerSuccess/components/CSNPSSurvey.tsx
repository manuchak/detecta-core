import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useCSNPS, useCreateCSNPS, useNPSStats } from '@/hooks/useCSNPS';
import { useCSCartera } from '@/hooks/useCSCartera';
import { Plus, ThumbsUp, Minus, ThumbsDown } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

function NPSScoreBar({ promotores, pasivos, detractores, total }: { promotores: number; pasivos: number; detractores: number; total: number }) {
  if (total === 0) return null;
  const pPct = (promotores / total) * 100;
  const paPct = (pasivos / total) * 100;
  const dPct = (detractores / total) * 100;

  return (
    <div className="w-full h-6 rounded-full overflow-hidden flex text-[10px] font-medium">
      {dPct > 0 && (
        <div className="bg-red-500 text-white flex items-center justify-center" style={{ width: `${dPct}%` }}>
          {detractores}
        </div>
      )}
      {paPct > 0 && (
        <div className="bg-amber-400 text-black flex items-center justify-center" style={{ width: `${paPct}%` }}>
          {pasivos}
        </div>
      )}
      {pPct > 0 && (
        <div className="bg-green-500 text-white flex items-center justify-center" style={{ width: `${pPct}%` }}>
          {promotores}
        </div>
      )}
    </div>
  );
}

export function CSNPSSurvey() {
  const { data: entries, isLoading } = useCSNPS();
  const { data: cartera } = useCSCartera();
  const createNPS = useCreateCSNPS();
  const stats = useNPSStats();

  const [showForm, setShowForm] = useState(false);
  const [clienteId, setClienteId] = useState('');
  const [score, setScore] = useState<number | null>(null);
  const [comentario, setComentario] = useState('');
  const [canal, setCanal] = useState('email');

  const currentPeriodo = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const activeClients = useMemo(() => {
    return (cartera || []).filter(c => c.activo).sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [cartera]);

  const handleSubmit = () => {
    if (!clienteId || score === null) return;
    createNPS.mutate({
      cliente_id: clienteId,
      periodo: currentPeriodo,
      score,
      comentario: comentario.trim() || undefined,
      canal,
    }, {
      onSuccess: () => {
        setShowForm(false);
        setClienteId('');
        setScore(null);
        setComentario('');
      },
    });
  };

  if (isLoading) {
    return <Skeleton className="h-64 mt-4" />;
  }

  return (
    <div className="space-y-4 mt-4">
      {/* NPS Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">NPS Score</p>
            <p className={`text-4xl font-bold ${stats.nps === null ? 'text-muted-foreground' : stats.nps >= 50 ? 'text-green-600' : stats.nps >= 0 ? 'text-amber-600' : 'text-red-600'}`}>
              {stats.nps !== null ? stats.nps : '—'}
            </p>
            <p className="text-xs text-muted-foreground">{stats.total} respuestas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <ThumbsUp className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-2xl font-bold">{stats.promotores}</p>
              <p className="text-xs text-muted-foreground">Promotores (9-10)</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Minus className="h-5 w-5 text-amber-500" />
            <div>
              <p className="text-2xl font-bold">{stats.pasivos}</p>
              <p className="text-xs text-muted-foreground">Pasivos (7-8)</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <ThumbsDown className="h-5 w-5 text-red-500" />
            <div>
              <p className="text-2xl font-bold">{stats.detractores}</p>
              <p className="text-xs text-muted-foreground">Detractores (0-6)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Distribution bar */}
      {stats.total > 0 && (
        <NPSScoreBar
          promotores={stats.promotores}
          pasivos={stats.pasivos}
          detractores={stats.detractores}
          total={stats.total}
        />
      )}

      {/* Actions */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {entries?.length || 0} encuestas registradas
        </p>
        <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5">
          <Plus className="h-4 w-4" /> Registrar NPS
        </Button>
      </div>

      {/* Recent entries */}
      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {(entries || []).slice(0, 20).map(entry => (
              <div key={entry.id} className="flex items-center justify-between p-3 text-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <Badge
                    variant={entry.score >= 9 ? 'default' : entry.score >= 7 ? 'secondary' : 'destructive'}
                    className="text-xs min-w-[2rem] justify-center"
                  >
                    {entry.score}
                  </Badge>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{entry.cliente?.nombre || '—'}</p>
                    {entry.comentario && (
                      <p className="text-xs text-muted-foreground truncate">{entry.comentario}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className="text-[10px] capitalize">{entry.canal}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(entry.created_at), 'dd MMM', { locale: es })}
                  </span>
                </div>
              </div>
            ))}
            {(!entries || entries.length === 0) && (
              <div className="p-8 text-center text-muted-foreground text-sm">
                Sin encuestas NPS registradas
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Register NPS Dialog */}
      <Dialog open={showForm} onOpenChange={open => { if (!open) setShowForm(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Encuesta NPS</DialogTitle>
            <DialogDescription>Registra la puntuación NPS (0-10) de un cliente para el periodo {currentPeriodo}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Cliente <span className="text-destructive">*</span></label>
              <Select value={clienteId} onValueChange={setClienteId}>
                <SelectTrigger><SelectValue placeholder="Seleccionar cliente..." /></SelectTrigger>
                <SelectContent>
                  {activeClients.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Score NPS (0-10) <span className="text-destructive">*</span></label>
              <div className="flex gap-1 mt-2">
                {[0,1,2,3,4,5,6,7,8,9,10].map(n => (
                  <button
                    key={n}
                    onClick={() => setScore(n)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium border transition-colors ${
                      score === n
                        ? n >= 9 ? 'bg-green-500 text-white border-green-600'
                        : n >= 7 ? 'bg-amber-400 text-black border-amber-500'
                        : 'bg-red-500 text-white border-red-600'
                        : 'bg-secondary hover:bg-accent border-border'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1 px-1">
                <span>Detractor</span>
                <span>Pasivo</span>
                <span>Promotor</span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Canal</label>
              <Select value={canal} onValueChange={setCanal}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="llamada">Llamada</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="presencial">Presencial</SelectItem>
                  <SelectItem value="formulario">Formulario</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Comentario</label>
              <Textarea
                placeholder="Comentario opcional del cliente..."
                value={comentario}
                onChange={e => setComentario(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={!clienteId || score === null || createNPS.isPending}>
              {createNPS.isPending ? 'Guardando...' : 'Registrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
