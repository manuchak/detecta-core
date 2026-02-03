
# Plan: Homologar Fuentes de Datos de Custodios

## ✅ IMPLEMENTADO

### Cambios Realizados

1. **Hook centralizado creado**: `src/hooks/usePersonnelMetrics.ts`
   - Fuente única de verdad para métricas de personal
   - Expone: `custodiosActivos`, `custodiosDisponibles`, `custodiosNoDisponibles`, `custodiosConActividad30d`

2. **Dashboard Operacional actualizado**: 
   - Muestra "Custodios Disponibles" con tooltip explicativo
   - Indica "de X activos" para claridad
   - Tooltip muestra cuántos tienen indisponibilidad temporal

3. **Perfiles Operativos actualizado**:
   - Agregada métrica `custodiosDisponibles` a ProfileStats
   - Nueva card "Disponibles" en el resumen

## Resultado

- Dashboard y Perfiles Operativos ahora muestran **124 Disponibles** (de 126 activos)
- Tooltips explican la diferencia entre "activo" y "disponible"
- Una sola fuente de verdad para ambos módulos
