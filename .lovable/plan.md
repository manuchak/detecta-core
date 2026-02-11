
## Plan: Reportes Profesionales SIERCP para el Equipo de Supply

### Problema
Las chicas de supply aplican evaluaciones psicometricas a candidatos y solo ven una tarjeta basica con scores numericos (`PsychometricResultCard`). No tienen acceso al reporte profesional con IA que ya existe en el sistema (radar chart, factores de riesgo/proteccion, recomendaciones, conclusion profesional).

### Solucion
Agregar un boton "Ver Informe Profesional" en la tarjeta de resultados que genere (o muestre si ya existe) el reporte completo usando la edge function `generate-siercp-report` y los componentes visuales que ya tenemos (`SIERCPPrintableReport`, `SIERCPScoreGauge`, `SIERCPRadarProfile`, `SIERCPDecisionBadge`).

### Arquitectura actual (lo que ya existe)

| Componente | Estado |
|---|---|
| Edge function `generate-siercp-report` | Funcional, usa Lovable AI Gateway |
| Hook `useSIERCPReport` | Funcional, invoca la edge function |
| `SIERCPPrintableReport` | Componente completo con cover, radar, modulos, riesgo/proteccion |
| `SIERCPScoreGauge`, `SIERCPRadarProfile`, `SIERCPDecisionBadge` | Componentes visuales listos |
| Estilos de impresion | Ya configurados en `index.css` |

Todo lo necesario ya esta construido, solo falta conectarlo al flujo de recruitment.

### Cambios propuestos

#### 1. Crear componente `SIERCPReportDialog` (nuevo archivo)

**Archivo:** `src/components/recruitment/psychometrics/SIERCPReportDialog.tsx`

Un dialog/modal que:
- Recibe la evaluacion (`EvaluacionPsicometrica`) y nombre del candidato
- Al abrirse, llama a `useSIERCPReport.generateReport()` con los scores de la evaluacion
- Muestra un spinner mientras genera
- Renderiza `SIERCPPrintableReport` con el resultado
- Incluye boton "Imprimir / Exportar PDF" que usa `window.print()` con el filename dinamico

El componente traduce los scores de `evaluaciones_psicometricas` al formato que espera la edge function:

```
score_integridad -> { name: "Integridad Moral", score: X, maxScore: 100, percentage: X }
score_psicopatia -> { name: "Indicadores de Psicopatia", ... }
score_violencia -> { name: "Tendencia a la Violencia", ... }
etc.
```

#### 2. Agregar boton "Ver Informe" en `PsychometricResultCard`

**Archivo:** `src/components/recruitment/psychometrics/PsychometricResultCard.tsx`

- Agregar boton `FileText` + "Generar Informe Profesional" debajo de los scores
- Al hacer click, abre el `SIERCPReportDialog`
- Solo visible cuando hay score_global (evaluacion completada)

#### 3. Guardar el reporte generado en la evaluacion (opcional pero recomendado)

**Archivo:** `src/hooks/useEvaluacionesPsicometricas.ts`

- Agregar mutation `useSaveAIReport` que guarde el JSON del reporte en un campo de la evaluacion para no tener que regenerarlo cada vez
- Esto requiere verificar si `evaluaciones_psicometricas` tiene columna para el reporte

### Detalle tecnico

**Nuevo archivo `SIERCPReportDialog.tsx`:**

```text
Dialog (fullscreen on mobile, max-w-5xl on desktop)
  |-- Estado: loading | report | error
  |-- Al abrir: 
  |     1. Mapear scores de EvaluacionPsicometrica al formato ModuleScore[]
  |     2. Llamar generateReport() con los datos mapeados
  |     3. Mostrar SIERCPPrintableReport cuando este listo
  |-- Toolbar:
  |     - Boton "Imprimir/PDF" -> window.print() con filename dinamico
  |     - Boton "Cerrar"
```

**Mapeo de scores (evaluaciones_psicometricas -> edge function):**

```text
score_integridad    -> "Integridad Moral"
score_psicopatia    -> "Indicadores de Psicopatia"
score_violencia     -> "Tendencia a la Violencia"  
score_agresividad   -> "Control de Impulsos"
score_afrontamiento -> "Afrontamiento al Estres"
score_veracidad     -> "Escala de Veracidad"
score_entrevista    -> "Entrevista Estructurada"
```

### Archivos a crear/modificar

| Archivo | Cambio |
|---|---|
| `src/components/recruitment/psychometrics/SIERCPReportDialog.tsx` | **Nuevo** - Dialog con generacion de reporte AI y vista imprimible |
| `src/components/recruitment/psychometrics/PsychometricResultCard.tsx` | Agregar boton "Generar Informe Profesional" que abre el dialog |

### Resultado esperado

1. Supply abre el perfil de un candidato -> tab Evaluaciones -> Psicometrica
2. Ve la tarjeta de resultados actual con scores
3. Hace click en "Generar Informe Profesional"
4. Se abre un dialog que genera el reporte con IA (10-15 segundos)
5. Ve el reporte completo profesional: radar chart, analisis por modulo, factores de riesgo/proteccion, recomendaciones, conclusion
6. Puede imprimir/exportar a PDF directamente desde el dialog
