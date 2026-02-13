

## Aumentar límite de consulta a 200 servicios por tabla

Cambio directo en `src/hooks/useCustodianServices.ts`:

- **Línea 90**: Cambiar `.limit(50)` a `.limit(200)` en la query de `servicios_custodia`
- **Línea 109**: Cambiar `.limit(50)` a `.limit(200)` en la query de `servicios_planificados`

Esto permite que custodios con mucho historial vean hasta 400 servicios combinados (200 legacy + 200 planificados), con deduplicación automática por `id_servicio`.

