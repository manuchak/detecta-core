

## Plan: Rediseño UX de la pagina de Evaluaciones SIERCP

### Problema actual

La pagina muestra "Calibracion Interna" como tab por defecto (primera posicion), cuando el flujo principal del analista es revisar candidatos. No hay filtros, busqueda, ni paginacion, haciendo la tabla inmanejable conforme crece. El analista necesita rapidamente identificar quien completo la prueba, ver resultados, y decidir si continua en el proceso.

### Rediseño propuesto

#### Jerarquia de informacion (Piramide invertida para el analista)

```
Nivel 1: Metricas resumen (ya existen, se reordenan)
Nivel 2: Tabla de candidatos con filtros y acciones (vista principal)
Nivel 3: Calibracion interna (tab secundaria, solo referencia)
```

### Cambios por archivo

#### 1. SIERCPResultsPanel.tsx - Reorganizar tabs y metricas

- Cambiar tab por defecto de `calibration` a `invitations`
- Reordenar tabs: "Evaluaciones Candidatos" primero, "Calibracion Interna" segundo
- Reordenar metricas para priorizar lo accionable: Completadas, En Progreso, Pendientes por revisar (con informe), Invitaciones Enviadas
- Eliminar la metrica "Calibracion Interna" del row principal (queda dentro de su tab)

#### 2. InvitationsTable.tsx - Agregar filtros, busqueda y mejoras UX

- **Barra de busqueda**: Input de texto para buscar por nombre o email del candidato
- **Filtros por estado**: Pills/chips filtrables (Todos, Completada, Enviada, Pendiente, Abierta, Expirada, Cancelada)
- **Filtro por fecha**: Select con rangos predefinidos (Hoy, Ultimos 7 dias, Ultimos 30 dias, Todo)
- **Filtro "Con informe / Sin informe"**: Para que el analista vea rapidamente quienes faltan por generar reporte
- **Ordenamiento por columna**: Click en headers de Score y Fecha para ordenar
- **Conteo de resultados filtrados**: "Mostrando X de Y invitaciones"
- **Semaforo visual en Score**: Color mas prominente (verde >= 70, ambar 50-69, rojo < 50)
- **Fila accionable**: Hover highlight mas visible, tooltip en iconos

#### 3. Nuevo componente: InvitationsFilters.tsx

Componente dedicado para la barra de filtros con:
- Input de busqueda con icono Search
- Pills de estado (similar al patron SupplyQuickActionBar existente)
- Select de rango de fecha
- Toggle "Solo con informe" / "Solo sin informe"
- Boton para limpiar filtros

### Detalle tecnico de filtrado

Todo el filtrado sera client-side ya que la query actual ya trae todas las invitaciones. La logica:

```
1. invitations (datos crudos del hook)
2. Filtrar por searchTerm (nombre o email, case-insensitive)
3. Filtrar por statusFilter (estado de la invitacion)
4. Filtrar por dateFilter (rango de fecha de envio)
5. Filtrar por reportFilter (con/sin ai_report)
6. Ordenar por sortField + sortDirection
7. Resultado: filteredInvitations para renderizar
```

### Archivos a crear/modificar

| Archivo | Accion | Descripcion |
|---|---|---|
| `src/components/recruitment/siercp/InvitationsFilters.tsx` | Crear | Barra de filtros reutilizable |
| `src/components/recruitment/siercp/InvitationsTable.tsx` | Modificar | Integrar filtros, busqueda, ordenamiento, mejorar visual de scores |
| `src/components/recruitment/siercp/SIERCPResultsPanel.tsx` | Modificar | Tab "invitations" como default, reordenar tabs y metricas |

### Flujo del analista despues del rediseño

```
1. Abre /leads/evaluaciones > SIERCP
2. Ve metricas: Completadas (11), En Progreso (4), Enviadas (10)
3. Tab "Evaluaciones Candidatos" ya esta activa (primera)
4. Busca candidato por nombre si lo necesita
5. Filtra por "Completada" para ver solo los que terminaron
6. Ve scores con semaforo claro (verde/ambar/rojo)
7. Click en ojo para ver informe guardado instantaneamente
8. Puede filtrar "Sin informe" para generar los que faltan
9. Tab "Calibracion Interna" disponible al fondo si necesita referencia
```

