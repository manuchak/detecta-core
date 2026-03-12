

# Auditoría: Realtime entre Planeación y Bitácora de Monitoreo

## Hallazgo Crítico

**`servicios_planificados` NO está en la publicación `supabase_realtime`.**

Tablas actualmente habilitadas para realtime:
```text
app_feature_flags
servicio_comm_media
servicio_eventos_ruta
```

Esto significa que la suscripción en `useBitacoraBoard.ts` (línea 189-203) que escucha cambios en `servicios_planificados` **nunca recibe eventos**. El tablero de Bitácora depende exclusivamente del polling:
- "Por Iniciar": cada **30 segundos**
- "En Curso": cada **15 segundos**

Cuando Planeación marca "En sitio" (escribe `hora_llegada_custodio`), Monitoreo puede tardar hasta 30 segundos en ver el servicio aparecer en "Por Iniciar". Igualmente, `bitacora_asignaciones_monitorista` tampoco está en realtime, causando el mismo retraso para asignaciones de monitorista.

## Datos en Vivo (Auditoría)

Hay **14 servicios hoy** con `hora_llegada_custodio` seteado y sin `hora_inicio_real` — es decir, visibles en "Por Iniciar" de Bitácora. Estos servicios ya fueron marcados "En Sitio" por Planeación y esperan que Monitoreo los inicie. El sistema funciona correctamente en datos, el problema es puramente de **latencia de visibilidad** por falta de realtime.

## Plan de Solución

### 1. Habilitar Realtime en las tablas faltantes (migración SQL)
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE servicios_planificados;
ALTER PUBLICATION supabase_realtime ADD TABLE bitacora_asignaciones_monitorista;
```

### 2. Reducir staleTime del pending query
En `useBitacoraBoard.ts`, reducir `staleTime` de la query "Por Iniciar" de `10_000` a `3_000` para que las invalidaciones por realtime se ejecuten más rápido.

### 3. Reducir refetchInterval como fallback
Cambiar el polling de "Por Iniciar" de `30_000` a `15_000` como red de seguridad en caso de que realtime tenga lag.

## Resultado Esperado

Con realtime habilitado, cuando Planeación marca "En Sitio":
1. PostgreSQL emite el evento de UPDATE
2. Supabase Realtime lo envía al browser de Monitoreo (~200-500ms)
3. Se invalida `bitacora-board-pending` 
4. React Query refetcha (~200ms)
5. El servicio aparece en "Por Iniciar" en **menos de 1 segundo**

Impacto: **2 sentencias SQL + 2 líneas de código** — cambio mínimo, máximo impacto.

