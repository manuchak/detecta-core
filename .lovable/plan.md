
## Diagnostico: Hector Reyes Abendano - Checklist bloqueado

### Causa raiz identificada

Hector **no tenia documentos** antes de hoy. El `OnboardingGuard` lo redirigía a `/custodian/onboarding` cada vez que intentaba acceder al portal. Hector subio sus 3 documentos hoy (12:08-12:11 UTC), pero hay dos problemas activos:

1. **Documentos con vigencia de hoy (2026-02-17)**: La licencia y tarjeta de circulacion vencen HOY. Manana el `OnboardingGuard` lo bloqueara de nuevo porque la validacion `fecha_vigencia >= today` fallara.

2. **Cache no se invalida despues del onboarding**: Si Hector subio los documentos en `/custodian/onboarding` pero el `OnboardingGuard` no recibe la actualizacion del query de documentos, queda atrapado en un loop de redireccion.

### Correccion inmediata (datos)

Actualizar las fechas de vigencia de los documentos de Hector a fechas reales (no la fecha de hoy):

```sql
-- Ejecutar en Cloud View > Run SQL (Live)
UPDATE documentos_custodio 
SET fecha_vigencia = '2027-02-17'  -- 1 año de vigencia
WHERE custodio_telefono = '5517970534' 
  AND tipo_documento IN ('licencia_conducir', 'tarjeta_circulacion');
```

### Correccion de codigo (prevenir recurrencia)

**Archivo: `src/components/custodian/OnboardingGuard.tsx`**

1. Agregar invalidacion explicita del query de documentos despues del onboarding, para que al volver del flujo de carga, el guard re-evalúe con datos frescos.
2. Cambiar la navegacion al onboarding para pasar un `state` que indique el motivo (documentos faltantes vs expirados) para mejor UX.

**Archivo: `src/hooks/useCustodianDocuments.ts`**

3. Reducir `staleTime` de 5 minutos a 30 segundos para documentos, ya que en flujos de onboarding el cache de 5 minutos causa que el guard no detecte documentos recien subidos.

### Secuencia de implementacion

| Paso | Archivo | Cambio |
|------|---------|--------|
| 1 | SQL (manual en Live) | Actualizar fecha_vigencia de Hector a 2027-02-17 |
| 2 | `OnboardingGuard.tsx` | Agregar `refetchOnMount: 'always'` hint y reducir cache en el contexto del guard |
| 3 | `useCustodianDocuments.ts` | Reducir `staleTime` a 30s para evitar cache stale durante onboarding |

### Detalles tecnicos

El flujo actual tiene un gap:

```text
1. Custodio accede a /custodian
2. OnboardingGuard carga documentos (query con staleTime: 5min)
3. No tiene docs → redirige a /custodian/onboarding
4. Sube documentos exitosamente
5. Navega de vuelta a /custodian
6. OnboardingGuard usa CACHE de paso 2 (5min sin expirar)
7. Cache dice "sin documentos" → redirige OTRA VEZ a onboarding
8. Loop hasta que cache expire
```

La correccion asegura que al volver del onboarding, el query se re-ejecuta inmediatamente.
