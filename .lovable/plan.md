
# Plan: Corregir Bug de Custodios No Cargando en Creacion de Servicios

## Problema Identificado

Los usuarios de planeacion ven "Sin datos de custodios" con 0 resultados cuando intentan asignar un custodio durante la creacion de servicios.

## Causas Raiz Identificadas

### Bug 1: Race Condition en Sincronizacion de Estado (PRINCIPAL)

El `useServiceStepLogic` sincroniza el estado local (`hora`, `fecha`, etc.) al contexto `formData` via `useEffect`, que es **asincrono**. Cuando el usuario hace clic en "Continuar":

```text
1. Usuario establece hora = "08:00"
2. canContinue se evalua como TRUE (usa estado local)
3. Usuario hace clic en "Continuar"
4. nextStep() navega a CustodianStep INMEDIATAMENTE
5. PERO el useEffect que sincroniza hora a formData NO ha ejecutado aun
6. CustodianStep lee formData.hora = "" (valor viejo)
7. servicioNuevo = undefined (requiere hora)
8. isReadyToQuery = false
9. La query NUNCA se ejecuta
10. Resultado: 0 custodios mostrados
```

**Archivo afectado**: `useServiceStepLogic.ts` lineas 145-179

### Bug 2: Funcion RPC No Filtra Roles Inactivos (SECUNDARIO)

La funcion `get_current_user_role_secure` no filtra por `is_active = true`:

```sql
-- ACTUAL (BUGGY)
SELECT role INTO found_role 
FROM public.user_roles 
WHERE user_id = auth.uid()
ORDER BY priority...
LIMIT 1;

-- DEBERIA SER
SELECT role INTO found_role 
FROM public.user_roles 
WHERE user_id = auth.uid()
  AND is_active = true  -- FALTA ESTE FILTRO
ORDER BY priority...
LIMIT 1;
```

**Usuarios afectados**:
- `vanessa.monsalvo@detectasecurity.io` - planificador inactivo
- `karla@detectasecurity.io` - admin inactivo

## Solucion Propuesta

### Fix 1: Sincronizacion Sincrona Antes de Navegacion

**Archivo**: `useServiceStepLogic.ts`

Agregar funcion `syncToContext()` que actualiza formData de forma sincrona y llamarla desde ServiceStep antes de `nextStep()`:

```typescript
// useServiceStepLogic.ts
const syncToContext = useCallback(() => {
  updateFormData({
    servicioId,
    idInterno,
    fechaRecepcion,
    horaRecepcion,
    fecha,
    hora,
    tipoServicio,
    requiereArmado,
    esServicioRetorno,
    gadgets,
    observaciones,
  });
}, [updateFormData, servicioId, idInterno, ...]);

return {
  // ... existing returns
  syncToContext, // NUEVO
};
```

```typescript
// ServiceStep/index.tsx
const handleContinue = () => {
  syncToContext(); // Forzar sync ANTES de navegar
  markStepCompleted('service');
  nextStep();
};
```

### Fix 2: Guard de Disponibilidad en CustodianStep

**Archivo**: `CustodianStep/index.tsx`

Agregar estado de espera si `formData.hora` no esta disponible:

```typescript
// Si no tenemos los datos necesarios, mostrar estado de espera
if (isHydrated && (!formData.fecha || !formData.hora)) {
  return (
    <Alert>
      <AlertTitle>Esperando datos del servicio...</AlertTitle>
      <AlertDescription>
        Cargando informacion de fecha y hora del servicio.
        <Button onClick={previousStep}>Volver a Detalles</Button>
      </AlertDescription>
    </Alert>
  );
}
```

### Fix 3: Corregir Filtro de Roles Activos

**Migracion SQL**:

```sql
CREATE OR REPLACE FUNCTION public.get_current_user_role_secure()
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  found_role TEXT;
BEGIN
  SELECT role INTO found_role 
  FROM public.user_roles 
  WHERE user_id = auth.uid()
    AND is_active = true  -- NUEVO FILTRO
  ORDER BY
    CASE role
      WHEN 'owner' THEN 1
      WHEN 'admin' THEN 2
      WHEN 'supply_admin' THEN 3
      WHEN 'planificador' THEN 4  -- Agregar planificador
      WHEN 'coordinador_operaciones' THEN 5
      ELSE 10
    END
  LIMIT 1;
  
  RETURN COALESCE(found_role, 'unverified');
END;
$$;
```

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `useServiceStepLogic.ts` | Agregar `syncToContext()` para sincronizacion sincrona |
| `ServiceStep/index.tsx` | Llamar `syncToContext()` antes de `nextStep()` |
| `CustodianStep/index.tsx` | Agregar guard para datos faltantes |
| Nueva migracion SQL | Corregir `get_current_user_role_secure` con filtro `is_active` |

## Flujo Corregido

```text
1. Usuario establece hora = "08:00"
2. Usuario hace clic en "Continuar"
3. syncToContext() actualiza formData SINCRONICAMENTE
4. markStepCompleted('service')
5. nextStep() navega a CustodianStep
6. CustodianStep lee formData.hora = "08:00" (correcto)
7. servicioNuevo se crea correctamente
8. isReadyToQuery = true
9. Query se ejecuta y retorna custodios
10. UI muestra lista de custodios
```

## Impacto

- **Usuarios afectados**: Todos los planificadores que crean servicios
- **Severidad**: Alta - bloquea flujo critico de negocio
- **Riesgo de regresion**: Bajo - cambios aislados a sincronizacion de estado

## Notas Tecnicas

- El bug de race condition es un patron comun en React cuando se usa useEffect para sincronizar estado entre componentes
- La solucion preferida es sincronizacion explicita antes de navegacion en lugar de depender de efectos asincronos
- El guard en CustodianStep actua como red de seguridad adicional
