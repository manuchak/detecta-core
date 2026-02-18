

# Filtro por Cliente - Solo clientes del dia

## Que se va a hacer

Agregar un dropdown "Cliente" en la barra de filtros de Servicios Programados. El dropdown mostrara **unicamente** los clientes que tienen servicios programados para el dia seleccionado (no el catalogo completo de clientes del sistema).

## Impacto en el workflow

- **Riesgo: Nulo** - Filtro puramente visual en frontend
- No modifica queries a BD ni logica de asignacion de custodios/armados
- Los contadores del header (total, asignados, pendientes) siguen mostrando el total real del dia
- El filtro se resetea automaticamente al cambiar de fecha
- El contador "(X de Y)" ya existente se actualizara para reflejar tambien este filtro

## Implementacion

### Archivo a modificar

`src/pages/Planeacion/components/ScheduledServicesTabSimple.tsx` (unico archivo)

### Cambios especificos

1. **Nuevo estado**: Agregar `clienteFilter` de tipo `string | null` (null = todos) junto a los demas filtros (linea ~185)

2. **Dropdown en la barra de filtros**: Insertar un `Select` (componente shadcn ya existente en el proyecto) despues de los botones Empresarial/PF y antes del separador. Mostrara:
   - Opcion por defecto: "Todos los clientes"
   - Lista dinamica generada desde `servicesByClient` (que ya calcula los clientes del dia con su conteo)
   - Cada opcion mostrara el nombre del cliente y cuantos servicios tiene, ej: "BIMBO (5)"

3. **Aplicar filtro**: En el `useMemo` de `groupedServices` (linea ~548), agregar una condicion que filtre por `cliente_nombre` cuando `clienteFilter` no sea null. Se agrega despues de los filtros existentes.

4. **Reset al cambiar fecha**: En `handleDateChange` (linea ~89), resetear `clienteFilter` a null

5. **Actualizar dependencias del useMemo**: Agregar `clienteFilter` al array de dependencias de `groupedServices`

6. **Actualizar condicion del contador**: El texto "(X de Y)" (linea ~797) se mostrara tambien cuando `clienteFilter` no sea null

