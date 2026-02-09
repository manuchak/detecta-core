

# Rediseño de la Lista de Servicios del TV Dashboard

## Evaluacion UI/UX actual

La lista cumple su funcion basica pero tiene 6 problemas de usabilidad para un videowall visto a distancia:

1. **Filas de altura inconsistente**: Nombres largos como "FABRICAS DE CALZADO ANDREA" generan wrapping que rompe el ritmo visual
2. **Jerarquia plana**: Hora, cliente y custodio compiten por atencion visual sin prioridad clara
3. **Estado casi invisible**: El dot de 10px es la unica señal de estado, dificil de ver a 3+ metros
4. **Sin agrupacion temporal**: Bloques de misma hora (04:00, 04:30) no se distinguen visualmente
5. **Espacio muerto**: El area debajo del mapa no se aprovecha
6. **Sin indicador de progreso**: No se ve cuantos servicios estan visibles vs. el total al hacer scroll

## Solucion propuesta

### 1. Layout de fila rediseñado (2 lineas por servicio)

Cambiar de una sola linea horizontal a un layout de dos lineas por fila:

```text
Linea 1:  [ESTADO_BAR]  04:00   IFC CANTABRIA
Linea 2:                         LUIS GILBERTO GONZALEZ JASSO
```

- **Linea 1**: Barra lateral de color (4px, altura completa) + hora en mono + nombre cliente en bold
- **Linea 2**: Nombre custodio en gris claro, indentado bajo el cliente

Esto elimina el wrapping horizontal y da jerarquia clara: cliente primero, custodio segundo.

### 2. Barra lateral de estado en vez de dot

Reemplazar el circulo de 10px por una barra vertical de 4px que ocupe toda la altura de la fila. Es mucho mas visible a distancia y crea un patron de color escaneable.

### 3. Separadores por hora

Insertar un mini-header gris cuando cambia la hora:

```text
── 04:00 ──────────────────
  [fila1]
  [fila2]
  [fila3]
── 04:30 ──────────────────
  [fila4]
```

### 4. Truncado inteligente con elipsis

Para nombres que excedan el ancho disponible, usar `truncate` solo en la segunda linea (custodio) ya que es menos critico que el cliente. El nombre del cliente siempre se muestra completo.

## Cambios tecnicos

### Archivo: `src/components/monitoring/tv/TVServicesList.tsx`

**Layout de fila**: Cambiar de `flex items-center gap-3` (una linea) a un layout vertical de dos lineas con barra lateral de color:

```tsx
<div key={s.id} className="flex border-b border-white/5">
  {/* Barra de estado lateral */}
  <div className="w-1 shrink-0 rounded-full my-1" 
       style={{ backgroundColor: color.primary }} />
  
  <div className="flex-1 pl-3 py-2">
    {/* Linea 1: Hora + Cliente */}
    <div className="flex items-center gap-3">
      <span className="text-sm font-mono text-gray-400 shrink-0">{hora}</span>
      <span className="text-sm text-white font-semibold">{cliente}</span>
    </div>
    {/* Linea 2: Custodio */}
    <div className="pl-14">
      <span className="text-xs text-gray-500">{custodio}</span>
    </div>
  </div>
</div>
```

**Agrupacion por hora**: Agrupar servicios por hora y renderizar separadores:

```tsx
// Agrupar servicios por hora
const grupos = servicios.reduce((acc, s) => {
  const hora = s.fecha_hora_cita 
    ? format(new Date(s.fecha_hora_cita), 'HH:mm') 
    : '--:--';
  if (!acc[hora]) acc[hora] = [];
  acc[hora].push(s);
  return acc;
}, {});
```

Renderizar un mini-header por cada grupo de hora con texto gris y linea separadora.

### Archivo: `src/pages/Monitoring/MonitoringTVPage.tsx`

**Eliminar espacio muerto**: El mapa y la lista no llenan el area porque el grid de la barra inferior (weather + ticker) no esta alineado. Revisar que `flex-1` en el area central realmente tome todo el espacio disponible despues del header, KPIs y footer.

## Resultado esperado

- Nombres completos sin wrapping horizontal forzado
- Estado visible a 3+ metros via barra lateral de color
- Escaneo rapido por agrupacion temporal
- Ritmo visual consistente con filas de altura uniforme (2 lineas fijas)
- Mejor aprovechamiento del espacio vertical

