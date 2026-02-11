
## Plan: Conectar boton "Ver resultado" al Informe Profesional SIERCP

### Problema
El boton "Ver resultado" en la tabla de Invitaciones Candidatos (ruta `/leads/evaluaciones`, tab SIERCP > Invitaciones Candidatos) muestra un toast placeholder "Funcionalidad proximamente disponible" en lugar de abrir el reporte profesional.

### Causa
Lineas 185-191 de `InvitationsTable.tsx` tienen un TODO con un toast en lugar de funcionalidad real.

### Solucion

#### 1. Expandir datos de evaluacion en la query de invitaciones

**Archivo:** `src/hooks/useSIERCPInvitations.ts`

Ampliar el select de la evaluacion para incluir todos los scores necesarios para el reporte:

```
evaluacion:evaluacion_id (
  id,
  score_global,
  score_integridad,
  score_psicopatia,
  score_violencia,
  score_agresividad,
  score_afrontamiento,
  score_veracidad,
  score_entrevista,
  resultado_semaforo,
  risk_flags,
  fecha_evaluacion
)
```

#### 2. Integrar SIERCPReportDialog en InvitationsTable

**Archivo:** `src/components/recruitment/siercp/InvitationsTable.tsx`

- Agregar estado local para controlar el dialog y la invitacion seleccionada
- Reemplazar el toast placeholder (lineas 185-191) por logica que abra el `SIERCPReportDialog`
- Pasar los datos de la evaluacion completa y el nombre del candidato al dialog
- Construir un objeto `EvaluacionPsicometrica` compatible a partir de los datos de la invitacion

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/hooks/useSIERCPInvitations.ts` | Expandir select de evaluacion con todos los scores |
| `src/components/recruitment/siercp/InvitationsTable.tsx` | Reemplazar toast placeholder con apertura de SIERCPReportDialog |

### Resultado esperado

Al hacer click en el icono de "Ver resultado" en una invitacion completada, se abre el dialog con el informe profesional generado por IA, con radar chart, analisis por modulo, factores de riesgo/proteccion y opcion de imprimir/exportar PDF.
