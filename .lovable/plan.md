
## Corregir orden de clientes en donut de Servicios por Cliente

### Problema

La lista `clientsMTD` se genera en `useExecutiveMultiYearData.ts` ordenada por **GMV** (linea 221). Tanto el donut de "GMV por Cliente" como el de "Servicios por Cliente" usan esa misma lista con `.slice(0, 10)` sin re-ordenar. El resultado es que LOGER aparece antes que ASTRA ZENECA a pesar de tener menos servicios, porque LOGER genera mas GMV.

### Solucion

Modificar `ClientServiceDonut.tsx` para re-ordenar `clientsMTD` por numero de servicios antes de tomar el top 10.

**Archivo:** `src/components/executive/ClientServiceDonut.tsx`

Cambiar:
```ts
const top10 = clientsMTD.slice(0, 10);
```

Por:
```ts
const top10 = [...clientsMTD].sort((a, b) => b.services - a.services).slice(0, 10);
```

Tambien ajustar el calculo de "Otros" para que use la lista completa ordenada por servicios:
```ts
const sorted = [...clientsMTD].sort((a, b) => b.services - a.services);
const top10 = sorted.slice(0, 10);
const othersSvc = sorted.slice(10).reduce((sum, c) => sum + c.services, 0);
```

### Resultado

- El donut de **Servicios por Cliente** mostrara ASTRA ZENECA primero (24%) y LOGER segundo (14%)
- El donut de **GMV por Cliente** seguira mostrando el orden por GMV (sin cambios)
- No se modifica ninguna otra tarjeta ni dato
