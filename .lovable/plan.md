

# Agregar Service Radar al menú lateral

La ruta `/monitoring/radar` existe y la página funciona, pero no se agregó al `navigationConfig.ts`, por lo que no aparece en el sidebar.

## Cambio

**`src/config/navigationConfig.ts`** — Agregar un item después de "Modo TV (Videowall)" (línea 480):

```typescript
{
  id: 'monitoring_radar',
  label: 'Radar Operativo',
  path: '/monitoring/radar',
  icon: Radar,  // de lucide-react (ya usado en ServiceRadarPage)
  roles: ['admin', 'owner', 'monitoring', 'monitoring_supervisor', 'coordinador_operaciones']
},
```

También verificar que `Radar` esté importado de `lucide-react` en los imports del archivo.

Un solo archivo, un solo cambio.

