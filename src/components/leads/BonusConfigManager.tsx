
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Save, DollarSign, Calendar, Activity } from "lucide-react";

interface BonusConfig {
  id: string;
  nombre: string;
  descripcion: string;
  monto_bono: number;
  dias_minimos_permanencia: number;
  servicios_minimos_requeridos: number;
  activo: boolean;
}

export const BonusConfigManager = () => {
  const [config, setConfig] = useState<BonusConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('configuracion_bonos_referidos')
        .select('*')
        .eq('activo', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setConfig(data);
      } else {
        // Crear configuración por defecto si no existe
        const defaultConfig = {
          nombre: 'Configuración de Bonos por Referidos',
          descripcion: 'Configuración para otorgar bonos a custodios que refieran nuevos candidatos exitosos',
          monto_bono: 1000,
          dias_minimos_permanencia: 90, // 3 meses
          servicios_minimos_requeridos: 15,
          activo: true
        };
        setConfig({ id: '', ...defaultConfig });
      }
    } catch (error) {
      console.error('Error fetching config:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar la configuración.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    if (!config) return;

    try {
      setSaving(true);
      
      let result;
      if (config.id) {
        // Actualizar configuración existente
        result = await supabase
          .from('configuracion_bonos_referidos')
          .update({
            nombre: config.nombre,
            descripcion: config.descripcion,
            monto_bono: config.monto_bono,
            dias_minimos_permanencia: config.dias_minimos_permanencia,
            servicios_minimos_requeridos: config.servicios_minimos_requeridos,
            activo: config.activo,
            updated_at: new Date().toISOString()
          })
          .eq('id', config.id)
          .select()
          .single();
      } else {
        // Crear nueva configuración
        result = await supabase
          .from('configuracion_bonos_referidos')
          .insert({
            nombre: config.nombre,
            descripcion: config.descripcion,
            monto_bono: config.monto_bono,
            dias_minimos_permanencia: config.dias_minimos_permanencia,
            servicios_minimos_requeridos: config.servicios_minimos_requeridos,
            activo: config.activo
          })
          .select()
          .single();
      }

      if (result.error) throw result.error;

      setConfig(result.data);
      toast({
        title: "Configuración guardada",
        description: "La configuración de bonos por referidos ha sido actualizada exitosamente.",
      });
    } catch (error) {
      console.error('Error saving config:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (field: keyof BonusConfig, value: any) => {
    if (!config) return;
    setConfig({ ...config, [field]: value });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Cargando configuración...</p>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="text-center p-8">
        <p>No se pudo cargar la configuración.</p>
        <Button onClick={fetchConfig} className="mt-4">
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Configuración de Bonos por Referidos</h2>
          <p className="text-muted-foreground">
            Administra las variables para aprobar bonos a custodios que refieren nuevos candidatos.
          </p>
        </div>
        <Button onClick={saveConfig} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Guardando...' : 'Guardar Configuración'}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Configuración Monetaria
            </CardTitle>
            <CardDescription>
              Define el monto del bono y el estado del sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="monto_bono">Monto del Bono (MXN)</Label>
              <Input
                id="monto_bono"
                type="number"
                min="0"
                step="50"
                value={config.monto_bono}
                onChange={(e) => updateConfig('monto_bono', parseFloat(e.target.value) || 0)}
                placeholder="1000"
              />
              <p className="text-sm text-muted-foreground">
                Cantidad que recibirá el custodio por cada referido exitoso
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="activo"
                checked={config.activo}
                onCheckedChange={(checked) => updateConfig('activo', checked)}
              />
              <Label htmlFor="activo">Sistema de bonos activo</Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Requisitos Temporales
            </CardTitle>
            <CardDescription>
              Define los criterios de tiempo para otorgar bonos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dias_minimos">Días Mínimos de Permanencia</Label>
              <Input
                id="dias_minimos"
                type="number"
                min="1"
                max="365"
                value={config.dias_minimos_permanencia}
                onChange={(e) => updateConfig('dias_minimos_permanencia', parseInt(e.target.value) || 90)}
                placeholder="90"
              />
              <p className="text-sm text-muted-foreground">
                Días que debe permanecer activo el custodio referido (por defecto 90 días = 3 meses)
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Requisitos de Actividad
            </CardTitle>
            <CardDescription>
              Define los criterios de servicios para otorgar bonos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="servicios_minimos">Servicios Mínimos Requeridos</Label>
              <Input
                id="servicios_minimos"
                type="number"
                min="1"
                max="100"
                value={config.servicios_minimos_requeridos}
                onChange={(e) => updateConfig('servicios_minimos_requeridos', parseInt(e.target.value) || 15)}
                placeholder="15"
              />
              <p className="text-sm text-muted-foreground">
                Número mínimo de servicios que debe completar el custodio referido
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Información General</CardTitle>
            <CardDescription>
              Nombre y descripción de la configuración
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre de la Configuración</Label>
              <Input
                id="nombre"
                value={config.nombre}
                onChange={(e) => updateConfig('nombre', e.target.value)}
                placeholder="Configuración de Bonos por Referidos"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                value={config.descripcion || ''}
                onChange={(e) => updateConfig('descripcion', e.target.value)}
                placeholder="Describe el propósito de esta configuración..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumen de Configuración</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="p-3 bg-muted rounded-lg">
              <div className="font-medium">Monto del Bono</div>
              <div className="text-lg font-bold text-green-600">
                ${config.monto_bono.toLocaleString()} MXN
              </div>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <div className="font-medium">Permanencia Mínima</div>
              <div className="text-lg font-bold text-blue-600">
                {config.dias_minimos_permanencia} días
              </div>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <div className="font-medium">Servicios Mínimos</div>
              <div className="text-lg font-bold text-purple-600">
                {config.servicios_minimos_requeridos} servicios
              </div>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <div className="font-medium">Estado del Sistema</div>
              <div className={`text-lg font-bold ${config.activo ? 'text-green-600' : 'text-red-600'}`}>
                {config.activo ? 'Activo' : 'Inactivo'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
