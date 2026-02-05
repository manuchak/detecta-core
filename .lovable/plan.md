
# Plan: Corregir Filtro PF para Mostrar Posicionamiento en Falso

## Diagnóstico del Bug

### Comportamiento Actual (Líneas 546-550)
```typescript
const tipoServicio = service.tipo_servicio?.toLowerCase() || '';
const isPF = tipoServicio.startsWith('pf_') || tipoServicio === 'pf';
return tipoClienteFilter === 'pf' ? isPF : !isPF;
```
El filtro "PF" busca servicios por **tipo de servicio** (Persona Física), pero Daniela espera ver servicios con **Posicionamiento en Falso**.

### Resultado
- Se muestra "pos. falso: 1" en las métricas
- Al filtrar por "PF", no aparece nada porque el servicio tiene `posicionamiento_falso = true` pero no `tipo_servicio = 'pf'`

---

## Solución Propuesta

Separar los dos conceptos con filtros distintos:

| Filtro | Campo | Descripción |
|--------|-------|-------------|
| Empresarial | `tipo_servicio` no contiene 'pf' | Clientes corporativos |
| Persona Física | `tipo_servicio` contiene 'pf' | Clientes individuales |
| **Pos. Falso** (nuevo) | `posicionamiento_falso = true` | Servicios cancelados en origen |

---

## Cambios en `ScheduledServicesTabSimple.tsx`

### 1. Agregar nuevo estado para filtro de Posicionamiento Falso

```typescript
// Línea ~188 - Nuevo estado
const [showOnlyFalsePositioning, setShowOnlyFalsePositioning] = useState(false);
```

### 2. Actualizar lógica de filtrado

```typescript
// Líneas 543-551 - Agregar filtro de posicionamiento falso
let filteredData = summary.services_data;

// Filtro de Posicionamiento Falso (independiente)
if (showOnlyFalsePositioning) {
  filteredData = filteredData.filter(service => 
    service.posicionamiento_falso === true || service.posicionamiento_falso === 'true'
  );
}

// Filtro de tipo cliente (Empresarial/PF)
if (tipoClienteFilter !== 'todos') {
  filteredData = filteredData.filter(service => {
    const tipoServicio = service.tipo_servicio?.toLowerCase() || '';
    const isPF = tipoServicio.startsWith('pf_') || tipoServicio === 'pf';
    return tipoClienteFilter === 'pf' ? isPF : !isPF;
  });
}
```

### 3. Agregar botón de filtro en la UI

Junto al contador "pos. falso" existente, hacerlo clickeable:

```tsx
{/* Botón para filtrar Posicionamiento Falso - línea ~810 */}
<Button
  variant={showOnlyFalsePositioning ? 'default' : 'outline'}
  size="sm"
  onClick={() => setShowOnlyFalsePositioning(!showOnlyFalsePositioning)}
  className={cn(
    "h-7 text-xs",
    showOnlyFalsePositioning && "bg-violet-600 hover:bg-violet-700 text-white"
  )}
>
  <MapPinOff className="w-3 h-3 mr-1" />
  Pos. Falso
  {falsePositioningCount > 0 && (
    <Badge variant="secondary" className="ml-1 h-4 text-[10px]">
      {falsePositioningCount}
    </Badge>
  )}
</Button>
```

---

## UI Visual Propuesta

```text
┌───────────────────────────────────────────────────────────────────────────┐
│ Filtrar: [Todos(32)] [Empresarial] [PF] │ [📍 Pos. Falso (1)] │ [Folio]  │
└───────────────────────────────────────────────────────────────────────────┘
```

Cuando Daniela haga clic en "Pos. Falso", se mostrarán solo los servicios cancelados por posicionamiento en falso.

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/pages/Planeacion/components/ScheduledServicesTabSimple.tsx` | Agregar estado, lógica y botón |

---

## Beneficios

1. **Claridad**: Separa "Persona Física" de "Posicionamiento Falso"
2. **Funcionalidad**: Daniela puede ver servicios PF fácilmente
3. **Independiente**: El filtro PF puede combinarse con otros filtros

---

## Testing

- [ ] Verificar que el contador "Pos. Falso" coincide con servicios filtrados
- [ ] Confirmar que el botón se activa/desactiva correctamente
- [ ] Validar que servicios con `posicionamiento_falso = true` aparecen
- [ ] Probar combinación de filtros (Empresarial + Pos. Falso)
