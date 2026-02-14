import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, RotateCcw } from 'lucide-react';
import { useCSConfig, DEFAULT_HEALTH_CONFIG, DEFAULT_LOYALTY_CONFIG, DEFAULT_NPS_RULES_CONFIG, type HealthConfig, type LoyaltyConfig, type NPSRulesConfig } from '@/hooks/useCSConfig';

// ── Helper: numeric input field ──
function NumField({ label, value, onChange, suffix }: { label: string; value: number; onChange: (v: number) => void; suffix?: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Label className="text-sm whitespace-nowrap">{label}</Label>
      <div className="flex items-center gap-1">
        <Input
          type="number"
          className="w-20 text-right"
          value={value}
          onChange={e => onChange(Number(e.target.value) || 0)}
        />
        {suffix && <span className="text-xs text-muted-foreground">{suffix}</span>}
      </div>
    </div>
  );
}

// ── Health Score Section ──
function HealthScoreConfig() {
  const { config, save, isSaving, isCustom } = useCSConfig<HealthConfig>('health_score');
  const [draft, setDraft] = useState<HealthConfig>(config);
  const [initialized, setInitialized] = useState(false);

  // Sync draft when config loads
  if (!initialized && config) {
    setDraft(config);
    setInitialized(true);
  }

  const pen = draft.penalizaciones;
  const setPen = (key: keyof typeof pen, val: number) =>
    setDraft(d => ({ ...d, penalizaciones: { ...d.penalizaciones, [key]: val } }));
  const umb = draft.umbrales_churn;
  const setUmb = (key: keyof typeof umb, val: number) =>
    setDraft(d => ({ ...d, umbrales_churn: { ...d.umbrales_churn, [key]: val } }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Health Score — Penalizaciones</CardTitle>
        <CardDescription>
          Cada cliente inicia con 100 pts. Se restan puntos según las condiciones activas.
          {isCustom && <span className="ml-2 text-xs text-primary font-medium">(Personalizado)</span>}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Penalizaciones</p>
            <NumField label="Quejas ≥ 2" value={pen.quejas_2_mas} onChange={v => setPen('quejas_2_mas', v)} suffix="pts" />
            <NumField label="Quejas = 1" value={pen.quejas_1} onChange={v => setPen('quejas_1', v)} suffix="pts" />
            <NumField label="Sin contacto > 60d" value={pen.sin_contacto_60d} onChange={v => setPen('sin_contacto_60d', v)} suffix="pts" />
            <NumField label="Sin contacto > 30d" value={pen.sin_contacto_30d} onChange={v => setPen('sin_contacto_30d', v)} suffix="pts" />
            <NumField label="Sin servicios 90d" value={pen.sin_servicios_90d} onChange={v => setPen('sin_servicios_90d', v)} suffix="pts" />
            <NumField label="CSAT < 3" value={pen.csat_bajo_3} onChange={v => setPen('csat_bajo_3', v)} suffix="pts" />
            <NumField label="CSAT < 4" value={pen.csat_bajo_4} onChange={v => setPen('csat_bajo_4', v)} suffix="pts" />
          </div>
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Umbrales de Churn</p>
            <NumField label="Riesgo Alto ≤" value={umb.alto} onChange={v => setUmb('alto', v)} suffix="pts" />
            <NumField label="Riesgo Medio ≤" value={umb.medio} onChange={v => setUmb('medio', v)} suffix="pts" />
            <p className="text-xs text-muted-foreground mt-2">
              Score &gt; {umb.medio} = Bajo · {umb.alto + 1}–{umb.medio} = Medio · ≤ {umb.alto} = Alto
            </p>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button onClick={() => save(draft)} disabled={isSaving} className="gap-2">
            <Save className="h-4 w-4" />
            {isSaving ? 'Guardando...' : 'Guardar Health Score'}
          </Button>
          <Button variant="outline" onClick={() => setDraft(DEFAULT_HEALTH_CONFIG)} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Restaurar defaults
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Loyalty Funnel Section ──
function LoyaltyFunnelConfig() {
  const { config, save, isSaving, isCustom } = useCSConfig<LoyaltyConfig>('loyalty_funnel');
  const [draft, setDraft] = useState<LoyaltyConfig>(config);
  const [initialized, setInitialized] = useState(false);

  if (!initialized && config) {
    setDraft(config);
    setInitialized(true);
  }

  const setStage = (stage: string, key: string, val: number) =>
    setDraft(d => ({ ...d, [stage]: { ...(d as any)[stage], [key]: val } }));

  const stages = [
    { key: 'en_riesgo', label: 'En Riesgo', fields: [
      { k: 'quejas_minimas', label: 'Quejas mínimas', suffix: '' },
      { k: 'dias_inactividad', label: 'Días inactividad', suffix: 'd' },
      { k: 'servicios_90d_minimo', label: 'Servicios 90d mín.', suffix: '' },
    ]},
    { key: 'embajador', label: 'Embajador', fields: [
      { k: 'meses_minimos', label: 'Meses mínimos', suffix: 'm' },
      { k: 'csat_minimo', label: 'CSAT mínimo', suffix: '' },
      { k: 'dias_contacto_maximo', label: 'Días contacto máx.', suffix: 'd' },
    ]},
    { key: 'promotor', label: 'Promotor', fields: [
      { k: 'meses_minimos', label: 'Meses mínimos', suffix: 'm' },
      { k: 'csat_minimo', label: 'CSAT mínimo', suffix: '' },
      { k: 'dias_contacto_maximo', label: 'Días contacto máx.', suffix: 'd' },
    ]},
    { key: 'leal', label: 'Leal', fields: [
      { k: 'meses_minimos', label: 'Meses mínimos', suffix: 'm' },
      { k: 'dias_contacto_maximo', label: 'Días contacto máx.', suffix: 'd' },
    ]},
    { key: 'nuevo', label: 'Nuevo', fields: [
      { k: 'meses_maximo', label: 'Meses máximo', suffix: 'm' },
    ]},
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Embudo de Fidelidad — Criterios por Etapa</CardTitle>
        <CardDescription>
          Define los umbrales que determinan la etapa de fidelidad de cada cliente.
          {isCustom && <span className="ml-2 text-xs text-primary font-medium">(Personalizado)</span>}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stages.map(stage => (
            <div key={stage.key} className="border rounded-lg p-3 space-y-2">
              <p className="text-sm font-semibold">{stage.label}</p>
              {stage.fields.map(f => (
                <NumField
                  key={f.k}
                  label={f.label}
                  value={(draft as any)[stage.key]?.[f.k] ?? 0}
                  onChange={v => setStage(stage.key, f.k, v)}
                  suffix={f.suffix}
                />
              ))}
            </div>
          ))}
        </div>

        <div className="flex gap-2 pt-2">
          <Button onClick={() => save(draft)} disabled={isSaving} className="gap-2">
            <Save className="h-4 w-4" />
            {isSaving ? 'Guardando...' : 'Guardar Funnel'}
          </Button>
          <Button variant="outline" onClick={() => setDraft(DEFAULT_LOYALTY_CONFIG)} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Restaurar defaults
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ── NPS Rules Section ──
function NPSRulesConfig_() {
  const { config, save, isSaving, isCustom } = useCSConfig<NPSRulesConfig>('nps_rules');
  const [draft, setDraft] = useState<NPSRulesConfig>(config);
  const [initialized, setInitialized] = useState(false);

  if (!initialized && config) {
    setDraft(config);
    setInitialized(true);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Reglas de Campañas NPS</CardTitle>
        <CardDescription>
          Configura los criterios para generar campañas NPS automáticamente.
          {isCustom && <span className="ml-2 text-xs text-primary font-medium">(Personalizado)</span>}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">General</p>
            <div className="flex items-center justify-between gap-3">
              <Label className="text-sm">Frecuencia</Label>
              <Select
                value={draft.frecuencia}
                onValueChange={(v) => setDraft(d => ({ ...d, frecuencia: v as any }))}
              >
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mensual">Mensual</SelectItem>
                  <SelectItem value="trimestral">Trimestral</SelectItem>
                  <SelectItem value="semestral">Semestral</SelectItem>
                  <SelectItem value="anual">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between gap-3">
              <Label className="text-sm">Canal por defecto</Label>
              <Select
                value={draft.canal_default}
                onValueChange={(v) => setDraft(d => ({ ...d, canal_default: v }))}
              >
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="llamada">Llamada</SelectItem>
                  <SelectItem value="formulario">Formulario</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Criterios de selección</p>
            <NumField
              label="Antigüedad mín."
              value={draft.criterios.meses_antiguedad_minima}
              onChange={v => setDraft(d => ({ ...d, criterios: { ...d.criterios, meses_antiguedad_minima: v } }))}
              suffix="meses"
            />
            <NumField
              label="Servicios mínimos"
              value={draft.criterios.servicios_minimos}
              onChange={v => setDraft(d => ({ ...d, criterios: { ...d.criterios, servicios_minimos: v } }))}
              suffix=""
            />
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mt-4">Exclusiones</p>
            <NumField
              label="Días desde último NPS"
              value={draft.exclusiones.dias_desde_ultimo_nps}
              onChange={v => setDraft(d => ({ ...d, exclusiones: { ...d.exclusiones, dias_desde_ultimo_nps: v } }))}
              suffix="días"
            />
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <Button onClick={() => save(draft)} disabled={isSaving} className="gap-2">
            <Save className="h-4 w-4" />
            {isSaving ? 'Guardando...' : 'Guardar Reglas NPS'}
          </Button>
          <Button variant="outline" onClick={() => setDraft(DEFAULT_NPS_RULES_CONFIG)} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Restaurar defaults
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main Panel ──
export function CSConfigPanel() {
  return (
    <div className="space-y-4">
      <Tabs defaultValue="health" className="w-full">
        <TabsList>
          <TabsTrigger value="health">Health Score</TabsTrigger>
          <TabsTrigger value="funnel">Funnel de Fidelidad</TabsTrigger>
          <TabsTrigger value="nps">Reglas NPS</TabsTrigger>
        </TabsList>
        <TabsContent value="health"><HealthScoreConfig /></TabsContent>
        <TabsContent value="funnel"><LoyaltyFunnelConfig /></TabsContent>
        <TabsContent value="nps"><NPSRulesConfig_ /></TabsContent>
      </Tabs>
    </div>
  );
}
