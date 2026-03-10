

# Dividir "Horas de Cortesía" en Local y Foráneo en el formulario de cliente

## Problema
El formulario de edición de cliente (pestaña Fact.) muestra un solo campo "Horas de Cortesía" que alimenta `horas_cortesia`. Las columnas `horas_cortesia_local` y `horas_cortesia_foraneo` ya existen en `pc_clientes` y la lógica de cálculo ya las consume, pero no hay UI para configurarlas.

## Cambio

### `ClienteFormModal.tsx` — Reemplazar campo único por dos campos

Reemplazar el campo actual de "Horas de Cortesía" (líneas 348-352) por dos campos lado a lado:

```text
ANTES:
  [Horas de Cortesía (number)]  [Tarifa de Pernocta]

DESPUÉS:
  [Hrs Cortesía Local]  [Hrs Cortesía Foráneo]
  [Tarifa de Pernocta]  (se mantiene)
```

- Campo "Hrs Cortesía Local" → `horas_cortesia_local` (number, step 0.5)
- Campo "Hrs Cortesía Foráneo" → `horas_cortesia_foraneo` (number, step 0.5)
- El campo genérico `horas_cortesia` se calcula automáticamente como fallback (el mayor de los dos, o el que se llene si solo uno tiene valor)
- Agregar `horas_cortesia_local` y `horas_cortesia_foraneo` al `formData` inicial y al `handleSave`

### Archivo afectado
- `src/pages/Facturacion/components/GestionClientes/ClienteFormModal.tsx` — UI del formulario

No se requieren migraciones SQL ni cambios en lógica de cálculo (ya implementados).

