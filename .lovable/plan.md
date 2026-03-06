

# Plan: Digitalizar el Maestro de Facturacion en el modulo Finance

## Resumen del Excel

El archivo tiene **5 pestanas** con informacion critica:

| Pestana | Contenido | ~Registros |
|---|---|---|
| **Page 1** — Reglas de Facturacion | Corte (7/15/30 dias), tipo (inmediata/portal), descripcion factura, observaciones, prefactura, dia entrega, estadias, adicionales (GPS, candados), evidencia requerida, intercompania | ~240 clientes |
| **Page 2** — Contactos | Nombre contacto, telefono, hasta 18 correos por cliente | ~240 clientes |
| **Page 3** — Servicios Monitoring | Contratos GPS/DMS/APP con costos, unidades, mensualidades, plazo, tracking de facturas mensuales | ~50 contratos |
| **Page 4** — Reglas de Estadias | Horas cortesia custodio, horas cortesia cliente (local vs foraneo), cobro sin arma, cobro con arma, requiere tickets, dias credito, gadgets, descuentos, observaciones | ~170 clientes |
| **Page 5** — Portales de Clientes | URLs de portales, usuarios y contrasenas de acceso | ~20 portales |

## Gap Analysis: Que falta en el sistema actual

### Ya existe en `pc_clientes`:
- `dias_credito`, `dia_corte`, `dia_pago`, `horas_cortesia`, `cobra_pernocta`, `pernocta_tarifa`, `tipo_facturacion`, `dias_max_facturacion`
- Contacto facturacion (nombre, email, tel) — pero solo 1 contacto

### Ya existe en `reglas_estadias_cliente`:
- `horas_cortesia`, `tarifa_hora_excedente`, `tarifa_pernocta`, `cobra_pernocta`, por cliente/tipo_servicio/ruta

### NO existe y el Excel lo requiere:

1. **Diferenciacion local vs foraneo** en horas cortesia (ej: "4 locales y 3 foraneas") — el sistema actual solo tiene un campo numerico plano
2. **Tarifa diferenciada armado vs sin arma** (ej: $200 sin arma, $250 con arma) — solo hay `tarifa_hora_excedente` unica
3. **Requiere tickets de estadia** (booleano por cliente)
4. **Reglas de descripcion en factura** (que texto debe llevar: ruta+fecha, referencia, OC, contenedor, etc.)
5. **Dia de entrega de factura** (lunes, viernes, cada 1°, cada 16° y 1°, etc.)
6. **Portal de facturacion** (URL, si debe subirse a portal o no)
7. **Prefactura requerida** (si/no)
8. **Evidencia requerida** (bitacoras, tickets estadia, drive, opinion cumplimiento)
9. **Adicionales facturables** (GPS con precio, candados Rhino/Sintel con precio, hoteles)
10. **Multiples contactos de facturacion** (el Excel tiene hasta 18 correos por cliente)
11. **Observaciones operativas de facturacion** (texto libre con reglas especificas por cliente)
12. **Contratos de monitoreo** (servicios recurrentes GPS/DMS/APP)
13. **Credenciales de portales** (acceso a portales de clientes para subir facturas)

---

## Plan de Implementacion — 3 Fases

### Fase 1: Ampliar `pc_clientes` + Enriquecer `reglas_estadias_cliente`

**Migracion de base de datos:**

Agregar columnas a `pc_clientes`:
```sql
-- Reglas de facturacion
requiere_portal boolean default false,
url_portal text,
dia_entrega_factura text,          -- 'lunes','viernes','1_y_16','cada_1', etc.
descripcion_factura_formato text,   -- 'ruta_fecha','referencia','oc','contenedor', etc.
requiere_prefactura boolean default false,
requiere_tickets_estadia boolean default false,
evidencia_requerida text[],         -- array: ['bitacora','tickets_estadia','drive','opinion_cumplimiento']
observaciones_facturacion text,     -- texto libre con reglas especificas
facturacion_intercompania boolean default false,
```

