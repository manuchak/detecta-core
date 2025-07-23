import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CalendarIcon, Plus, Save } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ExpenseData {
  concepto: string;
  monto: number;
  categoria_id: string;
  canal_reclutamiento: string;
  fecha_gasto: Date | undefined;
  descripcion: string;
}

interface Category {
  id: string;
  nombre: string;
}

const channels = [
  'Digital',
  'Referidos',
  'Directo',
  'Agencias',
  'Eventos',
  'Otros'
];

export const ExpenseForm: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState<ExpenseData>({
    concepto: '',
    monto: 0,
    categoria_id: '',
    canal_reclutamiento: '',
    fecha_gasto: undefined,
    descripcion: ''
  });

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from('categorias_gastos')
        .select('id, nombre')
        .order('nombre');
      
      if (!error && data) {
        setCategories(data);
      }
    };

    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.concepto || !formData.monto || !formData.fecha_gasto) {
      toast({
        title: "Error",
        description: "Por favor completa los campos obligatorios",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('gastos_externos')
        .insert([{
          concepto: formData.concepto,
          monto: formData.monto,
          categoria_id: formData.categoria_id || null,
          canal_reclutamiento: formData.canal_reclutamiento || null,
          fecha_gasto: formData.fecha_gasto.toISOString().split('T')[0],
          descripcion: formData.descripcion || null,
          estado: 'pendiente',
          registrado_por: userData.user?.id
        }]);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Gasto registrado correctamente"
      });
      
      // Reset form
      setFormData({
        concepto: '',
        monto: 0,
        categoria_id: '',
        canal_reclutamiento: '',
        fecha_gasto: undefined,
        descripcion: ''
      });
      
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Error al registrar el gasto",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof ExpenseData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="px-0 pb-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Plus className="h-4 w-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg font-medium">Nuevo Gasto de Reclutamiento</CardTitle>
            <p className="text-sm text-muted-foreground">
              Registra inversiones en marketing y reclutamiento
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="px-0">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información básica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="concepto" className="text-sm font-medium">
                Concepto *
              </Label>
              <Input
                id="concepto"
                value={formData.concepto}
                onChange={(e) => updateField('concepto', e.target.value)}
                placeholder="Ej: Campaña Facebook Q1 2025"
                className="h-10"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="monto" className="text-sm font-medium">
                Monto (MXN) *
              </Label>
              <Input
                id="monto"
                type="number"
                min="0"
                step="0.01"
                value={formData.monto || ''}
                onChange={(e) => updateField('monto', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="h-10"
              />
            </div>
          </div>

          {/* Categorización */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Categoría</Label>
              <Select onValueChange={(value) => updateField('categoria_id', value)}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Selecciona categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">Canal de Reclutamiento</Label>
              <Select onValueChange={(value) => updateField('canal_reclutamiento', value)}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Selecciona canal" />
                </SelectTrigger>
                <SelectContent>
                  {channels.map((channel) => (
                    <SelectItem key={channel} value={channel}>
                      {channel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Fecha del gasto */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Fecha del Gasto *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "h-10 w-full justify-start text-left font-normal",
                    !formData.fecha_gasto && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.fecha_gasto ? (
                    format(formData.fecha_gasto, "PPP", { locale: es })
                  ) : (
                    <span>Seleccionar fecha</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.fecha_gasto}
                  onSelect={(date) => updateField('fecha_gasto', date)}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <Label htmlFor="descripcion" className="text-sm font-medium">
              Descripción adicional
            </Label>
            <Textarea
              id="descripcion"
              value={formData.descripcion}
              onChange={(e) => updateField('descripcion', e.target.value)}
              placeholder="Detalles adicionales sobre este gasto..."
              className="min-h-[80px] resize-none"
            />
          </div>

          {/* Botón de envío */}
          <div className="flex justify-end pt-4">
            <Button 
              type="submit" 
              disabled={loading}
              className="min-w-[120px]"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Registrar Gasto
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};