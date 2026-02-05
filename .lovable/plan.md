
# Plan: Agregar Campo de Kilometraje al Modal de Edición de Rutas

## Descripción del Bug

Daniela de Planeación reporta que al modificar rutas no tiene la opción de editar el kilometraje. El modal "Actualizar Precio" solo permite modificar:
- Precio Cliente (Valor Bruto)
- Pago Custodio

Pero falta el campo **Distancia (km)** que es crítico para la gestión de rutas.

---

## Análisis Técnico

### Estado Actual

**Tabla `matriz_precios_rutas`:** Contiene el campo `distancia_km` (editable)

**Interfaz `PendingPriceRoute`:** NO incluye `distancia_km`
```typescript
export interface PendingPriceRoute {
  id: string;
  cliente_nombre: string;
  // ... otros campos
  // ❌ distancia_km: number | null; <- FALTA
}
```

**Interfaz `Route` en modal:** NO incluye `distancia_km`
```typescript
interface Route {
  id: string;
  valor_bruto: number;
  precio_custodio: number;
  costo_operativo: number;
  // ❌ distancia_km?: number | null; <- FALTA
}
```

**Modal `QuickPriceEditModal`:** No tiene input para distancia

---

## Solución Propuesta

### Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/hooks/useRoutesWithPendingPrices.ts` | Agregar `distancia_km` a interfaz `PendingPriceRoute` |
| `src/pages/Planeacion/components/routes/QuickPriceEditModal.tsx` | Agregar campo de edición de kilometraje |

### Cambios en Detalle

**1. Actualizar interfaz `PendingPriceRoute`:**
```typescript
export interface PendingPriceRoute {
  // ... campos existentes
  distancia_km: number | null;  // AGREGAR
}
```

**2. Actualizar interfaz `Route` en modal:**
```typescript
interface Route {
  id: string;
  cliente_nombre: string;
  origen_texto: string;
  destino_texto: string;
  valor_bruto: number;
  precio_custodio: number;
  costo_operativo: number;
  distancia_km?: number | null;  // AGREGAR
}
```

**3. Agregar estado y campo en modal:**
- Nuevo estado: `const [distanciaKm, setDistanciaKm] = useState('');`
- Inicializar en `useEffect` con `route.distancia_km`
- Agregar input numérico entre Pago Custodio y Margen Estimado

**4. Actualizar UPDATE en `handleSave`:**
```typescript
.update({
  valor_bruto: valorBrutoNum,
  precio_custodio: precioCustodioNum,
  distancia_km: distanciaKmNum || null,  // AGREGAR
  updated_at: new Date().toISOString()
})
```

---

## UI del Campo Nuevo

El campo de Distancia se agregará después de "Pago Custodio" con el siguiente diseño:

```text
┌─────────────────────────────────────────┐
│  Distancia (km)                         │
│  ┌───────────────────────────────────┐  │
│  │ 🛣️  450.5                     ↕ │  │
│  └───────────────────────────────────┘  │
│  Actual: 450 km                         │
└─────────────────────────────────────────┘
```

- Input tipo número con step="0.1"
- Mostrar valor actual debajo
- Icono de ruta para contexto visual
- Tooltip explicando que es distancia aproximada de la ruta

---

## Orden de Implementación

1. Agregar `distancia_km` a interfaz `PendingPriceRoute`
2. Actualizar interfaz `Route` en el modal
3. Agregar estado `distanciaKm` y función setter
4. Agregar inicialización en `useEffect`
5. Agregar campo de input en el formulario
6. Incluir `distancia_km` en el UPDATE

---

## Validaciones

- El campo es opcional (puede ser null)
- Acepta decimales (step="0.1")
- No puede ser negativo (min="0")
- Si está vacío, se guarda como null

---

## Testing

- [ ] Abrir modal de edición de ruta
- [ ] Verificar que muestra valor actual de distancia
- [ ] Editar distancia y guardar
- [ ] Verificar que el cambio persiste en la BD
- [ ] Verificar que funciona con rutas sin distancia previa
