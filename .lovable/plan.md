
# Plan: Corrección del Bug de Ruta Duplicada en Flujo de Nuevo Servicio

## Diagnóstico del Problema

Daniela Castañeda (coordinadora de operaciones) intentó crear un servicio para **ASTRA ZENECA** con la ruta:
- **Origen**: CIUDAD OBREGON, SON
- **Destino**: CUAUTITLAN IZCALLI, EDOMEX

### Datos en la Base de Datos

| Dato | Valor |
|------|-------|
| **Ruta existente** | `CUAUTITLAN IZCALLI, EDOMEX → CIUDAD OBREGON, SONORA` (ID: dbb93344) |
| **Ruta que Daniela intentó crear** | `CIUDAD OBREGON, SON → CUAUTITLAN IZCALLI, EDOMEX` |
| **CIUDAD OBREGON como origen** | NO existe para ASTRA ZENECA |
| **CIUDAD OBREGON como destino** | SÍ existe (dbb93344) |

### Causas Raíz Identificadas

**1. El RPC `get_origenes_con_frecuencia` usa igualdad exacta en cliente_nombre**
```sql
-- Línea 18 del RPC
WHERE mpr.cliente_nombre = cliente_nombre_param  -- ⚠️ Case-sensitive
```
Esto excluye variantes como "ASTRA ZENECA ( ESPECIAL)" y es sensible a mayúsculas.

**2. El índice único de `matriz_precios_rutas` NO incluye `origen_texto`**
```sql
matriz_precios_rutas_cliente_destino_unique  -- (cliente_nombre, destino_texto)
```
Cuando Daniela intentó crear `CIUDAD OBREGON → CUAUTITLAN IZCALLI`:
- El sistema validó contra `(ASTRA ZENECA, CUAUTITLAN IZCALLI)`
- Ya existe otra ruta con ese destino: `COYOACAN → CUAUTITLAN IZCALLI` (ID: 388ca610)
- Error 23505: "Ya existe una ruta para este cliente y destino"

**3. El mensaje de error no distingue entre origen/destino duplicado vs ruta inversa**
```typescript
// useRouteCreation.ts línea 107
setCreationError('Ya existe una ruta para este cliente y destino. Modifica el destino o usa la ruta existente.');
```
Este mensaje confunde al usuario porque la ruta inversa (con origen/destino intercambiados) no es lo mismo.

---

## Plan de Corrección

### Fase 1: Mejorar Carga de Orígenes (RPC)

**Archivo**: Nueva migración SQL

**Cambio**: Modificar el RPC para usar `ILIKE` en lugar de `=` para cliente_nombre:

```sql
-- ANTES
WHERE mpr.cliente_nombre = cliente_nombre_param

-- DESPUÉS  
WHERE LOWER(mpr.cliente_nombre) = LOWER(cliente_nombre_param)
```

Esto asegura que todos los orígenes de "ASTRA ZENECA" aparezcan aunque haya variaciones menores.

---

### Fase 2: Actualizar el Índice Único para Incluir Origen

**Archivo**: Nueva migración SQL

**Cambio**: Modificar el constraint único para incluir las 3 columnas:

```sql
-- Eliminar índice antiguo
DROP INDEX IF EXISTS matriz_precios_rutas_cliente_destino_unique;

-- Crear nuevo índice que incluye origen
CREATE UNIQUE INDEX matriz_precios_rutas_cliente_origen_destino_unique 
ON matriz_precios_rutas (cliente_nombre, origen_texto, destino_texto) 
WHERE activo = true;
```

Esto permite que existan:
- `CUAUTITLAN IZCALLI → CIUDAD OBREGON` (ida)
- `CIUDAD OBREGON → CUAUTITLAN IZCALLI` (regreso)

---

### Fase 3: Detección Inteligente de Ruta Inversa

**Archivo**: `src/pages/Planeacion/ServiceCreation/steps/RouteStep/hooks/useRouteCreation.ts`

**Cambio**: Antes de crear la ruta, verificar si existe la ruta inversa y ofrecer opciones:

