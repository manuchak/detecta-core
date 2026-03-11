

# Registrar User Persona: Monitorista

Crear el archivo de conocimiento del proyecto con el perfil completo, incluyendo el dato clave: **desktop dual-screen como dispositivo, pero afinidad mental mobile-first**.

## Contenido del archivo `knowledge://memory/ui-ux/personas/monitorista-user-persona`

### Perfil
- 18-25 años, carreras administrativas, sin experiencia en ERPs
- Nativos de redes sociales (Instagram, TikTok, WhatsApp)
- **Dispositivo**: Desktop con hasta 2 pantallas — pero su modelo mental y afinidad de interacción es 100% mobile/social
- Turnos rotativos incluyendo nocturnos

### Misión
Asegurar que las unidades de clientes lleguen a destino sin incidentes

### Implicaciones de diseño

1. **Mobile-mental en desktop** — Usar cards, pills, burbujas y patrones de app móvil incluso en viewport desktop. Evitar tablas densas tipo ERP, menús profundos y formularios extensos
2. **Fatiga nocturna** — Tonos suaves, evitar blancos puros, texto mínimo 14px. Dark mode como default nocturno. Sin animaciones agresivas
3. **Zero-ambiguity** — Estado visible en <2s de escaneo visual. Colores semáforo + iconos. Micro-copy coloquial
4. **1-tap rule** — Acción más frecuente de cada contexto a máximo 1 clic (checkpoint, evento, mensaje)
5. **Dual-screen awareness** — Diseñar módulos que se beneficien de tener bitácora en una pantalla y mapa/comm en otra, sin requerir esa configuración

### Anti-patrones
- Tablas con >5 columnas visibles
- Formularios con >3 campos visibles a la vez
- UUIDs o timestamps crudos
- Modales que bloqueen la vista de servicios activos
- Jerga de ERP o sistemas empresariales

### Escenarios clave
1. Escaneo de bitácora — detectar qué servicio necesita atención
2. Registro de checkpoint — confirmar ubicación/estado
3. Evento especial — reportar incidente
4. Comunicación con custodio — mensajes y fotos por WhatsApp
5. Entrega de turno — transferir servicios con contexto

## Implementación

| Archivo | Acción |
|---|---|
| `knowledge://memory/ui-ux/personas/monitorista-user-persona` | Crear |

Un solo archivo de knowledge. Sin cambios de código.

