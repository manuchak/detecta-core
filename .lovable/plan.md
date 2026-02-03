
# Confirmación de Cambios para Zona y Preferencia

## Objetivo

Agregar un diálogo de confirmación antes de aplicar cambios a la zona base o preferencia de servicio de un custodio, previniendo modificaciones accidentales mientras el usuario navega.

## Implementación

### Enfoque: AlertDialog Controlado

Utilizaremos el componente `AlertDialog` existente con estado controlado para:
1. Capturar el cambio pendiente (custodio + nuevo valor)
2. Mostrar confirmación con contexto claro
3. Ejecutar la actualización solo al confirmar

### Cambios en `CustodiosDataTable.tsx`

**1. Nuevos imports:**
```typescript
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
```

**2. Nuevo estado para cambios pendientes:**
```typescript
// Estado para confirmación de cambios
const [pendingChange, setPendingChange] = useState<{
  type: 'zona' | 'preferencia';
  custodioId: string;
  custodioNombre: string;
  valorActual: string;
  valorNuevo: string;
  labelNuevo: string;
} | null>(null);
```

**3. Nuevas funciones intermedias:**

```typescript
// Capturar cambio de zona pendiente
const requestZonaChange = (custodio: CustodioProfile, nuevaZona: string) => {
  const zonaLabel = ZONAS_DISPONIBLES.find(z => z.value === nuevaZona)?.label || nuevaZona;
  setPendingChange({
    type: 'zona',
    custodioId: custodio.id,
    custodioNombre: custodio.nombre,
    valorActual: custodio.zona_base || 'Sin zona',
    valorNuevo: nuevaZona,
    labelNuevo: zonaLabel,
  });
  setOpenZonaId(null);
};

// Capturar cambio de preferencia pendiente
const requestPreferenciaChange = (custodio: CustodioProfile, preferencia: PreferenciaTipoServicio) => {
  const prefLabel = PREFERENCIA_OPTIONS.find(o => o.value === preferencia)?.label || preferencia;
  setPendingChange({
    type: 'preferencia',
    custodioId: custodio.id,
    custodioNombre: custodio.nombre,
    valorActual: custodio.preferencia_tipo_servicio || 'indistinto',
    valorNuevo: preferencia,
    labelNuevo: prefLabel,
  });
};

// Confirmar cambio
const confirmChange = async () => {
  if (!pendingChange) return;
  
  if (pendingChange.type === 'zona') {
    await handleZonaChange(pendingChange.custodioId, pendingChange.valorNuevo);
  } else {
    await handlePreferenciaChange(pendingChange.custodioId, pendingChange.valorNuevo as PreferenciaTipoServicio);
  }
  setPendingChange(null);
};

// Cancelar cambio
const cancelChange = () => {
  setPendingChange(null);
};
```

**4. Modificar llamadas en las celdas:**

En el Combobox de zona:
```tsx
onSelect={() => {
  requestZonaChange(custodio, zona.value); // Antes: handleZonaChange directo
}}
```

En el Select de preferencia:
```tsx
onValueChange={(value) => requestPreferenciaChange(custodio, value as PreferenciaTipoServicio)}
```

**5. Agregar AlertDialog al componente:**

```tsx
<AlertDialog open={!!pendingChange} onOpenChange={(open) => !open && cancelChange()}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Confirmar cambio</AlertDialogTitle>
      <AlertDialogDescription>
        {pendingChange?.type === 'zona' ? (
          <>
            ¿Cambiar la zona base de <strong>{pendingChange.custodioNombre}</strong> a <strong>{pendingChange.labelNuevo}</strong>?
          </>
        ) : (
          <>
            ¿Cambiar la preferencia de servicio de <strong>{pendingChange?.custodioNombre}</strong> a <strong>{pendingChange?.labelNuevo}</strong>?
          </>
        )}
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel onClick={cancelChange}>Cancelar</AlertDialogCancel>
      <AlertDialogAction onClick={confirmChange}>Confirmar</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

## Flujo de Usuario

```text
1. Usuario selecciona nueva zona/preferencia
2. Dropdown/Select se cierra
3. Modal de confirmación aparece con:
   - Nombre del custodio
   - Nuevo valor seleccionado
   - Botones Cancelar / Confirmar
4. Si confirma → se ejecuta la actualización
5. Si cancela → no se hace ningún cambio
```

## Beneficios UX

| Aspecto | Antes | Después |
|---------|-------|---------|
| Cambios accidentales | Posibles | Prevenidos |
| Feedback visual | Solo toast post-cambio | Modal + toast |
| Reversibilidad | Requiere re-editar | Puede cancelar antes |
| Contexto | Usuario debe recordar qué cambió | Modal muestra nombre y valor |

## Archivo a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/pages/PerfilesOperativos/components/CustodiosDataTable.tsx` | Agregar estado, funciones intermedias, AlertDialog |
