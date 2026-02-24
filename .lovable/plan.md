

# Interfaz para Suspender Penalidades por Rechazo

## Contexto del Problema

La tabla `custodio_rechazos` tiene vigencia fija de 7 dias. Cuando un analista registra un rechazo por motivos temporales (ej: "buscando casa con su hijo" por 1 dia), el custodio queda excluido los 7 dias completos. No existe forma de levantar la penalidad anticipadamente.

### Restricciones actuales

- La tabla solo tiene politicas RLS para SELECT e INSERT -- **no hay politica UPDATE** (no se puede modificar `vigencia_hasta`)
- No existe UI para gestionar rechazos vigentes

---

## Solucion

### 1. Migracion SQL: Agregar politica UPDATE

Crear una politica RLS que permita a usuarios con acceso a planeacion actualizar rechazos (para poder expirar la vigencia):

```sql
CREATE POLICY "Planeacion puede actualizar rechazos" 
ON public.custodio_rechazos
FOR UPDATE USING (puede_acceder_planeacion());
```

### 2. Hook: `useSuspenderRechazo` (en `src/hooks/useCustodioRechazos.ts`)

Agregar una mutacion al archivo existente que:
- Reciba el `id` del rechazo
- Haga UPDATE de `vigencia_hasta` a `NOW()` (expira inmediatamente)
- Invalide las queries de rechazos vigentes y custodios disponibles
- Registre quien levanto la penalidad (via campo `motivo` append: " | Suspendido por [usuario] el [fecha]")

### 3. Boton "Levantar Penalidad" en ExcludedCustodiansAlert

Modificar `ExcludedCustodiansAlert.tsx` para agregar un boton junto al detalle del rechazo individual (caso de 1 match):

```text
ANTES:
  "linares" coincide con un custodio excluido
  ROBERTO LINARES MACIAS -- Rechazo vigente hasta 24 de feb...
  Reportado por: Daniela Michelle Castaneda Almaguer

DESPUES:
  "linares" coincide con un custodio excluido
  ROBERTO LINARES MACIAS -- Rechazo vigente hasta 24 de feb...
  Reportado por: Daniela Michelle Castaneda Almaguer
  [Levantar Penalidad]  <-- boton nuevo
```

Al hacer click:
- Dialog de confirmacion: "Vas a levantar la penalidad de ROBERTO LINARES MACIAS. Aparecera de nuevo en la lista de custodios disponibles. Confirmar?"
- Al confirmar, ejecuta la mutacion que expira el rechazo
- La lista de custodios se refresca automaticamente y el custodio aparece disponible

### 4. Panel de Gestion de Rechazos Vigentes (nuevo componente)

Crear `src/components/planeacion/RechazosVigentesPanel.tsx`:
- Tabla con todos los rechazos vigentes: Nombre, Motivo, Vigencia hasta, Reportado por
- Boton "Levantar" por fila con la misma logica de confirmacion
- Accesible desde un boton en la toolbar de CustodianStep y PendingAssignmentModal (icono de escudo/ban con badge de conteo)

---

## Archivos a modificar/crear

| Archivo | Cambio |
|---------|--------|
| Nueva migracion SQL | Politica UPDATE en `custodio_rechazos` |
| `src/hooks/useCustodioRechazos.ts` | Agregar mutacion `useSuspenderRechazo` |
| `src/pages/Planeacion/ServiceCreation/steps/CustodianStep/components/ExcludedCustodiansAlert.tsx` | Agregar boton "Levantar Penalidad" con dialog de confirmacion |
| `src/components/planeacion/RechazosVigentesPanel.tsx` | Nuevo: panel de gestion de rechazos vigentes |
| `src/pages/Planeacion/ServiceCreation/steps/CustodianStep/index.tsx` | Agregar boton para abrir RechazosVigentesPanel |
| `src/components/planeacion/PendingAssignmentModal.tsx` | Agregar boton para abrir RechazosVigentesPanel |

## Seguridad

- Solo usuarios con acceso a planeacion (`puede_acceder_planeacion()`) pueden levantar penalidades
- Se registra quien levanto la penalidad en el campo `motivo` como audit trail
- La accion requiere confirmacion explicita via dialog