Agregar columnas a `reglas_estadias_cliente`:
```sql
horas_cortesia_local numeric,
horas_cortesia_foraneo numeric,
tarifa_sin_arma numeric,
tarifa_con_arma numeric,
requiere_tickets boolean default false,
```

Crear tabla `pc_clientes_contactos`:
```sql
create table pc_clientes_contactos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references pc_clientes(id) on delete cascade,
  nombre text,
  email text not null,
  telefono text,
  rol text default 'facturacion',  -- facturacion, pagos, operaciones, logistica
  principal boolean default false,
  activo boolean default true,
  created_at timestamptz default now()
);
```

Crear tabla `pc_clientes_gadgets` (adicionales facturables):
```sql
create table pc_clientes_gadgets (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references pc_clientes(id) on delete cascade,
  tipo text not null,               -- 'gps','candado_rhino','candado_sintel','candado_kraken'
  precio numeric not null,
  incluido_en_tarifa boolean default false,
  facturacion text default 'por_servicio',  -- 'por_servicio','mensual'
  notas text,
  activo boolean default true,
  created_at timestamptz default now()
);
```

**Cambios en UI:**

- **ClienteFormModal**: Agregar pestana "Reglas Facturacion" con los nuevos campos (portal, dia entrega, formato descripcion, prefactura, evidencia, observaciones)
- **ClienteFormModal**: Agregar pestana "Contactos" con tabla editable inline para multiples contactos con email/tel/rol
- **ClienteFormModal**: Agregar seccion "Gadgets/Adicionales" para configurar GPS, candados y sus precios por cliente
- **Reglas Estadias**: Agregar campos de tarifa diferenciada (local/foraneo, armado/sin arma) al formulario de `EstadiasPanel`

### Fase 2: Carga masiva desde Excel

- Crear una funcion de importacion que parsee el Excel y haga match por nombre de cliente con `pc_clientes`
- UI: Boton "Importar Maestro" en la tab Config > Clientes que muestre un wizard:
  1. Upload del Excel
  2. Preview de los datos parseados con mapping automatico
  3. Resumen de cambios (cuantos clientes se actualizan, cuantos son nuevos, cuantos no hicieron match)
  4. Confirmacion y ejecucion
- Los datos que no hagan match se marcan para revision manual

### Fase 3: Contratos Monitoreo y Portales

Crear tabla `contratos_monitoreo`:
```sql
create table contratos_monitoreo (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references pc_clientes(id),
  tipo_servicio text not null,      -- 'gps','dms_adas','app','camara'
  costo_unitario numeric not null,
  unidades integer default 1,
  tipo_cobro text default 'mensual', -- 'mensual','anual','unico'
  plazo_meses integer,
  fecha_inicio date,
  fecha_fin date,
  activo boolean default true,
  notas text,
  created_at timestamptz default now()
);
```

Crear tabla `pc_clientes_portales` (credenciales de portales — datos sensibles):
```sql
create table pc_clientes_portales (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references pc_clientes(id),
  nombre_portal text,
  url text,
  usuario_custodias text,
  password_custodias text,          -- considerar vault para encriptar
  usuario_seguridad text,
  password_seguridad text,
  notas text,
  activo boolean default true,
  created_at timestamptz default now()
);
```

- UI para gestionar contratos de monitoreo con vista de facturacion mensual
- UI para portales (con acceso restringido a roles de facturacion)

---

## Prioridad de Implementacion

**Fase 1 es la mas critica** porque contiene los datos que el equipo de facturacion consulta diariamente: reglas de estadias diferenciadas, contactos multiples, formato de descripcion de factura y dia de entrega. Sin esto, siguen dependiendo del Excel.

**Fase 2** permite la carga inicial masiva y actualizaciones periodicas.

**Fase 3** digitaliza contratos de monitoreo y portales, que son operaciones menos frecuentes.

Recomiendo iniciar con Fase 1 (migracion DB + UI) que es donde esta el 80% del valor operativo.

