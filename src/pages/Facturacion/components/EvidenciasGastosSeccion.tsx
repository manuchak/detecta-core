import React, { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  useEvidenciasGastos,
  useCrearEvidencia,
  useEliminarEvidencia,
  useVerificarEvidencia,
  TIPOS_GASTO,
  TipoGasto,
} from '../hooks/useEvidenciasGastos';
import { useAuth } from '@/contexts/AuthContext';
import {
  Receipt,
  Plus,
  Trash2,
  Upload,
  CheckCircle2,
  ExternalLink,
  X,
  Loader2,
  FileText,
  ImageIcon,
} from 'lucide-react';
import { formatCurrency } from '@/utils/formatUtils';

interface EvidenciasGastosSeccionProps {
  servicioId: number;
}

export function EvidenciasGastosSeccion({ servicioId }: EvidenciasGastosSeccionProps) {
  const { user } = useAuth();
  const { data: evidencias = [], isLoading } = useEvidenciasGastos(servicioId);
  const crearMutation = useCrearEvidencia();
  const eliminarMutation = useEliminarEvidencia();
  const verificarMutation = useVerificarEvidencia();
  const [showForm, setShowForm] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Form state
  const [tipo, setTipo] = useState<TipoGasto>('caseta');
  const [descripcion, setDescripcion] = useState('');
  const [monto, setMonto] = useState('');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [cobrableCliente, setCobrableCliente] = useState(false);
  const [pagableCustodio, setPagableCustodio] = useState(true);
  const [notas, setNotas] = useState('');

  const resetForm = () => {
    setTipo('caseta');
    setDescripcion('');
    setMonto('');
    setArchivo(null);
    setCobrableCliente(false);
    setPagableCustodio(true);
    setNotas('');
    setShowForm(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleSubmit = () => {
    if (!monto || parseFloat(monto) <= 0) return;

    crearMutation.mutate(
      {
        servicio_id: servicioId,
        tipo_gasto: tipo,
        descripcion,
        monto: parseFloat(monto),
        archivo: archivo || undefined,
        cobrable_cliente: cobrableCliente,
        pagable_custodio: pagableCustodio,
        notas,
      },
      { onSuccess: resetForm }
    );
  };

  const totalMonto = evidencias.reduce((acc, e) => acc + e.monto, 0);
  const totalVerificadas = evidencias.filter((e) => e.verificado).length;

  const getFileIcon = (nombre: string | null) => {
    if (!nombre) return <FileText className="h-3 w-3" />;
    if (nombre.match(/\.(jpg|jpeg|png|webp)$/i)) return <ImageIcon className="h-3 w-3" />;
    return <FileText className="h-3 w-3" />;
  };

  return (
    <Card className="border-border/50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm text-foreground">Evidencias de Gastos</h3>
            {evidencias.length > 0 && (
              <Badge variant="secondary" className="text-[10px]">
                {evidencias.length} • {formatCurrency(totalMonto)}
              </Badge>
            )}
            {evidencias.length > 0 && (
              <Badge
                variant={totalVerificadas === evidencias.length ? 'default' : 'outline'}
                className="text-[10px]"
              >
                {totalVerificadas}/{evidencias.length} verificadas
              </Badge>
            )}
          </div>
          {!showForm && (
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setShowForm(true)}>
              <Plus className="h-3 w-3 mr-1" />
              Agregar
            </Button>
          )}
        </div>

        {/* Lista de evidencias */}
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : evidencias.length === 0 && !showForm ? (
          <p className="text-xs text-muted-foreground text-center py-3">
            Sin evidencias de gastos registradas
          </p>
        ) : (
          <div className="space-y-2">
            {evidencias.map((ev) => (
              <div
                key={ev.id}
                className="flex items-center justify-between gap-3 p-2 rounded-lg bg-muted/30 text-xs"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    {TIPOS_GASTO[ev.tipo_gasto as TipoGasto] || ev.tipo_gasto}
                  </Badge>
                  <span className="font-medium shrink-0">{formatCurrency(ev.monto)}</span>
                  {ev.descripcion && (
                    <span className="truncate text-muted-foreground">{ev.descripcion}</span>
                  )}
                  {ev.archivo_url && (
                    <a
                      href={ev.archivo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary hover:underline shrink-0"
                    >
                      {getFileIcon(ev.archivo_nombre)}
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {ev.cobrable_cliente && (
                    <Badge className="text-[9px] bg-primary/10 text-primary border-primary/20">
                      Cobrable
                    </Badge>
                  )}
                  {ev.verificado ? (
                    <Badge variant="default" className="text-[9px]">
                      <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
                      Verificada
                    </Badge>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 text-[10px] px-2"
                      onClick={() =>
                        verificarMutation.mutate({
                          id: ev.id,
                          servicioId,
                          verificadoPor: user?.email || 'sistema',
                        })
                      }
                      disabled={verificarMutation.isPending}
                    >
                      Verificar
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => eliminarMutation.mutate({ id: ev.id, servicioId })}
                    disabled={eliminarMutation.isPending}
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Formulario nueva evidencia */}
        {showForm && (
          <>
            <Separator className="my-3" />
            <div className="space-y-3 bg-muted/20 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium">Nueva Evidencia de Gasto</p>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={resetForm}>
                  <X className="h-3 w-3" />
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-[10px]">Tipo de Gasto</Label>
                  <Select value={tipo} onValueChange={(v) => setTipo(v as TipoGasto)}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(TIPOS_GASTO).map(([key, label]) => (
                        <SelectItem key={key} value={key} className="text-xs">
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Monto (MXN)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                    placeholder="$0.00"
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Descripción</Label>
                  <Input
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    placeholder="Descripción del gasto"
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1 col-span-1">
                  <Label className="text-[10px]">Evidencia (archivo)</Label>
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => setArchivo(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs w-full"
                      onClick={() => fileRef.current?.click()}
                    >
                      <Upload className="h-3 w-3 mr-1" />
                      {archivo ? archivo.name : 'Subir archivo'}
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-2 rounded bg-muted/30">
                  <Switch checked={cobrableCliente} onCheckedChange={setCobrableCliente} />
                  <Label className="text-[10px]">Cobrar a cliente</Label>
                </div>
                <div className="flex items-center gap-3 p-2 rounded bg-muted/30">
                  <Switch checked={pagableCustodio} onCheckedChange={setPagableCustodio} />
                  <Label className="text-[10px]">Pagar a custodio</Label>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  size="sm"
                  className="h-7 text-xs"
                  onClick={handleSubmit}
                  disabled={!monto || parseFloat(monto) <= 0 || crearMutation.isPending}
                >
                  {crearMutation.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <Plus className="h-3 w-3 mr-1" />
                  )}
                  Registrar Evidencia
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
