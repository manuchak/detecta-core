

## Migrar Quejas del Excel al Sistema CS

### Objetivo
Insertar las 6 quejas históricas del Excel directamente en la tabla `cs_quejas`, creando también el cliente faltante OJTLE TRANSPORTE. Esto permite que el sistema CS arranque con datos reales desde el día 1.

### Mapeo de Clientes Excel a Base de Datos

| Cliente en Excel | Cliente en BD | ID |
|---|---|---|
| FERRER | FERRER | ecf1e8c5-593c-42ad-8942-d7be5a81387a |
| MULTIADUANAS AGENTES ADUANALES | MULTI ADUANAS | ad69cd6f-6bc5-485a-9e07-3866d0d6dd1d |
| FABRICAS DE CALZADO ANDREA | FABRICAS DE CALZADO ANDREA | e182ef1e-9e61-4bbb-a5cd-1721f64cf610 |
| CARGO INTERAMERICANA | SERVICIOS COMERCIALES INTERAMERICA | 94b95c55-4fb7-4759-867d-9ada4a59f383 |
| OJTLE TRANSPORTE | **No existe - se creará** | (nuevo) |
| CLASE AZUL / CASA TRADICION | CASA TRADICION | f4fcbc8f-380d-4269-9f86-fe431bfd48d5 |

### Mapeo de Columnas Excel a Campos cs_quejas

| Columna Excel | Campo en cs_quejas | Transformación |
|---|---|---|
| CLIENTE | cliente_id | Lookup por nombre en pc_clientes |
| FECHA DE SOLICITUD DEL REPORTE | created_at | Fecha de registro de la queja |
| FECHA DEL SERVICIO | Incluido en descripcion | Se agrega como texto contextual |
| COMENTARIOS | descripcion | Texto completo del incidente |
| REPORTE DE ACCIONES CORRECTIVAS (QUIEN ATENDIO) | Incluido en descripcion | Se agrega al final de la descripción |
| COMENTARIOS DE ACCIONES CORRECTIVAS | accion_correctiva | Acciones tomadas |

### Clasificación Asignada por Queja

| Queja | Tipo | Severidad | Estado |
|---|---|---|---|
| FERRER (7 hallazgos operativos graves) | calidad_servicio | alta | en_investigacion |
| MULTI ADUANAS (retraso 2hrs custodio) | calidad_servicio | media | seguimiento |
| CALZADO ANDREA (falla cobertura) | cobertura | alta | accion_correctiva |
| CARGO INTERAMERICANA (actitudes equipo) | calidad_servicio | media | accion_correctiva |
| OJTLE (falla GPS) | seguridad | media | seguimiento |
| CASA TRADICION (3 hallazgos consignas) | consignas | alta | accion_correctiva |

### Implementación Técnica

**Archivo a crear:** `supabase/functions/seed-excel-quejas/index.ts`

Edge function que:
1. Crea el cliente OJTLE TRANSPORTE en `pc_clientes` (si no existe)
2. Inserta las 6 quejas en `cs_quejas` con todos los datos mapeados del Excel
3. El trigger `generate_queja_folio()` auto-genera los folios QJ-2026-XXXX
4. Usa service role key para bypass de RLS
5. Retorna los folios generados como confirmación

**Ejecución:** Se despliega la función, se invoca una vez para sembrar los datos, y luego se puede eliminar.

### Resultado Esperado

- 1 nuevo cliente: OJTLE TRANSPORTE
- 6 quejas con folios QJ-2026-0001 a QJ-2026-0006
- Dashboard CS mostrará datos reales inmediatamente
- El Loyalty Funnel clasificará estos 6 clientes con quejas como "En Riesgo" o "Activo"

