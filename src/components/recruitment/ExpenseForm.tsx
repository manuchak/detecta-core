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
  categoria_principal_id: string;
  subcategoria_id: string;
  canal_reclutamiento_id: string;
  fecha_gasto: Date | undefined;
  descripcion: string;
}

interface CategoriaPrincipal {
  id: string;
  nombre: string;
  descripcion: string;
  icono: string;
  color: string;
}

interface Subcategoria {
  id: string;
  categoria_principal_id: string;
  nombre: string;
  descripcion: string;
  codigo: string;
}

interface Canal {
  id: string;
  nombre: string;
  descripcion: string;
  tipo: string;
}

export const ExpenseForm: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [categoriasPrincipales, setCategoriasPrincipales] = useState<CategoriaPrincipal[]>([]);
  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([]);
  const [canales, setCanales] = useState<Canal[]>([]);
  const [subcategoriasFiltradas, setSubcategoriasFiltradas] = useState<Subcategoria[]>([]);
  
  const [formData, setFormData] = useState<ExpenseData>({
    concepto: '',
    monto: 0,
    categoria_principal_id: '',
    subcategoria_id: '',
    canal_reclutamiento_id: '',
    fecha_gasto: undefined,
    descripcion: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      // Cargar categorías principales
      const { data: categoriasData, error: categoriasError } = await supabase
        .from('categorias_principales')
        .select('id, nombre, descripcion, icono, color')
        .eq('activo', true)
        .order('orden');
      
      if (!categoriasError && categoriasData) {
        setCategoriasPrincipales(categoriasData);
      }

      // Cargar subcategorías
      const { data: subcategoriasData, error: subcategoriasError } = await supabase
        .from('subcategorias_gastos')
        .select('id, categoria_principal_id, nombre, descripcion, codigo')
        .eq('activo', true)
        .order('orden');
      
      if (!subcategoriasError && subcategoriasData) {
        setSubcategorias(subcategoriasData);
      }

      // Cargar canales
      const { data: canalesData, error: canalesError } = await supabase
        .from('canales_reclutamiento')
        .select('id, nombre, descripcion, tipo')
        .eq('activo', true)
        .order('orden');
      
      if (!canalesError && canalesData) {
        setCanales(canalesData);
      }
    };

    fetchData();
  }, []);

  // Filtrar subcategorías cuando cambia la categoría principal
  useEffect(() => {
    if (formData.categoria_principal_id) {
      const filtered = subcategorias.filter(
        sub => sub.categoria_principal_id === formData.categoria_principal_id
      );
      setSubcategoriasFiltradas(filtered);
      // Limpiar subcategoría si no coincide con la nueva categoría principal
      if (formData.subcategoria_id && !filtered.some(sub => sub.id === formData.subcategoria_id)) {
        setFormData(prev => ({ ...prev, subcategoria_id: '' }));
      }
    } else {
      setSubcategoriasFiltradas([]);
      setFormData(prev => ({ ...prev, subcategoria_id: '' }));
    }
  }, [formData.categoria_principal_id, subcategorias]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.concepto || !formData.monto || !formData.fecha_gasto || 
        !formData.categoria_principal_id || !formData.subcategoria_id || !formData.canal_reclutamiento_id) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos obligatorios",
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
          categoria_principal_id: formData.categoria_principal_id,
          subcategoria_id: formData.subcategoria_id,
          canal_reclutamiento_id: formData.canal_reclutamiento_id,
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
        categoria_principal_id: '',
        subcategoria_id: '',
        canal_reclutamiento_id: '',
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

          {/* Sistema jerárquico de categorización */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Categoría Principal *</Label>
              <Select onValueChange={(value) => updateField('categoria_principal_id', value)}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Selecciona categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categoriasPrincipales.map((categoria) => (
                    <SelectItem key={categoria.id} value={categoria.id}>
                      <div className="flex items-center gap-2">
                        <span>{categoria.icono}</span>
                        <span>{categoria.nombre}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Subcategoría *</Label>
              <Select 
                onValueChange={(value) => updateField('subcategoria_id', value)}
                disabled={!formData.categoria_principal_id}
                value={formData.subcategoria_id}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Selecciona subcategoría" />
                </SelectTrigger>
                <SelectContent>
                  {subcategoriasFiltradas.map((subcategoria) => (
                    <SelectItem key={subcategoria.id} value={subcategoria.id}>
                      {subcategoria.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Canal de Reclutamiento *</Label>
              <Select onValueChange={(value) => updateField('canal_reclutamiento_id', value)}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Selecciona canal" />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  {['digital', 'referidos', 'directo', 'agencias', 'eventos', 'tradicional'].map((tipo) => {
                    const canalesDelTipo = canales.filter(canal => canal.tipo === tipo);
                    if (canalesDelTipo.length === 0) return null;
                    
                    return (
                      <div key={tipo}>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide bg-muted/30">
                          {tipo === 'digital' ? '💻 Digital' :
                           tipo === 'referidos' ? '👥 Referidos' :
                           tipo === 'directo' ? '🎯 Directo' :
                           tipo === 'agencias' ? '🏢 Agencias' :
                           tipo === 'eventos' ? '🎪 Eventos' : '📻 Tradicional'}
                        </div>
                        {canalesDelTipo.map((canal) => (
                          <SelectItem key={canal.id} value={canal.id} className="pl-4">
                            {canal.nombre}
                          </SelectItem>
                        ))}
                      </div>
                    );
                  })}
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
              <PopoverContent className="w-auto p-0 z-50 bg-background border border-border shadow-lg" align="start">
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