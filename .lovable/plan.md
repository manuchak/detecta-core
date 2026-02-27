
# Pestana de Costos del Proyecto en Control de Versiones

## Contexto

Lovable no expone una API para obtener conteo de mensajes ni costos. La informacion solo esta disponible visualmente en el panel de creditos del workspace. Por lo tanto, el sistema sera de **registro asistido**: al final de cada sesion, se registra manualmente el dato (o el AI lo sugiere).

## Lo que se construira

### 1. Nueva tabla: `project_cost_entries`

Registros periodicos de uso y costo:

| Columna | Tipo | Descripcion |
|---------|------|-------------|
| id | uuid PK | Identificador |
| entry_date | date | Fecha del registro |
| messages_count | integer | Mensajes del periodo |
| estimated_cost_usd | numeric | Costo estimado (mensajes x $0.25) |
| participants | text[] | Quienes participaron |
| version_id | uuid FK nullable | Version asociada |
| category | text | development, bugfix, maintenance |
| notes | text | Descripcion del trabajo |
| created_at | timestamptz | Timestamp |

RLS: politica para usuarios autenticados (select, insert, update).

### 2. Datos historicos pre-cargados

Insertar estimaciones retroactivas basadas en las versiones ya documentadas:

| Version | Mensajes est. | Costo est. | Periodo |
|---------|--------------|------------|---------|
| 1.0.0 Genesis | ~200 | ~$50 | Jun-Ago 2025 |
| 1.1.0 Security | ~80 | ~$20 | Ago 2025 |
| 1.2.0 Version Control | ~100 | ~$25 | Oct 2025 |
| 1.3.0 Import Wizard | ~150 | ~$37.50 | Oct 2025 |
| 1.4.0 LMS Platform | ~500 | ~$125 | Nov 2025 |
| 1.5.0 Facturacion | ~400 | ~$100 | Dic 2025 |
| 1.6.0 Customer Success | ~450 | ~$112.50 | Dic 2025 |
| 1.7.0 SIERCP | ~300 | ~$75 | Ene 2026 |
| 1.8.0 Recruitment | ~350 | ~$87.50 | Ene 2026 |
| 1.9.0 Monitoring | ~250 | ~$62.50 | Feb 2026 |
| 2.0.0 Platform Maturity | ~400 | ~$100 | Feb 2026 |
| **Total estimado** | **~3,180** | **~$795** | |

### 3. Nuevo componente: `ProjectCostTracker.tsx`

Dashboard con:
- **4 KPI cards**: Costo total, Mensajes totales, Participantes, Promedio diario
- **Grafica de linea**: Costo acumulado en el tiempo
- **Grafica de barras**: Mensajes por version
- **Tabla**: Desglose por version con costo y participantes
- **Formulario**: Para agregar nuevas entradas (fecha, mensajes, categoria, notas)
- **Parametro configurable**: Costo por mensaje (default $0.25 USD)

### 4. Integracion en VersionControlManager

Agregar tercera pestana "Costos del Proyecto" al TabsList principal.

```text
[Resumen] [Todas las Versiones] [Costos del Proyecto]
```

## Archivos

| Archivo | Accion |
|---------|--------|
| Migration SQL | Crear tabla `project_cost_entries` con RLS |
| Seed SQL (insert) | Insertar datos historicos estimados |
| `src/components/version-control/ProjectCostTracker.tsx` | Nuevo: dashboard de costos |
| `src/components/version-control/CostEntryForm.tsx` | Nuevo: formulario de entrada |
| `src/hooks/useProjectCosts.ts` | Nuevo: hook CRUD |
| `src/components/version-control/VersionControlManager.tsx` | Modificar: agregar tab |

## Sobre la actualizacion

Al no existir una API automatica, la actualizacion sera:
- **Manual asistida**: Al final de sesiones de trabajo, se registra el dato
- **Estimaciones retroactivas**: Los datos historicos se pre-cargan con estimaciones razonables basadas en la complejidad de cada version
- **Calculo automatico**: Al ingresar solo el numero de mensajes, el sistema calcula el costo usando el precio por mensaje configurable
