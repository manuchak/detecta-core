
# Ajustar formulario de gastos extraordinarios

## Cambios en `src/components/custodian/CreateExpenseForm.tsx`

1. **Reemplazar "Notas adicionales" por "Número de Folio"** — campo obligatorio con placeholder apropiado
2. **Eliminar el campo de "Urgencia"** — quitar el select y el estado `urgencia`
3. **Actualizar validación** — `isValid` debe incluir que `folio` no esté vacío
4. **Ajustar `handleSubmit`** — enviar el folio en el campo `notas` (o `id_servicio` si aplica) y usar urgencia fija `'normal'`

| Archivo | Cambio |
|---------|--------|
| `src/components/custodian/CreateExpenseForm.tsx` | Reemplazar notas→folio (obligatorio), eliminar urgencia |
