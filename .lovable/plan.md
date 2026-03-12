

# Badge "Récord del día" en DailyServicesChart

## Cambio

Agregar un badge compacto junto al título que muestre el día con más servicios del mes y su cantidad. Se calcula con un simple `reduce` sobre `dailyCurrent`.

## Diseño

```text
┌─────────────────────────────────────────────┐
│ 📈 Servicios Diarios (Mes Actual)  🏆 59 · 3 Mar │
│                                             │
│   [gráfica línea sin cambios]               │
└─────────────────────────────────────────────┘
```

- **Desktop**: Badge inline a la derecha del título con `Trophy` icon (12px), texto "59 · 3 Mar"
- **Móvil**: El badge baja debajo del título como segunda línea para no comprimirse

## Implementación

**Archivo**: `src/components/executive/DailyServicesChart.tsx`

1. Calcular `recordDay` con `useMemo` — find max `services` en `dailyCurrent`
2. Agregar badge después del `CardTitle` usando la clase `Badge` existente con variant `secondary`
3. Layout responsive: `flex-wrap` en el header para que en móvil el badge fluya a segunda línea
4. Icono `Trophy` de lucide-react (h-3 w-3) + texto compacto

Sin cambios en hooks ni datos — todo derivado del array `dailyCurrent` existente.

