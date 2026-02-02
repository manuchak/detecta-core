

# Plan de Depuración y QA - Módulo de Planeación

## Resumen Ejecutivo

Se identificaron **8 bugs críticos** y **6 áreas de riesgo** que requieren atención antes de publicar los cambios recientes de las Epics 1-6 y el Polish UI.

---

## Bugs Críticos Identificados

### BUG-001: React.Fragment recibe prop inválida
**Severidad:** 🔴 Alta  
**Archivo:** `src/components/navigation/UnifiedSidebar.tsx` (línea ~418)  
**Error en consola:**
```
Warning: Invalid prop `data-lov-id` supplied to `React.Fragment`.
```

**Causa:** Se está pasando `data-lov-id` a un `<Fragment>` o `<>` que solo acepta `key` y `children`.

**Fix propuesto:**
```typescript
// ANTES (problemático)
{items.map((item) => (
  <Fragment data-lov-id="x">  // ❌
    {renderItem(item)}
  </Fragment>
))}

// DESPUÉS (corregido)
{items.map((item) => (
  <div key={item.id}>  // ✅ o simplemente remover el Fragment
    {renderItem(item)}
  </div>
))}
```

---

### BUG-002: RPC "structure of query does not match function result type"
**Severidad:** 🔴 Crítica  
**Frecuencia:** 25+ errores en los últimos minutos  
**Fuente:** Logs de Supabase Analytics

**Causa probable:**
- Se modificó una función RPC sin actualizar los tipos TypeScript
- Posible desincronización entre `get_custodios_activos_disponibles` y la interfaz esperada
- O la nueva tabla `custodio_rechazos` tiene columnas que no coinciden con algún tipo

**Diagnóstico necesario:**
1. Verificar schema de `custodio_rechazos` vs tipos en `supabase/types.ts`
2. Verificar retorno de `get_custodios_activos_disponibles` vs `CustodioConProximidad`
3. Verificar `verificar_disponibilidad_equitativa_custodio` retorno

---

### BUG-003: Columna `profiles.table_name` no existe
**Severidad:** 🟡 Media  
**Error:** `column profiles.table_name does not exist`

**Causa:** Alguna query o RPC está intentando acceder a una columna que no existe en la tabla `profiles`.

**Diagnóstico:** Buscar referencias a `profiles.table_name` en el código.

---

### BUG-004: Posible Memory Leak en CustodianCard
**Severidad:** 🟡 Media  
**Archivo:** `src/pages/Planeacion/ServiceCreation/steps/CustodianStep/components/CustodianCard.tsx`

**Problema:** La animación `handleRejectWithAnimation` usa `await new Promise(setTimeout)` pero si el componente se desmonta antes de los 300ms, puede causar state updates en componente desmontado.

**Fix propuesto:**
```typescript
const handleRejectWithAnimation = async () => {
  const isMounted = useRef(true);
  useEffect(() => () => { isMounted.current = false; }, []);
  
  if (cardRef.current) {
    cardRef.current.classList.add('animate-fade-out-left');
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  if (isMounted.current) {  // Guard
    onReportRejection?.();
  }
};
```

---

### BUG-005: Filtro 90 días persiste en localStorage incorrectamente
**Severidad:** 🟡 Media  
**Archivo:** `src/hooks/useArmedGuardFilters.ts`

**Problema:** El filtro se guarda en localStorage pero el fix que cambia default a `false` puede no aplicarse a usuarios existentes que ya tenían `true` guardado.

**Fix propuesto:** Agregar lógica de migración:
```typescript
// En useArmedGuardFilters.ts
const saved = localStorage.getItem(STORAGE_KEY);
if (saved) {
  const parsed = JSON.parse(saved);
  // MIGRATION: Force 90-day filter to off for existing users
  if (parsed.soloConActividad90Dias === true) {
    parsed.soloConActividad90Dias = false;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
  }
  return { ...DEFAULT_FILTER_CONFIG, ...parsed };
}
```

---

### BUG-006: Race Condition en Hydration del ServiceCreation
**Severidad:** 🟡 Media  
**Archivo:** `src/pages/Planeacion/ServiceCreation/hooks/useServiceCreation.tsx`

**Problema:** Múltiples `requestAnimationFrame` callbacks en secuencia pueden crear timing issues si el usuario navega rápidamente.

**Síntoma potencial:** Datos del borrador no restaurados correctamente al cargar rápidamente.

