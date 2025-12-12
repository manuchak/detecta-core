import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  DollarSign, Receipt, Truck, MapPin, User, HelpCircle,
  Upload, X, Send, Loader2, ImageIcon
} from 'lucide-react';
import { useTicketCategories } from '@/hooks/useTicketCategories';
import { useCustodianTicketsEnhanced, CreateTicketData } from '@/hooks/useCustodianTicketsEnhanced';
import { cn } from '@/lib/utils';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  DollarSign,
  Receipt,
  Truck,
  MapPin,
  User,
  HelpCircle
};

const colorMap: Record<string, string> = {
  green: 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200',
  amber: 'bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-200',
  blue: 'bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200',
  purple: 'bg-purple-100 text-purple-700 border-purple-300 hover:bg-purple-200',
  slate: 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200',
  gray: 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
};

interface CreateCustodianTicketFormProps {
  custodianPhone: string;
  onSuccess?: () => void;
}

export const CreateCustodianTicketForm = ({ custodianPhone, onSuccess }: CreateCustodianTicketFormProps) => {
  const { categorias, subcategorias, getSubcategoriasByCategoria, getCategoriaById, loading: loadingCategories } = useTicketCategories();
  const { createTicket } = useCustodianTicketsEnhanced(custodianPhone);
  
  const [selectedCategoria, setSelectedCategoria] = useState<string>('');
  const [selectedSubcategoria, setSelectedSubcategoria] = useState<string>('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [monto, setMonto] = useState<string>('');
  const [servicioId, setServicioId] = useState('');
  const [priority, setPriority] = useState<'baja' | 'media' | 'alta' | 'urgente'>('media');
  const [evidencias, setEvidencias] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedCategoriaData = selectedCategoria ? getCategoriaById(selectedCategoria) : null;
  const filteredSubcategorias = selectedCategoria ? getSubcategoriasByCategoria(selectedCategoria) : [];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + evidencias.length > 5) {
      return; // Max 5 files
    }
    setEvidencias(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setEvidencias(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCategoria || !subject.trim() || !description.trim()) return;

    setSubmitting(true);
    try {
      const ticketData: CreateTicketData = {
        subject: subject.trim(),
        description: description.trim(),
        categoria_custodio_id: selectedCategoria,
        subcategoria_custodio_id: selectedSubcategoria || undefined,
        servicio_id: servicioId || undefined,
        monto_reclamado: monto ? parseFloat(monto) : undefined,
        priority
      };

      const result = await createTicket(ticketData, evidencias);
      
      if (result) {
        // Reset form
        setSelectedCategoria('');
        setSelectedSubcategoria('');
        setSubject('');
        setDescription('');
        setMonto('');
        setServicioId('');
        setPriority('media');
        setEvidencias([]);
        onSuccess?.();
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingCategories) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Crear Nuevo Ticket
        </CardTitle>
        <CardDescription>
          Selecciona una categoría y describe tu problema o solicitud
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Categoría Selection */}
          <div className="space-y-3">
            <Label>Categoría *</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {categorias.map(cat => {
                const Icon = iconMap[cat.icono] || HelpCircle;
                const isSelected = selectedCategoria === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategoria(cat.id);
                      setSelectedSubcategoria('');
                    }}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all",
                      isSelected 
                        ? colorMap[cat.color] + ' border-current ring-2 ring-offset-2'
                        : 'border-border hover:border-muted-foreground/50'
                    )}
                  >
                    <Icon className="h-6 w-6" />
                    <span className="text-sm font-medium text-center">{cat.nombre}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subcategoría Selection */}
          {filteredSubcategorias.length > 0 && (
            <div className="space-y-2">
              <Label>Subcategoría</Label>
              <Select value={selectedSubcategoria} onValueChange={setSelectedSubcategoria}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un tipo específico (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {filteredSubcategorias.map(sub => (
                    <SelectItem key={sub.id} value={sub.id}>
                      {sub.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Asunto *</Label>
            <Input
              id="subject"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Resumen breve de tu solicitud"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descripción *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe con detalle tu problema o solicitud..."
              rows={4}
              required
            />
          </div>

          {/* Conditional Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedCategoriaData?.requiere_monto && (
              <div className="space-y-2">
                <Label htmlFor="monto">Monto Reclamado (MXN)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="monto"
                    type="number"
                    step="0.01"
                    min="0"
                    value={monto}
                    onChange={e => setMonto(e.target.value)}
                    placeholder="0.00"
                    className="pl-9"
                  />
                </div>
              </div>
            )}

            {selectedCategoriaData?.requiere_servicio && (
              <div className="space-y-2">
                <Label htmlFor="servicio">ID del Servicio</Label>
                <Input
                  id="servicio"
                  value={servicioId}
                  onChange={e => setServicioId(e.target.value)}
                  placeholder="Ej: SVC-12345"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Prioridad</Label>
              <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baja">Baja</SelectItem>
                  <SelectItem value="media">Media</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Evidence Upload */}
          <div className="space-y-3">
            <Label>Evidencias (opcional)</Label>
            <div className="flex flex-wrap gap-3">
              {evidencias.map((file, index) => (
                <div
                  key={index}
                  className="relative group flex items-center gap-2 px-3 py-2 bg-muted rounded-md"
                >
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm truncate max-w-[120px]">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              
              {evidencias.length < 5 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-muted-foreground/30 rounded-md hover:border-muted-foreground/50 transition-colors"
                >
                  <Upload className="h-4 w-4" />
                  <span className="text-sm">Subir archivo</span>
                </button>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Máximo 5 archivos. Formatos: JPG, PNG, PDF (5MB máx. por archivo)
            </p>
          </div>

          {/* SLA Info */}
          {selectedCategoriaData && (
            <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
              <Badge variant="outline">
                Respuesta estimada: {selectedCategoriaData.sla_horas_respuesta}h
              </Badge>
              <Badge variant="outline">
                Resolución estimada: {selectedCategoriaData.sla_horas_resolucion}h
              </Badge>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={!selectedCategoria || !subject.trim() || !description.trim() || submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Enviar Ticket
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
