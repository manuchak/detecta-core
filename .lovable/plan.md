

# Plan: Drill-Down por Mes en Herramienta de Auditoría

## Problema

Al ver la tabla de auditoría con discrepancias entre Excel y sistema, no hay forma de saber **cuales IDs especificos** faltan o sobran en cada lado. Se necesita hacer doble clic en un mes para ver el detalle y poder exportar esa lista para reconciliar contra la fuente Excel.

## Solucion

Agregar un modal de detalle que se abre al hacer doble clic en cualquier fila de la tabla de auditoría. El modal muestra tres listas: IDs solo en Excel (faltantes en sistema), IDs solo en sistema (faltantes en Excel), e IDs en ambos. Incluye boton de exportar a Excel.

## Cambios

### 1. Guardar datos individuales del Excel en estado (`DataAuditManager.tsx`)

Actualmente el componente solo guarda los totales agregados por mes. Se necesita guardar tambien los `id_servicio` individuales parseados del Excel para poder compararlos despues.

- Nuevo estado: `excelRecordsMap` - un `Map<string, string[]>` donde key = `"year-month"` y value = array de `id_servicio`
- Solo se puebla cuando el Excel tiene columna `id_servicio` (modo registros individuales)

### 2. Crear componente `MonthDrillDownDialog.tsx`

Nuevo componente que recibe:
- `year` y `month` del periodo seleccionado
- `excelIds: string[]` - IDs del Excel para ese mes
- `onClose` - callback para cerrar

Al abrirse:
1. Consulta `servicios_custodia` con `fetchAllPaginated` filtrando por el rango del mes (en timezone CDMX)
2. Extrae los `id_servicio` del sistema
3. Calcula tres conjuntos:
   - **Solo en Excel** (faltantes en BDD): IDs presentes en Excel pero no en sistema
   - **Solo en Sistema** (faltantes en Excel): IDs en sistema pero no en Excel
   - **En ambos**: IDs que coinciden
4. Muestra las tres listas en tabs dentro del Dialog
5. Boton "Exportar Detalle" genera un Excel con 3 hojas (una por cada conjunto)

```text
+------------------------------------------+
|  Detalle: Feb 2026                    [X] |
|------------------------------------------|
| [Solo Excel (41)] [Solo Sistema (0)] ... |
|------------------------------------------|
| ID_SERVICIO                              |
| EMEDEME-250                             |
| TEOVTEL-777                             |
| SADSSSM-38                              |
| ...                                      |
|------------------------------------------|
| [Exportar Detalle]                       |
+------------------------------------------+
```

### 3. Evento doble clic en tabla (`DataAuditManager.tsx`)

- Agregar `onDoubleClick` en cada `TableRow`
- Al hacer doble clic, abrir `MonthDrillDownDialog` con los datos del mes seleccionado
- Agregar `cursor-pointer` y tooltip "Doble clic para ver detalle" en las filas
- Si el Excel fue subido en modo agregado (sin IDs individuales), mostrar solo los IDs del sistema sin comparacion

## Archivos

| Archivo | Cambio |
|---------|--------|
| `src/components/administration/DataAuditManager.tsx` | Guardar IDs individuales del Excel, agregar doble clic, integrar dialog |
| `src/components/administration/MonthDrillDownDialog.tsx` | **Nuevo** - Dialog con detalle de IDs y exportacion |

## Flujo

```text
1. Usuario sube Excel con registros individuales (columna id_servicio + fecha_hora_cita)
2. Se muestra tabla de comparacion por mes (existente)
3. Usuario hace doble clic en "Feb 2026" (delta -41)
4. Se abre dialog que consulta servicios_custodia para Feb 2026
5. Muestra: 41 IDs solo en Excel, 0 solo en sistema, 603 en ambos
6. Usuario exporta lista de faltantes a Excel
7. Con esa lista reconcilia contra la fuente original
```

## Notas Tecnicas

- La consulta de detalle usa `fetchAllPaginated` para evitar truncamiento a 1,000 filas
- El filtro de fecha usa timezone CDMX (`America/Mexico_City`) con offset `-06:00`
- Se busca la columna `id_servicio` en el Excel con variantes: `id_servicio`, `id servicio`, `idservicio`, `id`
- Si el Excel no tiene columna de ID, el drill-down solo muestra los IDs del sistema (sin comparacion)
