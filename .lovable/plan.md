
# Mejora UX: Combobox Buscable para Zonas

## Problema Identificado

El selector de zonas usa un `Select` estándar con 20+ opciones, lo cual:
- Requiere scroll extenso para encontrar opciones
- Ocupa espacio vertical excesivo al abrirse
- No permite filtrar/buscar
- Genera fricción al editar múltiples custodios

## Solucion Propuesta

Reemplazar el `Select` de zonas con un **Combobox** usando `Popover + Command` (cmdk) que ya existe en el proyecto.

---

## Estructura Visual Nueva

```text
ANTES (Select largo):              DESPUES (Combobox buscable):
+------------------+               +------------------+
| CDMX          ▼  |               | CDMX          ▼  |
+------------------+               +------------------+
| CDMX             |               | 🔍 Buscar zona...|
| EDOMEX           |               |------------------|
| Jalisco          |               | CDMX             |
| Nuevo León       |               | EDOMEX           |  <- Max 5 visibles
| Puebla           |               | (2 más...)       |
| Querétaro        |               +------------------+
| Guanajuato       |
| Michoacán        |
| Veracruz         |
| ... 12 más       |
+------------------+
```

---

## Cambios Requeridos

### Archivo: `CustodiosDataTable.tsx`

**1. Nuevos imports:**
```typescript
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';
```

**2. Reemplazar Select de zona con Combobox:**

```tsx
// Estado adicional para controlar apertura
const [openZonaId, setOpenZonaId] = useState<string | null>(null);

// En la celda de Zona:
<Popover 
  open={openZonaId === custodio.id} 
  onOpenChange={(open) => setOpenZonaId(open ? custodio.id : null)}
>
  <PopoverTrigger asChild>
    <Button
      variant="outline"
      size="sm"
      className="h-8 w-[140px] justify-between text-xs"
      disabled={isUpdating}
    >
      {isUpdating ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <>
          <span className="flex items-center">
            <MapPin className="h-3 w-3 mr-1" />
            {ZONAS_DISPONIBLES.find(z => z.value === currentZona)?.label || 'Sin zona'}
          </span>
          <ChevronsUpDown className="h-3 w-3 opacity-50" />
        </>
      )}
    </Button>
  </PopoverTrigger>
  <PopoverContent className="w-[200px] p-0" align="start">
    <Command>
      <CommandInput placeholder="Buscar zona..." className="h-9" />
      <CommandList>
        <CommandEmpty>No encontrada</CommandEmpty>
        <CommandGroup>
          {ZONAS_DISPONIBLES.map((zona) => (
            <CommandItem
              key={zona.value}
              value={zona.label}
              onSelect={() => {
                handleZonaChange(custodio.id, zona.value);
                setOpenZonaId(null);
              }}
            >
              <Check
                className={cn(
                  "mr-2 h-4 w-4",
                  currentZona === zona.value ? "opacity-100" : "opacity-0"
                )}
              />
              {zona.label}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  </PopoverContent>
</Popover>
```

---

## Beneficios de UX

| Aspecto | Select Actual | Combobox Nuevo |
|---------|---------------|----------------|
| Busqueda | No disponible | Escribir para filtrar |
| Altura max | Sin limite (20+ items visibles) | Limitada (~200px con scroll) |
| Velocidad | Scrollear lista completa | Teclear 2-3 letras |
| Precision click | Dificil en lista larga | Facil con lista filtrada |

---

## Preferencias: Sin Cambios

El selector de preferencias (local/foraneo/indistinto) solo tiene 3 opciones - el `Select` actual es apropiado y eficiente.

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/pages/PerfilesOperativos/components/CustodiosDataTable.tsx` | Reemplazar Select de zona con Popover+Command Combobox |

---

## Consideraciones Tecnicas

1. **Estado de apertura**: Usar `openZonaId` para controlar cual Popover esta abierto (solo uno a la vez)
2. **CommandInput**: Permite busqueda fuzzy automatica via cmdk
3. **CommandList**: Tiene max-height de 300px por defecto
4. **Cierre automatico**: Al seleccionar, cerrar el Popover y disparar update
5. **Accesibilidad**: cmdk maneja navegacion por teclado automaticamente
