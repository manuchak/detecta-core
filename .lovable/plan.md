
# Fix: Permitir cantidad multiple en "GPS Portatil con Caja Imantada"

## Problema

Daniela reporta que al seleccionar "GPS Portatil con Caja Imantada" no puede colocar la cantidad. Esto ocurre porque el gadget esta configurado con `allowMultiple: false` y `maxQuantity: 1`, lo cual oculta el stepper de cantidad y solo muestra un checkbox on/off.

## Causa raiz

La configuracion del gadget en `GADGET_OPTIONS` tiene:

```text
allowMultiple: false, maxQuantity: 1
```

Esto le indica al componente `GadgetQuantitySelector` que NO muestre los botones +/- de cantidad.

## Cambio requerido

Cambiar `allowMultiple: true` y `maxQuantity: 5` (misma logica que Candado Satelital) en **2 archivos** donde se define esta configuracion:

| Archivo | Linea | Cambio |
|---|---|---|
| `src/pages/Planeacion/ServiceCreation/steps/ServiceStep/components/GadgetSection.tsx` | 34-35 | `allowMultiple: true, maxQuantity: 5` |
| `src/pages/Planeacion/components/workflow/ServiceAutoFillStep.tsx` | 495 | `allowMultiple: true, maxQuantity: 5` |

## Analisis de impacto (por que NO rompe nada)

1. **`handleGadgetChange`** en `useServiceStepLogic.ts` ya maneja cualquier cantidad numerica — almacena `Record<string, number>` sin restricciones por gadget ID.
2. **Persistencia en BD** — los gadgets se guardan como JSON (`gadgets_seguridad`), por lo que aceptar cantidad > 1 no requiere cambios de esquema.
3. **`CompactServiceCard.tsx`** — ya muestra correctamente la cantidad junto al nombre del gadget, sin logica especial por tipo.
4. **`GadgetQuantitySelector`** — el componente ya soporta el stepper cuando `allowMultiple: true`; no requiere cambios.

## Riesgo: Ninguno

Es un cambio de configuracion puro (2 valores booleanos + 2 numeros). No se modifica logica, componentes, ni esquema de base de datos.
