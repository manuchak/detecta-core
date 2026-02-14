

## Correccion de 3 Bugs Criticos - Portal Custodio

### Diagnostico

Despues de revisar la base de datos, el codigo y las politicas RLS, identifique una cadena de problemas interconectados:

### Bug 1 y 2: Antonio y Rodrigo no ven su servicio / no pueden hacer check

**Causa raiz:** La query de `useNextService` (linea 53) busca servicios usando `custodio_telefono` normalizado (solo digitos), pero el problema es que NO hay ningun checklist en la base de datos para los servicios de hoy. Los 3 custodios tienen `hora_inicio_real` ya registrada (ya se posicionaron), pero el check nunca se guardo.

La pantalla muestra "Sin servicios pendientes" porque `useNextService` solo busca servicios con estados activos (`planificado`, `asignado`, `confirmado`, `en_transito`). Si el servicio ya fue marcado como completado o su estado cambio despues de posicionarse, desaparece de la vista.

**Hallazgo adicional para Rodrigo:** Sus stats muestran 0 en todo, lo que indica que `useCustodianServices` no encuentra servicios. Sin embargo, la DB tiene registros con su telefono correcto. Esto apunta a un problema de sesion o cache en su dispositivo, o a que su perfil phone se cargo vacio transitoriamente.

### Bug 3: Sergio hizo el check pero no aparece al equipo

**Causa raiz confirmada:** No existe NINGUN checklist para el servicio de hoy (ASCAAST-1399) en la base de datos. Sergio tiene un unico checklist guardado: ASCAAST-1383 del 12 de febrero, almacenado con telefono `55 4518 0581` (con espacios).

El problema tiene dos capas:

1. **El checklist de hoy nunca se guardo** - probablemente fallo silenciosamente o quedo en cola offline
2. **La politica RLS de `checklist_servicio` tiene un bug critico**: Solo normaliza el telefono del perfil (`replace(phone, ' ', '')`) pero NO normaliza el campo `custodio_telefono` de la tabla. Esto significa que checklists guardados con formato antiguo (con espacios) son INVISIBLES para el custodio:

```text
Columna:  '55 4518 0581'  (con espacios)
RLS:      '5545180581'    (sin espacios)
Resultado: NO MATCH -> bloqueado por RLS
```

### Solucion

#### 1. Corregir la politica RLS de checklist_servicio (CRITICO)

Normalizar AMBOS lados de la comparacion en la politica RLS:

```sql
DROP POLICY IF EXISTS "Custodios gestionan checklist propio" ON checklist_servicio;

CREATE POLICY "Custodios gestionan checklist propio"
ON checklist_servicio FOR ALL
USING (
  regexp_replace(custodio_telefono, '[^0-9]', '', 'g') = 
  regexp_replace(
    (SELECT phone FROM profiles WHERE id = auth.uid()),
    '[^0-9]', '', 'g'
  )
);
```

Esto usa `regexp_replace` para eliminar TODOS los caracteres no numericos de ambos lados, exactamente como hace `normalizePhone` en el frontend.

#### 2. Migrar datos existentes de checklist_servicio

Normalizar todos los `custodio_telefono` existentes para consistencia futura:

```sql
UPDATE checklist_servicio 
SET custodio_telefono = regexp_replace(custodio_telefono, '[^0-9]', '', 'g')
WHERE custodio_telefono ~ '[^0-9]';
```

#### 3. Agregar resiliencia a useNextService

Modificar `src/hooks/useNextService.ts` para:
- Incluir servicios que ya tienen `hora_inicio_real` pero NO tienen checklist completado (estos son servicios "en progreso" donde el custodio aun necesita hacer el check)
- No filtrar por `estado_planeacion` cuando `hora_inicio_real` existe, ya que el estado puede cambiar despues del posicionamiento

Cambio especifico: Remover el filtro `.in('estado_planeacion', [...])` para servicios de hoy y en su lugar filtrar servicios que NO esten cancelados/completados. Esto amplia la ventana de visibilidad.

```typescript
// Antes: filtro restrictivo
.in('estado_planeacion', ['planificado', 'asignado', 'confirmado', 'en_transito', ...])

// Despues: filtro permisivo (excluir solo terminales)
.not('estado_planeacion', 'in', '(cancelado,completado,finalizado)')
```

#### 4. Agregar feedback de error visible en el guardado de checklist

En `src/hooks/useServiceChecklist.ts`, mejorar el manejo de errores para que el custodio sepa si el guardado fallo:

- Agregar `console.error` con detalle del error RLS
- Mostrar toast persistente (no auto-dismiss) cuando falla el guardado
- Agregar retry automatico con backoff

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| Nueva migracion SQL | RLS policy fix + data normalization |
| `src/hooks/useNextService.ts` | Ampliar filtro de estados para incluir servicios con hora_inicio_real |
| `src/hooks/useServiceChecklist.ts` | Mejorar feedback de errores en save |

### Resultado esperado

- Los 3 custodios veran sus servicios del dia
- Los checklists se guardaran correctamente y seran visibles tanto para el custodio como para el equipo de monitoreo
- Los checklists historicos con telefono en formato antiguo seguiran siendo accesibles

