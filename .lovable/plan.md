
# Plan: Corregir Templates con Categorías Antiguas

## Problema Identificado

La base de datos contiene 5 templates con categorías legacy que no coinciden con el nuevo esquema de 34 templates:

| Templates Actuales (DB) | Categoría Actual |
|------------------------|------------------|
| fuera_horario | automatico |
| ticket_creado | confirmacion |
| escalamiento | escalamiento |
| bienvenida | general |
| menu_principal | menu |

Las nuevas categorías esperadas son: `servicios`, `checklist`, `tickets`, `onboarding`, `siercp`, `lms`, `leads`, `supply`.

---

## Solución

Agregar una función "Reinicializar Templates" que:
1. Elimine todos los templates existentes
2. Cree los 34 templates nuevos con las categorías correctas

### Cambios Técnicos

#### 1. Actualizar Hook `useWhatsAppTemplatesAdmin.ts`

Agregar una nueva mutación `reseedTemplates`:
- Elimina todos los templates existentes de la tabla
- Inserta los 34 templates definidos en `TEMPLATE_CONFIGS`
- Asigna la categoría correcta usando el mapeo de `TEMPLATE_CATEGORIES`

#### 2. Actualizar Panel `WhatsAppTemplatesPanel.tsx`

Agregar un botón "Reinicializar Templates" visible cuando:
- Existen templates pero ninguno coincide con las categorías esperadas
- O hay un mismatch entre el total esperado (34) y el actual (5)

El botón mostrará una confirmación antes de eliminar los datos existentes.

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/hooks/useWhatsAppTemplatesAdmin.ts` | Agregar mutación `reseedTemplates` con delete + insert |
| `src/components/settings/kapso/WhatsAppTemplatesPanel.tsx` | Agregar botón "Reinicializar" y lógica de detección |

---

## Flujo de Usuario

1. Usuario ve el panel con 5 templates y 0 en cada categoría
2. Aparece banner: "Los templates actuales usan un esquema antiguo"
3. Usuario hace clic en "Reinicializar 34 Templates"
4. Confirma la acción
5. Sistema elimina los 5 viejos y crea los 34 nuevos
6. Panel muestra los templates correctamente organizados
