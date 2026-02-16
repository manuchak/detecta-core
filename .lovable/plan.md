

# Guia Contextual para Clasificacion de Incidentes

## Objetivo

Agregar descripciones explicativas y ejemplos concretos a los selectores de **Tipo de Incidente** y **Severidad** para que el usuario pueda clasificar correctamente sin ambiguedad. Se implementara mediante tooltips/popovers informativos y texto de ayuda contextual directamente en el formulario.

---

## Cambios

### 1. Enriquecer constantes con descripciones y ejemplos

**Archivo**: `src/hooks/useIncidentesOperativos.ts`

Ampliar `TIPOS_INCIDENTE` y `SEVERIDADES` con campos `descripcion` y `ejemplo`:

```typescript
export const TIPOS_INCIDENTE = [
  {
    value: 'robo',
    label: 'Robo',
    descripcion: 'Sustraccion de bienes sin confrontacion directa con personas. El delincuente actua sin violencia fisica hacia el custodio u operador.',
    ejemplo: 'Mercancia sustraida de la unidad mientras el operador estaba en descanso; robo de autopartes en estacionamiento.'
  },
  {
    value: 'asalto',
    label: 'Asalto',
    descripcion: 'Agresion con violencia o intimidacion directa hacia el personal para despojar bienes. Implica amenaza con arma o fuerza fisica.',
    ejemplo: 'Sujetos armados interceptan la unidad y amenazan al operador para llevarse la carga; encajonamiento en carretera con armas de fuego.'
  },
  {
    value: 'perdida_mercancia',
    label: 'Perdida de mercancia',
    descripcion: 'Faltante de producto sin evidencia de acto delictivo. Puede ser por error logistico, danio en transito o discrepancia en conteo.',
    ejemplo: 'Al entregar se detectan 3 cajas faltantes sin signos de apertura forzada; producto danado por mala estiba que se reporta como merma.'
  },
  // ... demas tipos con sus descripciones
];

export const SEVERIDADES = [
  {
    value: 'baja',
    label: 'Baja',
    color: '...',
    descripcion: 'Sin lesiones, sin perdida economica significativa, sin afectacion al servicio.',
    ejemplo: 'Falla de GPS temporal, protocolo menor incumplido sin consecuencias.'
  },
  {
    value: 'media',
    label: 'Media',
    color: '...',
    descripcion: 'Perdida economica moderada o retraso significativo. Sin lesiones graves.',
    ejemplo: 'Perdida parcial de mercancia por danio en transito; accidente vial menor sin heridos.'
  },
  {
    value: 'alta',
    label: 'Alta',
    color: '...',
    descripcion: 'Perdida economica importante, lesiones leves, o riesgo de afectacion a la relacion con el cliente.',
    ejemplo: 'Robo de carga completa sin violencia; accidente con lesiones leves; cliente escala queja formal.'
  },
  {
    value: 'critica',
    label: 'Critica',
    color: '...',
    descripcion: 'Lesiones graves, perdida total de carga de alto valor, uso de armas, o riesgo de vida.',
    ejemplo: 'Asalto con arma de fuego; secuestro de operador; perdida de carga valuada en mas de $500K.'
  },
];
```

### 2. Componente de ayuda contextual en el formulario

**Archivo**: `src/components/monitoring/incidents/IncidentReportForm.tsx`

Reemplazar los `Select` simples de tipo y severidad por versiones que incluyan:
- **Texto de ayuda debajo del selector** que cambia dinamicamente al seleccionar un tipo/severidad, mostrando la descripcion y ejemplo del valor seleccionado.
- **Items del dropdown enriquecidos**: cada `SelectItem` muestra el label + una descripcion corta debajo en texto muted.

Ejemplo visual del selector de Tipo:

```
[Tipo *]
[ Robo                          v ]
  "Sustraccion de bienes sin confrontacion directa..."
  Ej: "Mercancia sustraida mientras el operador descansaba"
```

### 3. Tabla comparativa de referencia rapida

**Archivo**: `src/components/monitoring/incidents/IncidentClassificationGuide.tsx` (nuevo)

Componente colapsable (usando Collapsible de Radix) que muestra una tabla comparativa entre Robo vs Asalto vs Perdida de mercancia con las diferencias clave:

| Criterio | Robo | Asalto | Perdida de mercancia |
|---|---|---|---|
| Violencia | No | Si | No aplica |
| Contacto con personal | No directo | Directo/amenaza | No aplica |
| Causa | Acto delictivo sin confrontacion | Acto delictivo con intimidacion | Error logistico o danio |
| Evidencia tipica | Sellos rotos, faltante | Testigos, lesiones, denuncia | Discrepancia en conteo |

Se coloca como un panel colapsable "Guia de clasificacion" arriba de los selectores en la seccion Datos Generales.

---

## Archivos a crear/modificar

| Archivo | Accion |
|---|---|
| `src/hooks/useIncidentesOperativos.ts` | Agregar `descripcion` y `ejemplo` a TIPOS_INCIDENTE y SEVERIDADES |
| `src/components/monitoring/incidents/IncidentClassificationGuide.tsx` | Nuevo - tabla comparativa colapsable |
| `src/components/monitoring/incidents/IncidentReportForm.tsx` | Integrar guia + texto de ayuda dinamico bajo selectores |
| `src/components/monitoring/incidents/index.ts` | Exportar nuevo componente |

