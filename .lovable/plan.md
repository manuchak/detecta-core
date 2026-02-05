
# Plan: Mejorar Visualización de Tarjetas de Servicio

## Solicitud de Daniela

1. **Mostrar la referencia de factura** (`id_interno_cliente`) en la información del servicio
2. **Mostrar el nombre completo del custodio** sin truncar

---

## Análisis Técnico

### Estado Actual

**CompactServiceCard.tsx (Líneas 206-209):**
```tsx
{/* ID Servicio */}
<code className="text-xs text-muted-foreground font-mono flex-shrink-0">
  {service.id_servicio}
</code>
```
- Solo muestra el UUID del servicio
- No muestra la referencia de factura (`id_interno_cliente`)

**Nombre del Custodio (Línea 290):**
```tsx
<span className="font-medium text-foreground truncate max-w-[120px]">
  {service.custodio_nombre}
</span>
```
- Truncado a 120px → nombres largos como "SERGIO MONTANO HERNANDEZ" se cortan

### Datos Disponibles

La interfaz `ScheduledService` **ya incluye** `id_interno_cliente` (línea 39 del hook), por lo que solo necesitamos agregarlo a la visualización.

---

## Solución Propuesta

### Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/planeacion/CompactServiceCard.tsx` | Agregar referencia + expandir nombre custodio |
| `src/pages/Planeacion/components/ScheduledServicesTabSimple.tsx` | Mismo cambio para consistencia |

---

### Cambios en CompactServiceCard.tsx

**1. Agregar referencia de factura junto al ID (Líneas 206-209):**
```tsx
{/* ID Servicio + Referencia */}
<code className="text-xs text-muted-foreground font-mono flex-shrink-0">
  {service.id_servicio}
</code>
{service.id_interno_cliente && (
  <span className="text-xs text-blue-600 dark:text-blue-400 font-medium flex-shrink-0">
    Ref: {service.id_interno_cliente}
  </span>
)}
```

**2. Expandir nombre del custodio (Línea 290):**
```tsx
{/* ANTES */}
<span className="truncate max-w-[120px]">

{/* DESPUÉS */}
<span className="truncate max-w-[200px]">
```

---

### UI Visual Propuesta

```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│ ANTES                                                                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│ MONTE ROSAS SPORTS  06:00  b850879c-34e3-48ca...  📅 Programado                 │
│ 📍 TULTEPEC → CUAUTITLAN IZCALLI, E...  👤 SERGIO MONTANO ...                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│ DESPUÉS                                                                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│ MONTE ROSAS SPORTS  06:00  b850879c...  Ref: FAC-2024-0142  📅 Programado       │
│ 📍 TULTEPEC → CUAUTITLAN IZCALLI, E...  👤 SERGIO MONTANO HERNANDEZ             │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Resumen de Cambios

1. **Referencia de factura**: Se mostrará en azul después del ID del servicio cuando exista `id_interno_cliente`
2. **Nombre del custodio**: Se aumenta el ancho máximo de 120px a 200px para mostrar nombres completos
3. **Consistencia**: Se aplica el mismo cambio en ambos componentes (`CompactServiceCard` y `ScheduledServicesTabSimple`)

---

## Testing

- [ ] Verificar que la referencia aparece cuando existe
- [ ] Verificar que nombres largos de custodios se muestran completos
- [ ] Validar que la UI no se rompe en pantallas pequeñas
