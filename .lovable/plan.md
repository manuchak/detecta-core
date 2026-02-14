
## Fix: Separar visualmente el badge "En Riesgo" del funnel

### Problema
El badge rojo de "En Riesgo" tiene solo `mt-4` (16px) de separacion con la ultima banda del funnel (Embajador), lo que hace que parezca un sexto nivel del embudo en vez de una alerta independiente.

### Solucion
En `src/pages/CustomerSuccess/components/CSLoyaltyFunnel.tsx`, linea 91:

- Cambiar `mt-4` a `mt-8` (32px de separacion) para crear una ruptura visual clara entre el funnel trapezoidal y la alerta de riesgo.

Es un cambio de una sola clase CSS. El resultado: el funnel termina en Embajador y el badge rojo queda claramente separado como una alerta aparte.
