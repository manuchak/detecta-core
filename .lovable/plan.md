

# Fase 9 — Testing E2E + Switch WhatsApp Coordinación

## Resumen

Tres entregables:
1. **Switch on/off WhatsApp** en CoordinatorCommandCenter para habilitar/deshabilitar chat WA en Planeación y Monitoreo
2. **Escenarios de simulación guiados** en CommTestPanel — flujos automatizados de Planeación y Monitoreo
3. **Validaciones E2E** por canal en CommTestPanel (edge cases: multi-servicio, ventana 24h, handoff)

---

## 1. Feature Flags en BD

Nueva tabla `app_feature_flags`:

```sql
CREATE TABLE public.app_feature_flags (
  key TEXT PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT false,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.app_feature_flags ENABLE ROW LEVEL SECURITY;
-- Read: authenticated; Write: admin/owner/coordinador via has_role
INSERT INTO app_feature_flags (key) VALUES ('whatsapp_planeacion'), ('whatsapp_monitoreo');
```

## 2. Hook `useWhatsAppMode`

Nuevo `src/hooks/useWhatsAppMode.ts`:
- Lee flags de `app_feature_flags` con react-query
- `toggleFlag(key)` para update + invalidate
- Realtime subscription para sincronizar entre usuarios
- Expone `isPlaneacionEnabled`, `isMonitoreoEnabled`, `togglePlaneacion`, `toggleMonitoreo`

## 3. Switches en CoordinatorCommandCenter

En el header (linea ~314), agregar dos `Switch` compactos:
- "WA Plan" — toggle `whatsapp_planeacion`
- "WA Mon" — toggle `whatsapp_monitoreo`

Solo visible para coordinador/admin/owner (ya implícito por acceso al componente).

## 4. Protección condicional en componentes

**`CompactServiceCard.tsx` (linea ~302-319)**: El botón `MessageCircle` solo se renderiza si `isPlaneacionEnabled` es true. Si false, no aparece.

**`ServiceCommSheet.tsx` (linea ~21-212)**: Si `isMonitoreoEnabled` es false, los