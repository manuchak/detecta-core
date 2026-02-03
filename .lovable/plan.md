
# Mejora UX: Separar Acciones Seguras de Destructivas

## Problema Actual

El dropdown agrupa "Ver perfil" (accion frecuente y segura) con "Dar de baja" (accion destructiva e infrecuente). Esto viola el principio de UX de separar acciones de diferente impacto.

## Solucion Propuesta

Separar las acciones en dos elementos visuales:

1. **Boton visible**: "Ver perfil" como boton primario siempre visible
2. **Menu overflow**: Solo para acciones administrativas/destructivas

---

## Nueva Estructura Visual

```text
| ... | Rating | Acciones                    |
|-----|--------|------------------------------|
| ... | * 5.0  | [Ver perfil]  [...]          |
                      |           |
                 Boton directo    Dropdown con:
                 (navegacion)     - Llamar
                                  - Enviar WhatsApp
                                  -----------
                                  - Dar de baja (rojo)
```

---

## Cambios en Columna de Acciones

**Antes:**
```tsx
<DropdownMenu>
  <DropdownMenuItem>Ver perfil</DropdownMenuItem>
  <DropdownMenuSeparator />
  <DropdownMenuItem className="text-destructive">Dar de baja</DropdownMenuItem>
</DropdownMenu>
```

**Despues:**
```tsx
<div className="flex items-center gap-1">
  {/* Accion primaria - siempre visible */}
  <Button 
    variant="ghost" 
    size="sm" 
    onClick={() => navigate(`/perfiles-operativos/custodio/${custodio.id}`)}
  >
    <Eye className="h-4 w-4" />
  </Button>
  
  {/* Menu secundario - acciones adicionales */}
  <DropdownMenu>
    <DropdownMenuTrigger>
      <MoreHorizontal className="h-4 w-4" />
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuLabel>Contactar</DropdownMenuLabel>
      <DropdownMenuItem>
        <Phone className="h-4 w-4 mr-2" />
        Llamar
      </DropdownMenuItem>
      <DropdownMenuItem>
        <MessageCircle className="h-4 w-4 mr-2" />
        WhatsApp
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuLabel>Administrar</DropdownMenuLabel>
      <DropdownMenuItem 
        className="text-destructive focus:text-destructive focus:bg-destructive/10"
      >
        <UserX className="h-4 w-4 mr-2" />
        Dar de baja
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</div>
```

---

## Beneficios de UX

| Aspecto | Antes | Despues |
|---------|-------|---------|
| Accion frecuente | Oculta en menu | Un click visible |
| Separacion visual | Ninguna | Clara distincion |
| Riesgo de error | Alto (items adyacentes) | Bajo (requiere abrir menu + navegar) |
| Funcionalidad agregada | Solo ver/baja | + Llamar + WhatsApp |

---

## Archivo a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/pages/PerfilesOperativos/components/CustodiosDataTable.tsx` | Reestructurar columna de acciones |

---

## Detalles de Implementacion

1. Importar `MessageCircle` de lucide-react para icono de WhatsApp
2. Agregar `DropdownMenuLabel` para agrupar opciones logicamente
3. El boton "Ver perfil" usa `variant="ghost"` con tooltip para mantener minimalismo
4. Las opciones de contacto abren `tel:` y `https://wa.me/` respectivamente
5. La accion destructiva tiene fondo rojo en hover para reforzar la advertencia

---

## Consideraciones Adicionales

- Se podria agregar Tooltip al boton de Eye para indicar "Ver perfil forense"
- El dropdown ahora tiene valor agregado (contacto rapido)
- Mantiene consistencia con patrones de tablas de datos empresariales
