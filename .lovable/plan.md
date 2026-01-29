
# Plan: Actualizar Intervalo de Refresco del Clima a 2 Horas

## Estado Actual de la API

Los logs muestran que OpenWeatherMap devuelve **401 Unauthorized** para todas las ciudades. Esto es normal para API keys nuevas - pueden tardar hasta 2 horas en activarse. Una vez activa, los datos reales se mostrarán automáticamente.

## Cambio Requerido

**Archivo:** `src/hooks/useWeatherData.ts` (líneas 84-85)

### Antes
```typescript
staleTime: 10 * 60 * 1000, // Cache 10 minutos
refetchInterval: 30 * 60 * 1000, // Refetch cada 30 minutos
```

### Después
```typescript
staleTime: 60 * 60 * 1000, // Cache 1 hora
refetchInterval: 2 * 60 * 60 * 1000, // Refetch cada 2 horas
```

## Resumen

| Parámetro | Antes | Después |
|-----------|-------|---------|
| `staleTime` | 10 min | 1 hora |
| `refetchInterval` | 30 min | 2 horas |

El `staleTime` de 1 hora evita llamadas innecesarias cuando el usuario navega, y el `refetchInterval` de 2 horas reduce el consumo de la API gratuita (máximo 1000 llamadas/día = ~41/hora, con 2h tendremos margen amplio).
