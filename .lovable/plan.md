

# Desglose por Tipo: Custodios vs Armados en Generar Cortes Masivos

## Qué se pide
Agregar subtotales por tipo de operativo (Custodios y Armados Internos) en el modal de generación masiva, para que el usuario vea cuántos de cada tipo hay y cuánto representan.

## Cambios

**Archivo:** `src/pages/Facturacion/components/CxPOperativo/CortesSemanales/GenerarCortesMasivosDialog.tsx`

### 1. Agregar cálculos de subtotales por tipo
Crear un `useMemo` que separe los pendientes en custodios vs armados y calcule conteos y montos para cada grupo:

```
Custodios: 65 operativos · $890,000  |  Armados Int.: 17 operativos · $198,878
```

### 2. Reemplazar los badges de resumen (líneas 344-358)
Cambiar los badges genéricos por una fila con dos cards compactas que muestren:
- **Custodios**: cantidad de operativos, servicios, monto subtotal
- **Armados Int.**: cantidad de operativos, servicios, monto subtotal
- Mantener badges de "ya generados" y "sin servicios" debajo

### 3. Actualizar el footer (líneas 530-534)
Agregar al texto de "Seleccionados" el desglose por tipo de los seleccionados:
```
Seleccionados: 82 · $1,088,878.23 (65 custodios · 17 armados)
```

### Diseño visual
Dos mini-cards horizontales con borde sutil, icono de tipo, y números en negrita. Compactas para no ocupar mucho espacio vertical en el modal.

