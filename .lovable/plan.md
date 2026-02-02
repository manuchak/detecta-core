

# Plan: Conectar Pestaña "Zonas Base" en Configuración de Planeación

## Problema Identificado

El componente `CustodiosZonasTab` (con los apple-metrics y la edición de zonas base) ya está implementado pero **no está conectado** al flujo principal.

Existen **dos archivos** con el mismo nombre:
- ❌ `components/PlanningConfigurationTab.tsx` → Versión antigua sin "Zonas Base" (actualmente en uso)
- ✅ `components/configuration/PlanningConfigurationTab.tsx` → Versión nueva con "Zonas Base"

## Solución

Actualizar el import en `PlanningHub.tsx` para usar la versión correcta del componente.

## Cambio Técnico

**Archivo:** `src/pages/Planeacion/PlanningHub.tsx`

| Línea | Antes | Después |
|-------|-------|---------|
| 13 | `import { PlanningConfigurationTab } from './components/PlanningConfigurationTab';` | `import { PlanningConfigurationTab } from './components/configuration/PlanningConfigurationTab';` |

## Resultado Esperado

Después del cambio, la pestaña "Configuración" mostrará:
1. **Proveedores** - Gestión de proveedores armados
2. **Esquemas** - Esquemas de precios
3. **Zonas Base** - ✅ La pestaña que necesitas con los apple-metrics
4. **Parámetros** - Configuración operacional
5. **Datos** - Gestión de datos (próximamente)

## Riesgo

**Bajo** - Es solo un cambio de import. Las funcionalidades existentes (Clientes, Custodios, Ubicaciones) seguirán disponibles en otras secciones del sistema.

