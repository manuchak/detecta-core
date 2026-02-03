
# Plan: Mejorar Navegación al Perfil Forense

## Problema
- El nombre del custodio en la tabla no es clicable
- El usuario espera navegar al perfil al hacer clic en el nombre
- Actualmente solo el ícono de ojo (Eye) navega al perfil

## Solución

### 1. Hacer el nombre clicable en CustodiosDataTable.tsx

Modificar la columna `nombre` para incluir un onClick que navegue al perfil:

```typescript
// Columna nombre (líneas 237-258)
{
  accessorKey: 'nombre',
  header: 'Custodio',
  cell: ({ row }) => (
    <div className="flex flex-col min-w-[180px]">
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate(`/perfiles-operativos/custodio/${row.original.id}`)}
          className="font-medium text-left hover:text-primary hover:underline cursor-pointer transition-colors"
        >
          {row.getValue('nombre')}
        </button>
        {row.original.estado === 'suspendido' && (
          <Badge>Suspendido</Badge>
        )}
      </div>
      {row.original.telefono && (
        <span className="text-xs text-muted-foreground">...</span>
      )}
    </div>
  ),
},
```

### 2. Hacer el nombre clicable en ArmadosDataTable.tsx

Aplicar el mismo patrón para consistencia.

### 3. Hacer el nombre clicable en BajasDataTable.tsx

Aplicar el mismo patrón para la pestaña de bajas.

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/pages/PerfilesOperativos/components/CustodiosDataTable.tsx` | Agregar onClick al nombre |
| `src/pages/PerfilesOperativos/components/ArmadosDataTable.tsx` | Agregar onClick al nombre |
| `src/pages/PerfilesOperativos/components/BajasDataTable.tsx` | Agregar onClick al nombre |

## Resultado Esperado

- Al hacer clic en cualquier nombre de la tabla, se navega al perfil forense completo
- En el perfil forense ya están disponibles:
  - Botón "Editar datos" en la tarjeta de contacto
  - Sección "Convertir a Armado" (solo para custodios)
- El ícono de ojo (Eye) permanece como alternativa visual
