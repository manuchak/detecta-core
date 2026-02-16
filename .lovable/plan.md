

# Hacer la Firma Obligatoria en el Checklist

## Problema

El checklist de Daniel Garcia Medina (YOCOYTM-274) fue guardado sin firma. Aunque la UI del wizard muestra "(Requerida)" y deshabilita el boton si no hay firma, el backend no valida esto, permitiendo que checklists sin firma se guarden (por ejemplo, via sync offline o race conditions).

## Cambios

### 1. Validacion en el hook de guardado

**Archivo:** `src/hooks/useServiceChecklist.ts` (linea ~250)

Agregar una validacion al inicio de `saveChecklist.mutationFn` que lance un error si `firma` es null o vacio:

```text
if (!firma) {
  throw new Error('La firma digital es obligatoria');
}
```

Y cambiar la linea 263 de `firma_base64: firma || undefined` a `firma_base64: firma` para garantizar que siempre se envie.

### 2. Constraint en base de datos

**Archivo:** Nueva migracion SQL

Agregar un CHECK constraint a la tabla `checklist_servicio` para que `firma_base64` no pueda ser null ni vacio cuando el estado es 'completo':

```sql
ALTER TABLE checklist_servicio
ADD CONSTRAINT chk_firma_obligatoria
CHECK (estado != 'completo' OR (firma_base64 IS NOT NULL AND firma_base64 != ''));
```

Esto garantiza que ningun checklist "completo" pueda existir sin firma, sin importar como se guarde.

### 3. Indicador visual en Monitoreo cuando falta firma

**Archivo:** `src/components/monitoring/checklist/ChecklistDetailModal.tsx` (linea ~328)

Actualmente solo muestra la firma si existe (`servicio.firmaBase64 &&`). Agregar un else que muestre una advertencia visible cuando no hay firma:

```text
Si hay firma -> mostrar imagen (como ahora)
Si no hay firma -> mostrar badge rojo: "Sin firma digital"
```

## Secuencia

1. Migracion SQL (constraint en DB)
2. Validacion en hook (defensa en codigo)
3. Indicador visual en monitoreo (visibilidad para auditoria)

