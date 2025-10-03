// @ts-nocheck
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CalendarIcon, Plus, Save, DollarSign, Tag, Radio, FileText, Sparkles } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ExpensePreviewCard } from './ExpensePreviewCard';

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

  // Get preview data
  const selectedCategoria = useMemo(() => 
    categoriasPrincipales.find(c => c.id === formData.categoria_principal_id),
    [categoriasPrincipales, formData.categoria_principal_id]
  );

  const selectedSubcategoria = useMemo(() => 
    subcategorias.find(s => s.id === formData.subcategoria_id),
    [subcategorias, formData.subcategoria_id]
  );

  const selectedCanal = useMemo(() => 
    canales.find(c => c.id === formData.canal_reclutamiento_id),
    [canales, formData.canal_reclutamiento_id]
  );

  const currentStep = useMemo(() => {
    if (!formData.concepto || !formData.monto) return 1;
    if (!formData.categoria_principal_id || !formData.subcategoria_id || !formData.canal_reclutamiento_id) return 2;
    if (!formData.fecha_gasto) return 3;
    return 4;
  }, [formData]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center ring-2 ring-primary/20">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold">Nuevo Gasto</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Registra inversiones en reclutamiento y marketing
                </p>
              </div>
            </div>

            {/* Visual Steps */}
            <div className="flex items-center gap-2 mt-6">
              {[
                { num: 1, label: 'Básico', icon: DollarSign },
                { num: 2, label: 'Categoría', icon: Tag },
                { num: 3, label: 'Fecha', icon: CalendarIcon },
                { num: 4, label: 'Detalles', icon: FileText },
              ].map((step) => {
                const StepIcon = step.icon;
                const isActive = currentStep === step.num;
                const isCompleted = currentStep > step.num;
                
                return (
                  <div key={step.num} className="flex items-center flex-1">
                    <div className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300",
                      isActive && "bg-primary/10 ring-2 ring-primary/30",
                      isCompleted && "bg-green-500/10",
                      !isActive && !isCompleted && "bg-muted/50"
                    )}>
                      <div className={cn(
                        "h-6 w-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors",
                        isActive && "bg-primary text-primary-foreground",
                        isCompleted && "bg-green-500 text-white",
                        !isActive && !isCompleted && "bg-muted text-muted-foreground"
                      )}>
                        {isCompleted ? '✓' : <StepIcon className="h-3 w-3" />}
                      </div>
                      <span className={cn(
                        "text-xs font-medium transition-colors hidden sm:inline",
                        isActive && "text-primary",
                        isCompleted && "text-green-600",
                        !isActive && !isCompleted && "text-muted-foreground"
                      )}>
                        {step.label}
                      </span>
                    </div>
                    {step.num < 4 && (
                      <div className={cn(
                        "h-[2px] flex-1 mx-1 transition-colors",
                        currentStep > step.num ? "bg-green-500/50" : "bg-border"
                      )} />
                    )}
                  </div>
                );
              })}
            </div>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Paso 1: Información básica */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-sm">Información Básica</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="concepto" className="text-sm font-medium flex items-center gap-2">
                      Concepto *
                    </Label>
                    <div className="relative">
                      <Input
                        id="concepto"
                        value={formData.concepto}
                        onChange={(e) => updateField('concepto', e.target.value)}
                        placeholder="Ej: Campaña Facebook Q1 2025"
                        className="h-11 pl-3"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="monto" className="text-sm font-medium flex items-center gap-2">
                      Monto (MXN) *
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="monto"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.monto || ''}
                        onChange={(e) => updateField('monto', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className="h-11 pl-9"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Paso 2: Categorización */}
              <div className="space-y-4 pt-6 border-t">
                <div className="flex items-center gap-2 pb-2">
                  <Tag className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-sm">Categorización</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Categoría Principal *</Label>
                    <Select 
                      onValueChange={(value) => updateField('categoria_principal_id', value)}
                      value={formData.categoria_principal_id}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Selecciona categoría" />
                      </SelectTrigger>
                      <SelectContent className="z-50 bg-background/95 backdrop-blur-sm border shadow-lg">
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
                      key={`subcategoria-${formData.categoria_principal_id}`}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Selecciona subcategoría" />
                      </SelectTrigger>
                      <SelectContent className="z-50 bg-background/95 backdrop-blur-sm border shadow-lg">
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
                    <Select 
                      onValueChange={(value) => updateField('canal_reclutamiento_id', value)}
                      value={formData.canal_reclutamiento_id}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Selecciona canal" />
                      </SelectTrigger>
                      <SelectContent className="z-50 bg-background/95 backdrop-blur-sm border shadow-lg max-h-80">
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
              </div>

              {/* Paso 3: Fecha del gasto */}
              <div className="space-y-4 pt-6 border-t">
                <div className="flex items-center gap-2 pb-2">
                  <CalendarIcon className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-sm">Fecha del Gasto</h3>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Fecha *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "h-11 w-full justify-start text-left font-normal",
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
              </div>

              {/* Paso 4: Descripción */}
              <div className="space-y-4 pt-6 border-t">
                <div className="flex items-center gap-2 pb-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-sm">Detalles Adicionales</h3>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="descripcion" className="text-sm font-medium">
                    Descripción (Opcional)
                  </Label>
                  <Textarea
                    id="descripcion"
                    value={formData.descripcion}
                    onChange={(e) => updateField('descripcion', e.target.value)}
                    placeholder="Detalles adicionales sobre este gasto..."
                    className="min-h-[100px] resize-none"
                  />
                </div>
              </div>

              {/* Botón de envío */}
              <div className="flex justify-end pt-6">
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="min-w-[160px] h-11 shadow-lg"
                  size="lg"
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
      </div>

      {/* Preview Card - Right Sidebar */}
      <div className="lg:col-span-1">
        <div className="sticky top-6">
          <ExpensePreviewCard
            concepto={formData.concepto}
            monto={formData.monto}
            categoria={selectedCategoria?.nombre || ''}
            subcategoria={selectedSubcategoria?.nombre || ''}
            canal={selectedCanal?.nombre || ''}
            fecha={formData.fecha_gasto}
            descripcion={formData.descripcion}
          />
        </div>
      </div>
    </div>
  );
};