
# Plan: Detalle de Servicio en Card y Columnas por Defecto

## Resumen

Implementar dos mejoras en la tabla de servicios de Facturacion:
1. Mostrar todas las columnas seleccionadas por defecto
2. Al hacer clic en una fila, abrir un Dialog con toda la informacion del servicio en una sola Card (sin pestanas)

## Cambios Requeridos

### 1. Columnas por Defecto

**Archivo:** `src/pages/Facturacion/components/ServiciosConsulta.tsx`

Cambiar el estado inicial de `visibleGroups`:

```typescript
// Antes:
const [visibleGroups, setVisibleGroups] = useState<ColumnGroup[]>(['basic']);

// Despues:
const [visibleGroups, setVisibleGroups] = useState<ColumnGroup[]>(['basic', 'planeacion', 'timeline', 'operativo', 'bi']);
```

### 2. Crear Dialog de Detalle de Servicio

**Nuevo archivo:** `src/pages/Facturacion/components/ServicioDetalleDialog.tsx`

Componente de dialog que muestra toda la informacion del servicio en una sola Card organizada en secciones:

**Secciones en la Card:**
- **Identificacion**: Folio Saphiro, Ref. Cliente, Folio Cliente, ID Interno
- **Cliente y Ruta**: Nombre cliente, Ruta, Origen, Destino, Local/Foraneo, Tipo servicio
- **Timeline Planeacion**: Fecha recepcion, Fecha asignacion, Fecha asignacion armado, Estado planeacion
- **Timeline Operativo**: Fecha cita, Presentacion, Inicio, Arribo, Fin, Duracion, Retraso
- **Personal Custodio**: Nombre, Telefono, Vehiculo, Placa
- **Personal Armado**: Nombre, Telefono, Tipo asignacion, Proveedor
- **Transporte**: Tipo unidad, Tipo carga, Operador, Telefono operador, Placa carga
- **Kilometraje**: Km teorico, Km recorridos, Desviacion, Km extras, Km auditado
- **Financiero**: Cobro cliente, Costo custodio, Casetas, Margen bruto, % Margen
- **Tracking y Origen**: Gadget, Tipo gadget, Creado via, Creado por

**Estructura visual:**
```text
+--------------------------------------------------+
|  Servicio EMEDEME-234              Estado: ●     |
+--------------------------------------------------+
| IDENTIFICACION                                   |
| Folio: EMEDEME-234    Ref: ABC123    Cliente: X |
+--------------------------------------------------+
| RUTA Y CLIENTE                                   |
| Cliente: Empresa SA                              |
| Ruta: CDMX - Guadalajara (Foraneo)              |
| Origen: Av. Insurgentes 123                      |
| Destino: Av. Vallarta 456                        |
+--------------------------------------------------+
| TIMELINE                                         |
| Cita: 04/02 08:00                               |
| Present. | Inicio | Arribo | Fin | Duracion     |
| 07:55    | 08:05  | 14:30  | 15:00| 6h 55m      |
| Retraso: -5 min (a tiempo)                      |
+--------------------------------------------------+
| PERSONAL                                         |
| Custodio: Juan Perez | Tel: 55-1234-5678        |
| Armado: Pedro Garcia | Proveedor: CUSAEM        |
+--------------------------------------------------+
| FINANCIERO                                       |
| Cobro: $12,500 | Costo: $8,000 | Margen: $4,500 |
| % Margen: 36%  | Casetas: $850                  |
+--------------------------------------------------+
```

### 3. Agregar Interaccion a Tabla

**Archivo:** `src/pages/Facturacion/components/ServiciosConsulta.tsx`

Agregar:
- Estado para el servicio seleccionado
- Handler de clic en la fila
- Importar y renderizar el Dialog

```typescript
// Nuevos estados
const [selectedServicio, setSelectedServicio] = useState<ServicioFacturacion | null>(null);
const [detailOpen, setDetailOpen] = useState(false);

// Handler de clic
const handleRowClick = (servicio: ServicioFacturacion) => {
  setSelectedServicio(servicio);
  setDetailOpen(true);
};

// En TableRow agregar cursor y onClick
<TableRow 
  key={s.id} 
  className="text-xs cursor-pointer hover:bg-muted/50"
  onClick={() => handleRowClick(s)}
>
```

## Seccion Tecnica

### Estructura del Dialog

El dialog usara `max-w-4xl` para tener suficiente espacio. La Card interna tendra:
- `ScrollArea` con altura maxima `max-h-[80vh]`
- Grid de 2 o 3 columnas para informacion compacta
- Separadores visuales entre secciones
- Badges de estado con colores semanticos
- Formateo de moneda, fechas y duraciones

### Tipos Reutilizados

Se usara la interfaz `ServicioFacturacion` existente directamente, sin necesidad de fetch adicional ya que los datos ya estan cargados en la tabla.

### Funciones de Formateo

Se reutilizaran:
- `formatCurrency` de `@/utils/formatUtils`
- `formatCDMXTime` de `@/utils/cdmxTimezone`
- `formatDuracion` (ya existe en el componente)
- `formatTiempoRetrasoDisplay` de `@/utils/timeUtils`

## Archivos a Crear/Modificar

| Archivo | Accion |
|---------|--------|
| `src/pages/Facturacion/components/ServicioDetalleDialog.tsx` | Crear |
| `src/pages/Facturacion/components/ServiciosConsulta.tsx` | Modificar |
