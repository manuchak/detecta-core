

# Diagnóstico: Custodio no puede registrar mantenimientos

## Causa raíz encontrada

**`useCustodianMaintenance.ts` no normaliza el teléfono** antes de consultar e insertar en `custodio_mantenimientos`.

La tabla `profiles.phone` almacena teléfonos con formato humano (ej: `"55 8035 5637"`), pero `custodio_mantenimientos.custodio_telefono` usa dígitos limpios (ej: `"5580355637"`).

Otros hooks como `useCustodianServices`, `useNextService` y `useCustodianDocuments` ya usan `normalizePhone()` de `@/lib/phoneUtils`. **Pero `useCustodianMaintenance` no lo hace.**

Esto causa:
1. **SELECT** con `.eq('custodio_telefono', '55 8035 5637')` → **0 resultados** (no encuentra registros existentes)
2. **INSERT** con `custodio_telefono: '55 8035 5637'` → El registro se crea pero con el teléfono incorrecto, así que nunca aparece en futuras consultas
3. Los 6 "vencidos" que ve Rogelio son **falsos positivos**: como no se encuentran registros, todos los mantenimientos aparecen como vencidos (km_último = 0)

## Corrección

**Archivo**: `src/hooks/useCustodianMaintenance.ts`

1. Importar `normalizePhone` de `@/lib/phoneUtils`
2. Normalizar `custodianPhone` al inicio del hook
3. Usar el teléfono normalizado en todas las queries (SELECT e INSERT)

Cambios mínimos — solo 3 líneas:

```ts
import { normalizePhone } from '@/lib/phoneUtils';

export const useCustodianMaintenance = (rawPhone?: string, currentKm?: number) => {
  const custodianPhone = rawPhone ? normalizePhone(rawPhone) : undefined;
  // ... rest del hook usa custodianPhone normalizado
```

**También**: corregir los registros existentes mal guardados (con espacios) mediante una migración SQL de limpieza:

```sql
UPDATE custodio_mantenimientos 
SET custodio_telefono = regexp_replace(custodio_telefono, '\D', '', 'g')
WHERE custodio_telefono ~ '\D';
```

Y lo mismo para `custodio_configuracion_mantenimiento`.

