

# Poblar templates de Pruebas Comm con templates aprobados de Kapso

## Problema
El panel de Pruebas Comm tiene 2 templates hardcodeados (`nudge_status_custodio`, `reporte_servicio_cliente`). Debería mostrar los templates aprobados que están en la BD (`whatsapp_templates` con `meta_status = 'approved'`).

## Cambio

Modificar `TemplateTestSection` en `src/components/monitoring/comm/CommTestPanel.tsx`:

1. **Eliminar** el array estático `TEMPLATES` (líneas 75-94)
2. **Fetch dinámico** de templates aprobados desde `whatsapp_templates` donde `meta_status = 'approved'` y `is_active = true`
3. **Mapear variables** usando `TEMPLATE_VARIABLES` de `src/types/kapso.ts` para generar los campos de parámetros dinámicamente
4. **Mostrar loading** mientras se cargan los templates
5. **Mensaje vacío** si no hay templates aprobados

| Archivo | Cambio |
|---|---|
| `src/components/monitoring/comm/CommTestPanel.tsx` | Reemplazar `TEMPLATES` hardcodeados por query a BD + `TEMPLATE_VARIABLES` |

