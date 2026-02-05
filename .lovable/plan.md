
# Plan: Corregir Truncamiento de Nombres en Tarjetas de Servicio

## Diagnóstico del Bug

El nombre del custodio sigue truncándose porque la fila 2 del `CompactServiceCard` tiene múltiples elementos con anchos fijos que compiten por espacio:

```tsx
{/* Línea 280-318 - Layout actual */}
<div className="flex items-center gap-2 ...">
  {/* Ruta: max-w-[140px] + max-w-[140px] = 280px */}
  {/* Separador: ~15px */}
  {/* Custodio: max-w-[200px] */}
  {/* Separador + Vehículo: ~150px */}
</div>
```

**Total requerido**: ~645px en una fila de texto pequeño → truncamiento inevitable en pantallas medianas.

---

## Solución Propuesta

Rediseñar el layout para que el nombre del custodio sea flexible y tome el espacio disponible:

| Elemento | Antes | Después |
|----------|-------|---------|
| Ruta origen | `max-w-[140px]` | `max-w-[120px]` (reducir) |
| Ruta destino | `max-w-[140px]` | `max-w-[140px]` (mantener) |
| **Custodio** | `max-w-[200px]` | **Sin límite + `flex-1`** |
| Vehículo | `max-w-[100px]` | Ocultar en espacio reducido |

---

## Cambios en `CompactServiceCard.tsx`

### Archivo: `src/components/planeacion/CompactServiceCard.tsx`

**Líneas 280-318** - Rediseñar fila 2:

```tsx
{/* Row 2: Ruta + Custodio - Layout mejorado */}
<div className="flex items-center gap-2 mt-1.5 pl-2 text-xs text-muted-foreground">
  {/* Ruta - Ancho fijo reducido */}
  <div className="flex items-center gap-1 flex-shrink-0">
    <MapPin className="w-3 h-3 flex-shrink-0" />
    <span className="truncate max-w-[120px]">{service.origen}</span>
    <span className="flex-shrink-0">→</span>
    <span className="truncate max-w-[120px] font-medium text-foreground">{service.destino}</span>
  </div>
  
  <span className="text-muted-foreground/50 flex-shrink-0">•</span>
  
  {/* Custodio - SIN max-width, usa espacio disponible */}
  {service.custodio_nombre ? (
    <div className="flex items-center gap-1 min-w-0 flex-1">
      <User className="w-3 h-3 flex-shrink-0" />
      <span className="font-medium text-foreground truncate">
        {service.custodio_nombre}
      </span>
      {isHybridCustodian() && (
        <Shield className="w-3 h-3 text-amber-500 flex-shrink-0" />
      )}
    </div>
  ) : (
    <span className="text-red-500 font-medium flex-shrink-0">Sin custodio</span>
  )}
</div>

{/* Row 3 (nueva): Vehículo en fila separada si existe */}
{shouldShowVehicle() && vehicleData && (
  <div className="flex items-center gap-1 mt-1 pl-2 text-xs text-muted-foreground">
    <Car className="w-3 h-3 flex-shrink-0" />
    <span>{vehicleData.marca} {vehicleData.modelo}</span>
    {vehicleData.placa !== 'Sin placa' && (
      <code className="font-mono text-[10px] ml-1">{vehicleData.placa}</code>
    )}
  </div>
)}
```

---

## Cambios Clave

1. **Custodio sin `max-w`**: Remover el límite fijo para que el nombre use todo el espacio disponible
2. **`flex-1` en custodio**: Permite expandirse para llenar espacio restante
3. **Ruta reducida**: `max-w-[120px]` en lugar de `max-w-[140px]` para dar más espacio al custodio
4. **Vehículo separado**: Mover info de vehículo a su propia línea para evitar competencia

---

## Resultado Esperado

```text
ANTES:
📍 TULTEPEC → CUAUTITLAN IZCALLI, E... • 👤 SERGIO MONTANO ... • 🚗 Toyota...

DESPUÉS:
📍 TULTEPEC → CUAUTITLAN IZC... • 👤 SERGIO MONTANO HERNANDEZ
🚗 Toyota Hilux • ABC-123
```

---

## Testing

- [ ] Verificar que nombres largos como "SERGIO MONTANO HERNANDEZ" se muestran completos
- [ ] Confirmar que el vehículo aparece en fila separada cuando existe
- [ ] Validar layout en diferentes tamaños de pantalla
- [ ] Probar con custodios híbridos (icono de escudo visible)
