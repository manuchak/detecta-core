
# UX: Indicador de Exclusion de Custodios en Busqueda

## Problema

Cuando un planificador busca un custodio por nombre (ej: "Alejandro Zavala") y no lo encuentra en la lista, no tiene ninguna retroalimentacion de POR QUE no aparece. El sistema simplemente no lo muestra. Esto genera:
1. Frustracion inmediata
2. Escalacion innecesaria por Slack/WhatsApp
3. Perdida de tiempo operativo

## Diagnostico tecnico

Hay 3 razones por las que un custodio puede no aparecer en la lista de asignacion:

| Razon | Donde se filtra | Visible al planificador? |
|---|---|---|
| Rechazo vigente (7 dias) | `CustodianStep/index.tsx` linea 120: `.filter(c => !rechazadosIds.includes(c.id))` | NO |
| Conflicto horario / indisponible | Categorizado en `noDisponibles` por `useProximidadOperacional` | Solo si la lista completa queda vacia (NoCustodiansAlert) |
| No esta activo en BD | RPC `get_custodios_activos_disponibles` lo excluye | NO |

El `NoCustodiansAlert` actual solo aparece cuando `filteredCustodians.length === 0`. Si hay 3 de 75 resultados (como en la captura), no se muestra nada.

## Solucion: Banner de exclusion contextual

Un banner inline (NO toast) que aparece debajo del search cuando se detecta que hay custodios excluidos por rechazos o en conflicto. El banner:

1. Solo aparece cuando hay busqueda activa Y hay custodios rechazados o en conflicto
2. Muestra conteos concretos: "X custodios excluidos por rechazo vigente, Y con conflicto horario"
3. Permite accion: boton para "Ver en conflictos" que scrollea a la seccion de conflictos
4. Es un Alert sutil (no destructive), persistente mientras dure la busqueda

### Por que NO un toast

- Los toasts desaparecen en 5 segundos -- el planificador puede no verlo
- Los toasts no son accionables (no puedes poner un boton "Ver detalles")
- El problema es contextual a la busqueda, no un evento puntual
- Un banner inline junto al search es la ubicacion natural donde el ojo ya esta mirando

## Cambios por archivo

### 1. Nuevo componente: `ExcludedCustodiansAlert.tsx`

Ubicacion: `src/pages/Planeacion/ServiceCreation/steps/CustodianStep/components/`

Componente Alert que recibe:
- `searchTerm`: string (para saber si hay busqueda activa)
- `rechazadosCount`: numero de custodios excluidos por rechazo vigente
- `conflictoCount`: numero de custodios en la categoria `noDisponibles`
- `rechazadosMatchingSearch`: numero de rechazados cuyo nombre coincide con la busqueda (para el mensaje especifico "El custodio X tiene un rechazo vigente")
- `onViewConflicts`: callback para scrollear a la seccion de conflictos

Logica de visibilidad:
- Se oculta si no hay busqueda activa
- Se oculta si no hay rechazados ni conflictos
- Muestra mensaje especifico si exactamente 1 rechazado coincide con la busqueda
- Muestra mensaje generico si hay multiples exclusiones

### 2. Modificar: `CustodianStep/index.tsx`

- Calcular `rechazadosMatchingSearch`: cruzar la lista de `rechazadosIds` con los custodios de `noDisponibles` que coincidan con el searchTerm
- Insertar `ExcludedCustodiansAlert` entre el `CustodianSearch` y el `CustodianList`
- Pasar los conteos y la busqueda activa

### 3. Modificar: `PendingAssignmentModal.tsx`

Mismo patron: insertar el `ExcludedCustodiansAlert` en el modal de asignacion pendiente, que comparte los mismos componentes de busqueda.

## Ejemplo visual del banner

Cuando el planificador busca "Zavala" y el custodio tiene rechazo vigente:

```text
+----------------------------------------------------------+
| (i) "Zavala" coincide con 1 custodio excluido            |
|     - ALEJANDRO ZAVALA: Rechazo vigente (vence 24 Feb)   |
|                                        [Ver detalles]    |
+----------------------------------------------------------+
```

Cuando hay exclusiones genericas:

```text
+----------------------------------------------------------+
| (i) 5 custodios no visibles: 2 con rechazo vigente,      |
|     3 con conflicto horario      [Ver en conflictos]     |
+----------------------------------------------------------+
```

## Impacto esperado

- Elimina escalaciones tipo "no me aparece Zavala" por Slack
- El planificador entiende inmediatamente la razon y puede tomar accion (esperar que expire el rechazo, asignar con override, contactar a otro)
- Cero cambios en la logica de negocio -- solo visibilidad
