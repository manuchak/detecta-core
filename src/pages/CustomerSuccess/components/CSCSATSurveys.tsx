import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useCSCSATSurveys, useCreateCSAT, useCSATStats } from '@/hooks/useCSCSAT';
import { useCSCartera } from '@/hooks/useCSCartera';
import { Plus, Star, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

function CSATBar({ distribución, total }: { distribución: number[]; total: number }) {
  if (total === 0) return null;
  const colors = ['bg-red-500', 'bg-orange-400', 'bg-amber-400', 'bg-lime-400', 'bg-green-500'];
  return (
    <div className="w-full h-6 rounded-full overflow-hidden flex text-[10px] font-medium">
      {distribución.map((count, i) => {
        const pct = (count / total) * 100;
        if (pct === 0) return null;
        return (
          <div key={i} className={`${colors[i]} text-white flex items-center justify-center`} style={{ width: `${pct}%` }}>
            {count}
          </div>
        );
      })}
    </div>
  );
}

function ScoreStars({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' }) {
  const sz = size === 'sm' ? 'h-3.5 w-3.5' : 'h-5 w-5';
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <Star key={n} className={`${sz} ${n <= score ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`} />
      ))}
    </div>
  );
}

export function CSCSATSurveys() {
  const { data: surveys, isLoading } = useCSCSATSurveys();
  const { data: cartera } = useCSCartera();
  const createCSAT = useCreateCSAT();
  const stats = useCSATStats();

  const [showForm, setShowForm] = useState(false);
  const [clienteId, setClienteId] = useState('');
  const [score, setScore] = useState<number | null>(null);
  const [contexto, setContexto] = useState('periodico');
  const [canal, setCanal] = useState('email');
  const [comentario, setComentario] = useState('');

  const activeClients = useMemo(() => {
    return (cartera || []).filter(c => c.activo).sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [cartera]);

  const handleSubmit = () => {
    if (!clienteId || score === null) return;
    createCSAT.mutate({
      cliente_id: clienteId,
      score,
      contexto,
      canal,
      comentario: comentario.trim() || undefined,
    }, {
      onSuccess: () => {
        setShowForm(false);
        setClienteId('');
        setScore(null);
        setComentario('');
      },
    });
  };

  if (isLoading) return <Skeleton className="h-64 mt-4" />;

  return (
    <div className="space-y-4 mt-4">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">CSAT Promedio</p>
            <p className={`text-4xl font-bold ${stats.promedio === null ? 'text-muted-foreground' : stats.promedio >= 4 ? 'text-green-600' : stats.promedio >= 3 ? 'text-amber-600' : 'text-red-600'}`}>
              {stats.promedio !== null ? stats.promedio : '—'}
            </p>
            <p className="text-xs text-muted-foreground">{stats.total} encuestas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
            <div>
              <p className="text-2xl font-bold">{stats.distribución[4] + stats.distribución[3]}</p>
              <p className="text-xs text-muted-foreground">Satisfechos (4-5)</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold">{stats.distribución[0] + stats.distribución[1]}</p>
              <p className="text-xs text-muted-foreground">Insatisfechos (1-2)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Distribution bar */}
      {stats.total > 0 && (
        <div className="space-y-1">
          <CSATBar distribución={stats.distribución} total={stats.total} />
          <div className="flex justify-between text-[10px] text-muted-foreground px-1">
            <span>1 ★</span><span>2 ★</span><span>3 ★</span><span>4 ★</span><span>5 ★</span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{surveys?.length || 0} encuestas registradas</p>
        <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5">
          <Plus className="h-4 w-4" /> Registrar CSAT
        </Button>
      </div>

      {/* Recent entries */}
      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {(surveys || []).slice(0, 30).map(entry => (
              <div key={entry.id} className="flex items-center justify-between p-3 text-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <ScoreStars score={entry.score} size="sm" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{entry.cliente?.nombre || '—'}</p>
                    {entry.comentario && (
                      <p className="text-xs text-muted-foreground truncate">{entry.comentario}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className="text-[10px] capitalize">{entry.contexto}</Badge>
                  <Badge variant="outline" className="text-[10px] capitalize">{entry.canal}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(entry.created_at), 'dd MMM', { locale: es })}
                  </span>
                </div>
              </div>
            ))}
            {(!surveys || surveys.length === 0) && (
              <div className="p-8 text-center text-muted-foreground text-sm">
                Sin encuestas CSAT registradas
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Register CSAT Dialog */}
      <Dialog open={showForm} onOpenChange={open => { if (!open) setShowForm(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Encuesta CSAT</DialogTitle>
            <DialogDescription>Registra la satisfacción (1-5 estrellas) de un cliente.</DialogDescription>
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
              <label className="text-sm font-medium">Puntuación CSAT <span className="text-destructive">*</span></label>
              <div className="flex gap-2 mt-2 justify-center">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    onClick={() => setScore(n)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star className={`h-10 w-10 ${score !== null && n <= score ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30 hover:text-muted-foreground/60'}`} />
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1 px-4">
                <span>Muy insatisfecho</span>
                <span>Muy satisfecho</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Contexto</label>
                <Select value={contexto} onValueChange={setContexto}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="periodico">Periódico</SelectItem>
                    <SelectItem value="post-servicio">Post-servicio</SelectItem>
                    <SelectItem value="ad-hoc">Ad-hoc</SelectItem>
                    <SelectItem value="renovacion">Renovación</SelectItem>
                  </SelectContent>
                </Select>
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
            <Button onClick={handleSubmit} disabled={!clienteId || score === null || createCSAT.isPending}>
              {createCSAT.isPending ? 'Guardando...' : 'Registrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