**Fix propuesto:** Usar una sola hydration flag con cleanup:
```typescript
useEffect(() => {
  let cancelled = false;
  
  const hydrate = async () => {
    // ... hydration logic
    if (!cancelled) {
      setIsHydrated(true);
    }
  };
  
  hydrate();
  return () => { cancelled = true; };
}, [draftIdFromUrl]);
```

---

## Áreas de Riesgo (Requieren Testing Manual)

### RISK-001: Workflow Completo de Creación de Servicio
**Pasos a probar:**
1. Crear servicio nuevo desde cero
2. Seleccionar cliente existente
3. Seleccionar ruta existente vs nueva
4. Asignar custodio (verificar badges Gini funcionan)
5. Registrar rechazo y verificar exclusión 7 días
6. Asignar armado interno
7. Confirmar y crear servicio
8. Verificar servicio aparece en dashboard

### RISK-002: Edición de Servicio Existente
**Pasos a probar:**
1. Abrir servicio existente
2. Modificar solo un campo (ej: observaciones)
3. Guardar y verificar que NO se modifica fecha_hora_cita (bug de timezone)
4. Verificar draft persistence funciona

### RISK-003: Visualización de Armados
**Pasos a probar:**
1. Abrir asignación de armado
2. Verificar lista NO está vacía (bug del filtro 90 días)
3. Toggle "Mostrar todos" funciona
4. Asignar proveedor externo
5. Asignar armado interno

### RISK-004: Pestañas de Configuración (Zonas)
**Pasos a probar:**
1. Navegar a Planeación > Configuración > Zonas Base
2. Verificar métricas apple-metric se renderizan
3. Editar zona de un custodio
4. Verificar toast de confirmación

### RISK-005: Persistencia de Draft
**Pasos a probar:**
1. Iniciar creación de servicio
2. Llenar paso 1 y 2
3. Cerrar pestaña
4. Reabrir URL con draft ID
5. Verificar estado restaurado correctamente
6. Verificar banner "Borrador restaurado" aparece

### RISK-006: Rechazos Persistentes
**Pasos a probar:**
1. En paso de custodio, rechazar uno
2. Verificar animación fade-out
3. Verificar custodio no aparece en lista
4. Verificar registro en tabla `custodio_rechazos`
5. Crear otro servicio y verificar sigue excluido

---

## Plan de Acción por Prioridad

### P0 - Inmediato (Bloqueantes)

| ID | Acción | Archivo | Estimado |
|----|--------|---------|----------|
| BUG-001 | Fix React.Fragment prop | UnifiedSidebar.tsx | 10 min |
| BUG-002 | Diagnosticar RPC mismatch | Supabase functions | 30 min |
| BUG-003 | Buscar y corregir profiles.table_name | Global search | 15 min |

### P1 - Antes de Publicar

| ID | Acción | Archivo | Estimado |
|----|--------|---------|----------|
| BUG-004 | Guard async animation | CustodianCard.tsx | 15 min |
| BUG-005 | Migración localStorage | useArmedGuardFilters.ts | 10 min |
| BUG-006 | Cleanup hydration race | useServiceCreation.tsx | 20 min |

### P2 - Testing Manual

| ID | Acción | Owner | Tiempo |
|----|--------|-------|--------|
| RISK-001 | Workflow creación | QA | 30 min |
| RISK-002 | Workflow edición | QA | 20 min |
| RISK-003 | Armados | QA | 15 min |
| RISK-004 | Config zonas | QA | 10 min |
| RISK-005 | Draft persistence | QA | 15 min |
| RISK-006 | Rechazos | QA | 15 min |

---

## Checklist Pre-Publicación

```text
[ ] BUG-001: Fragment prop removida
[ ] BUG-002: RPCs verificadas sin errores
[ ] BUG-003: Query profiles corregida
[ ] BUG-004: Animation guard implementado
[ ] BUG-005: Migration localStorage agregada
[ ] BUG-006: Hydration race corregida
[ ] Console: Sin errores ni warnings
[ ] Network: Sin requests fallidos 
[ ] RISK-001-006: Testing manual completado
[ ] Revisión final con rol planificador
```

---

## Comandos de Diagnóstico

### Verificar errores de consola en tiempo real:
```bash
# En browser DevTools:
localStorage.getItem('detecta-armados-filter-config')
localStorage.getItem('service-draft-[draft-id]')
```

### Query para verificar rechazos activos:
```sql
SELECT custodio_id, fecha_rechazo, vigencia_hasta, motivo 
FROM custodio_rechazos 
WHERE vigencia_hasta > NOW()
ORDER BY fecha_rechazo DESC;
```

### Query para verificar estructura de RPC:
```sql
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'get_custodios_activos_disponibles';
```

