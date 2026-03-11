

# Pestaña "Datos Personales" en el Panel de Evaluación

## Contexto

El `CandidateEvaluationPanel` ya tiene 11 secciones (entrevista, riesgo, psicométricos, etc.). Se necesita agregar una sección para editar datos personales y de vehículo del candidato, ya que la información capturada en fases previas (entrevistas, leads) puede ser incorrecta o no verificable.

La tabla `candidatos_custodios` ya tiene todos los campos necesarios: `nombre`, `telefono`, `email`, `direccion`, `curp`, `marca_vehiculo`, `modelo_vehiculo`, `placas_vehiculo`, `color_vehiculo`, `vehiculo_propio`, `numero_licencia`, `numero_serie`, `numero_motor`, etc.

## Diseño UI

La nueva sección se integra como un **item más** dentro del sistema de gates existente, posicionada al inicio (antes de Entrevista) con nivel `info` ya que no es bloqueante ni advertencia. Se muestra como las demás secciones: fila colapsable con icono, label y badge.

Al expandirla, se muestra un formulario dividido en dos bloques:

1. **Datos Personales**: nombre, teléfono, email, CURP, dirección
2. **Datos del Vehículo**: vehículo propio (toggle), marca, modelo, placas, color, número de serie, número de motor, licencia

Cada campo se pre-llena con los datos actuales de `candidatos_custodios`. Un botón "Guardar datos verificados" persiste los cambios.

## Impacto en workflows

| Workflow | Impacto | Acción |
|---|---|---|
| Liberación (`LiberacionChecklistModal`) | Ya tiene su propia sección de datos/ubicación. Los datos editados aquí se reflejan automáticamente porque ambos leen de `candidatos_custodios` | Ninguno |
| Perfiles Operativos (`useProfileVehicle`, `useProfileUbicacion`) | Leen de tablas post-liberación (`custodios_vehiculos`, `custodio_liberacion`). No se afectan | Ninguno |
| Documentos/Contratos | Usan `candidatoId` como FK, no dependen de los datos personales | Ninguno |
| Gate de vehículo en evaluación | Actualmente no existe un gate para datos personales completos. Se puede agregar como `info` para indicar si faltan datos | Se agrega gate informativo |

No hay efectos secundarios negativos: el formulario solo hace UPDATE sobre `candidatos_custodios` para el candidato actual.

## Archivos a crear/modificar

| Archivo | Cambio |
|---|---|
| `src/components/recruitment/personal/PersonalDataTab.tsx` | **Nuevo** — Formulario de edición con dos secciones (personal + vehículo) |
| `src/components/recruitment/personal/PersonalDataBadge.tsx` | **Nuevo** — Badge que muestra completitud de datos |
| `src/components/recruitment/CandidateEvaluationPanel.tsx` | Agregar la nueva sección al array `sectionItems` y su gate correspondiente |

## Detalle técnico

### `PersonalDataTab.tsx`
- Hook `useQuery` para cargar datos actuales de `candidatos_custodios` por `candidatoId`
- Estado local con `usePersistedForm` (nivel `light`) para evitar pérdida de datos
- Campos editables con validación básica (teléfono 10 dígitos, email formato válido)
- Mutación `UPDATE candidatos_custodios SET ... WHERE id = candidatoId`
- Toast de confirmación al guardar
- Marca visual "Datos verificados" con timestamp del último `updated_at`

### Gate
- Nivel: `info`
- Passed: cuando al menos nombre + teléfono + email están presentes
- Detail: "X/Y campos completados"