```typescript
// Nuevo método: checkForInverseRoute
const checkForInverseRoute = async (
  cliente: string, 
  origen: string, 
  destino: string
): Promise<{exists: boolean; inverseRoute?: any}> => {
  const { data } = await supabase
    .from('matriz_precios_rutas')
    .select('id, origen_texto, destino_texto, valor_bruto, precio_custodio')
    .ilike('cliente_nombre', cliente)
    .ilike('origen_texto', destino)  // Invertido
    .ilike('destino_texto', origen)  // Invertido
    .eq('activo', true)
    .maybeSingle();
    
  return { exists: !!data, inverseRoute: data };
};
```

---

### Fase 4: Mejorar Mensaje de Error con Contexto

**Archivo**: `src/pages/Planeacion/ServiceCreation/steps/RouteStep/hooks/useRouteCreation.ts`

**Cambio**: Mensajes de error más específicos:

```typescript
if (error.code === '23505') {
  // Verificar si es por origen+destino exacto o solo destino
  const { data: existingRoute } = await supabase
    .from('matriz_precios_rutas')
    .select('id, origen_texto, destino_texto')
    .ilike('cliente_nombre', data.cliente_nombre)
    .ilike('destino_texto', data.destino_texto)
    .eq('activo', true)
    .maybeSingle();
    
  if (existingRoute) {
    if (normalizeText(existingRoute.origen_texto) === normalizeText(data.origen_texto)) {
      setCreationError('Esta ruta exacta ya existe. Usa la existente o modifica los datos.');
    } else {
      setCreationError(
        `Ya existe una ruta "${existingRoute.origen_texto} → ${existingRoute.destino_texto}". ` +
        `Para crear una ruta desde un origen diferente, primero actualiza el índice de rutas.`
      );
    }
  }
}
```

---

### Fase 5: UI para Sugerir Ruta Inversa

**Archivo**: `src/pages/Planeacion/ServiceCreation/steps/RouteStep/components/InlineRouteCreationForm.tsx`

**Cambio**: Mostrar sugerencia cuando se detecta ruta inversa:

```tsx
{inverseRouteExists && (
  <Alert className="bg-blue-50 border-blue-200">
    <ArrowLeftRight className="h-4 w-4" />
    <AlertDescription>
      Existe la ruta inversa: <strong>{destino} → {origen}</strong> 
      <Button 
        variant="link" 
        onClick={() => onUseInverseAsTemplate()}
        className="px-2"
      >
        Usar como referencia
      </Button>
    </AlertDescription>
  </Alert>
)}
```

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| Nueva migración SQL | Actualizar RPC `get_origenes_con_frecuencia` con ILIKE |
| Nueva migración SQL | Modificar índice único a `(cliente, origen, destino)` |
| `src/pages/Planeacion/ServiceCreation/steps/RouteStep/hooks/useRouteCreation.ts` | Añadir `checkForInverseRoute`, mejorar mensajes de error |
| `src/pages/Planeacion/ServiceCreation/steps/RouteStep/components/InlineRouteCreationForm.tsx` | Mostrar sugerencia de ruta inversa |
| `src/hooks/useOrigenesConFrecuencia.ts` | Actualizar fallback para usar ILIKE consistente |

---

## Resultado Esperado

1. **Daniela verá "CIUDAD OBREGON"** en el dropdown de orígenes si existe alguna ruta con ese origen para el cliente
2. **Podrá crear rutas inversas** sin error de duplicado
3. **El sistema sugerirá usar precios de referencia** de la ruta inversa cuando exista
4. **Mensajes de error más claros** que indican exactamente qué ruta causa el conflicto

---

## Impacto y Riesgo

| Factor | Evaluación |
|--------|------------|
| **Riesgo de datos** | Bajo - Solo se modifica un índice, los datos existentes no cambian |
| **Compatibilidad** | Alta - El nuevo índice es más permisivo |
| **Rollback** | Fácil - Se puede revertir el índice si hay problemas |
| **Usuarios afectados** | Todos los que crean servicios con rutas nuevas |
