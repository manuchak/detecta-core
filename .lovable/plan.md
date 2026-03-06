

# Plan: Enriquecer datos de clientes desde servicios_custodia

## Contexto

- **66 clientes** en `servicios_custodia` tienen `razon_social` llena
- **Solo 1** de 106 clientes en `pc_clientes` tiene `razon_social` completada
- De esos 66, al menos ~40 ya tienen match directo por nombre con `pc_clientes`
- El screenshot confirma que 105 de 106 clientes muestran "Sin Datos"

## Solución: Dos partes

### Parte 1 — Migración SQL one-time para enriquecer `pc_clientes`

Ejecutar un UPDATE que cruce `servicios_custodia.nombre_cliente` con `pc_clientes.nombre` (normalizado UPPER+TRIM) y copie `razon_social` donde `pc_clientes.razon_social` esté vacía. Solo actualiza cuando hay exactamente un match distinto de `razon_social` por cliente para evitar conflictos.

```sql
UPDATE pc_clientes pc
SET razon_social = sub.razon_social
FROM (
  SELECT DISTINCT ON (UPPER(TRIM(nombre_cliente)))
    UPPER(TRIM(nombre_cliente)) as norm_name,
    razon_social
  FROM servicios_custodia
  WHERE razon_social IS NOT NULL AND razon_social != ''
) sub
WHERE UPPER(TRIM(pc.nombre)) = sub.norm_name
  AND (pc.razon_social IS NULL OR pc.razon_social = '');
```

Esto pasará ~40 clientes de "Sin Datos" a "Incompleto" inmediatamente.

### Parte 2 — Indicador visual de completitud más granular en la UI

Mejorar `GestionClientesTab` para que el estado fiscal sea más informativo. Actualmente hay 3 niveles (Completo / Incompleto / Sin Datos). Agregar una barra de progreso con porcentaje que muestre cuántos de los 4 campos fiscales clave están completos (RFC, Razón Social, Régimen Fiscal, CP Fiscal), además de un tooltip o subtexto indicando qué falta.

**Cambios en `GestionClientesTab.tsx`:**
- Reemplazar el badge estático de "Estado" por un indicador con progreso (0/4, 1/4, 2/4, 3/4, 4/4)
- Agregar tooltip al hover mostrando campos faltantes
- Color-coding: 0=rojo, 1-2=amber, 3=blue, 4=emerald

**Cambios en `CreditoSummaryCards.tsx`:**
- Actualizar la lógica de conteo para reflejar los nuevos datos enriquecidos (ya se recalcula automáticamente)

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| Nueva migración SQL | UPDATE de enriquecimiento razon_social |
| `GestionClientesTab.tsx` | Indicador de completitud granular (progreso 0-4) con tooltip de campos faltantes |

