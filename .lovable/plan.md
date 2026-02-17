

## Fix: Año 2026 no aparece en el Generador de Informes

### Causa raiz

En `src/pages/Dashboard/ReportsPage.tsx`, linea 18, la lista de años esta hardcodeada:

```
const YEARS = [2024, 2025];
```

No incluye 2026 ni se calcula dinamicamente.

### Correccion

Cambiar la constante `YEARS` para que se genere dinamicamente basandose en el año actual, cubriendo desde 2024 hasta el año en curso:

```typescript
const YEARS = Array.from(
  { length: currentYear - 2024 + 1 },
  (_, i) => 2024 + i
);
```

Esto generara `[2024, 2025, 2026]` automaticamente y seguira funcionando en años futuros sin necesidad de cambios manuales.

### Archivo a modificar

| Archivo | Cambio |
|---------|--------|
| `src/pages/Dashboard/ReportsPage.tsx` | Linea 18: reemplazar array hardcodeado por generacion dinamica |

Un cambio de una sola linea, sin impacto en otros componentes.

