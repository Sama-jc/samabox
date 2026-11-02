# Product Requirements Document (PRD) - Samabox

## 1. Visión y Propósito del Producto

**Samabox** es una plataforma web integral de inicio de jornada (*Morning Kickoff Dashboard*) diseñada para profesionales de tecnología, líderes técnicos y analistas de ciberseguridad. Su propósito es consolidar en una única interfaz interactiva y libre de fricción la inteligencia táctica de seguridad de la información, el control de compromisos diarios (agenda) y la gestión priorizada de tareas operativas.

Al abrir Samabox cada mañana, el usuario obtiene inmediatamente:
1. Un **Daily Security Briefing** con un mínimo de 3 noticias críticas de ciberseguridad, acompañadas obligatoriamente de un **Resumen a leer** conciso y **Comentarios al respecto** (evaluación de impacto y recomendaciones tácticas) procesados con IA (o heurística resiliente si no hay conectividad/clave LLM).
2. La **Agenda del día** con detección automática de solapamientos entre reuniones.
3. La **Lista de tareas pendientes** categorizadas por prioridad y con selector de enfoque del día (*Daily Focus*).
4. Un **Dashboard Unificado** con métricas clave de un vistazo para arrancar la jornada con claridad.

---

## 2. Usuarios Objetivo y Casos de Uso

### 2.1 Perfiles de Usuario
- **Security Engineers & SecOps**: Necesitan mantenerse al día con vulnerabilidades críticas (CVEs, exploits de día cero, incidentes de ransomware) sin perder horas leyendo feeds dispersos.
- **Líderes Técnicos / Tech Leads / CISOs**: Requieren una visión consolidada de su agenda, sus compromisos ejecutivos y los riesgos del entorno antes de sus reuniones diarias.
- **Desarrolladores & DevOps**: Buscan una herramienta ligera y local que les recuerde las prioridades de ingeniería del día y los alerte sobre librerías o vectores de ataque que impacten su stack.

### 2.2 Escenario Principal de Uso (Morning Kickoff)
El usuario abre su navegador a las 08:30 AM. En pantalla aparece el dashboard de Samabox:
- En la columna izquierda, revisa las 3 noticias de seguridad destacadas del día, con sus resúmenes ejecutivos y las directrices tácticas recomendadas.
- En la columna central, visualiza su cronograma de reuniones; el sistema le alerta si dos reuniones se solapan a las 11:00 AM para que pueda reprogramar a tiempo.
- En la columna derecha, marca su tarea prioritaria del día ("Parchear CVE-2026-X en gateway") y avanza el estado de tareas secundarias.
- En menos de 3 minutos, el usuario tiene alineación operativa total.

---

## 3. Alcance Funcional

### Módulo 1: Daily Security Briefing (Noticias de Seguridad con IA)
- **Ingesta de Noticias**: Consumo y parseo de fuentes RSS/Atom especializadas en ciberseguridad (ej. The Hacker News, BleepingComputer, CISA Alerts, SecurityWeek).
- **Garantía Mínima**: Presentación garantizada de al menos 3 noticias relevantes por día.
- **Estructura Obligatoria por Noticia**:
  - `Título`: Titular original claro y enlace a la fuente original.
  - `Fuente y Fecha`: Origen del feed y marca temporal de publicación.
  - `Resumen a leer`: Síntesis ejecutiva de 2 a 4 párrafos cortos orientada a comprensión inmediata.
  - `Comentarios al respecto`: Análisis de impacto, severidad estimada, vectores de riesgo y recomendaciones preventivas para el equipo.
- **Adaptador de Inteligencia Artificial (LLM Adapter)**:
  - Soporte configurable vía variables de entorno (`LLM_API_KEY`, `LLM_MODEL`, `LLM_ENDPOINT`).
  - **Mecanismo de Fallback Resiliente**: En caso de ausencia de API key, caída de servicio externo o falta de conexión, el sistema activa de inmediato un motor heurístico local que genera resúmenes semánticos y comentarios preventivos basados en patrones de ciberseguridad, asegurando 100% de disponibilidad.
- **Acción de Refresco Manual**: Botón en la interfaz para forzar la actualización del briefing bajo demanda.

### Módulo 2: Agenda de Reuniones y Compromisos
- **Creación de Compromisos**: Título, hora de inicio (`HH:MM`), hora de fin (`HH:MM`), ubicación/enlace virtual, y notas complementarias.
- **Orden Cronológico**: Visualización natural ordenada de menor a mayor hora de inicio.
- **Detección de Solapamientos**: Algoritmo que detecta automáticamente si el intervalo `[inicio_A, fin_A)` intersecta con `[inicio_B, fin_B)`. Resalta visualmente las reuniones en conflicto con alertas claras.
- **Edición y Eliminación**: Modificación rápida de horarios o cancelación de eventos.
- **Indicador de Reunión Actual/Próxima**: Distinción visual para eventos que están sucediendo o ocurrirán en la próxima hora.

### Módulo 3: Tareas y Pendientes Diarios
- **Gestión CRUD**: Creación, listado, edición de estado y eliminación de tareas.
- **Priorización**: Tres niveles estrictos (`Alta`, `Media`, `Baja`) con codificación de color intuitiva.
- **Estados de Ciclo de Vida**: `Pendiente` (Pending), `En Progreso` (In Progress), `Completada` (Completed).
- **Enfoque del Día (Daily Focus)**: Capacidad de marcar una o dos tareas críticas como el foco innegociable de la jornada.
- **Filtrado Rápido**: Filtro por estado y por prioridad sin recarga de página.

### Módulo 4: Dashboard Unificado (Morning Kickoff)
- **Diseño Monopantalla (Single Pane of Glass)**: Vista de 3 columnas o rejilla responsiva que unifica Noticias, Agenda y Tareas.
- **Barra de Métricas / Health Bar**:
  - Estado del motor de inteligencia (Modo LLM Cloud activo vs Modo Heurístico Local).
  - Contador de reuniones del día y conteo de conflictos detectados.
  - Progreso de tareas completadas vs pendientes.
- **Persistencia Confiable**: Almacenamiento local mediante SQLite (con respaldo/migración estructurada).
- **Tema Visual**: Interfaz sobria, moderna y de alta legibilidad con soporte para tema oscuro/claro enfocado en ergonomía visual matutina.

---

## 4. Requisitos No Funcionales (NFR)

1. **Rendimiento**:
   - Carga inicial del dashboard en menos de 500 ms en red local.
   - Respuestas de la API REST interna en menos de 100 ms para operaciones CRUD.
2. **Resiliencia y Disponibilidad**:
   - Cero bloqueos en el inicio del día por fallos de servicios externos (RSS caído o proveedor LLM no disponible no deben impedir la visualización del dashboard).
   - Modo offline/local garantizado mediante SQLite integrado.
3. **Seguridad y Privacidad**:
   - Variables de entorno sensibles (`LLM_API_KEY`) nunca expuestas al cliente frontend.
   - Sanitización contra Cross-Site Scripting (XSS) en títulos y contenidos de feeds externos.
4. **Mantenibilidad y Calidad de Código**:
   - Desarrollo guiado por pruebas (TDD estricto). Cobertura de pruebas unitarias e integración superior al 85%.
   - Arquitectura modular desacoplada con separación clara de capas (Controladores, Servicios de Dominio, Repositorios/Adaptadores).
5. **Portabilidad y Despliegue**:
   - Ejecutable en Node.js v22 LTS sin dependencias binarias complejas.
   - Persistencia embebida lista para usar con un simple comando de arranque.

---

## 5. Historias de Usuario (US) y Criterios de Aceptación (AC)

### US-01: Visualización del Daily Security Briefing con IA y Fallback Resiliente
**Como** profesional de seguridad o líder técnico,  
**Quiero** visualizar al iniciar mi día al menos 3 noticias destacadas de ciberseguridad con un resumen ejecutivo y comentarios de impacto,  
**Para** tomar decisiones informadas sobre riesgos y vulnerabilidades sin invertir tiempo excesivo navegando múltiples portales.

#### Criterios de Aceptación:
- **AC-01.1**: El sistema debe recuperar y parsear fuentes de ciberseguridad y presentar un mínimo de 3 noticias activas en el dashboard matutino.
- **AC-01.2**: Cada tarjeta de noticia debe contener explícitamente:
  - Título y enlace original.
  - Bloque rotulado **"Resumen a leer"**: Síntesis clara de la noticia.
  - Bloque rotulado **"Comentarios al respecto"**: Análisis de severidad, vectores de impacto y sugerencias de mitigación.
- **AC-01.3**: Si la variable `LLM_API_KEY` está configurada, el servicio invoca el proveedor LLM para procesar el resumen y los comentarios.
- **AC-01.4**: Si `LLM_API_KEY` no está configurada o la llamada remota falla/agota el tiempo de espera (timeout), el sistema debe conmutar automáticamente al generador heurístico local sin arrojar errores 500 al usuario.
- **AC-01.5**: El usuario puede hacer clic en un botón "Actualizar Briefing" para forzar la recolección y regeneración de las noticias.

---

### US-02: Gestión de Agenda Diaria y Detección de Solapamientos
**Como** usuario con múltiples compromisos en la jornada,  
**Quiero** registrar y visualizar mis reuniones del día ordenadas en el tiempo,  
**Para** saber de inmediato mis horarios clave y ser advertido si dos reuniones entran en conflicto.

#### Criterios de Aceptación:
- **AC-02.1**: El usuario puede crear una reunión indicando: Título (obligatorio), Hora de Inicio (`HH:MM`), Hora de Fin (`HH:MM`), Ubicación/Link (opcional) y Notas (opcional).
- **AC-02.2**: La hora de fin debe ser estrictamente posterior a la hora de inicio; en caso contrario, el sistema rechaza la operación con un error 400 descriptivo.
- **AC-02.3**: Las reuniones se muestran ordenadas cronológicamente de forma ascendente por hora de inicio.
- **AC-02.4**: Si dos o más reuniones tienen intervalos de tiempo que se solapan (ej. 10:00-11:00 y 10:30-11:30), ambas deben mostrar una advertencia visual de solapamiento ("⚠️ Conflicto de horario") tanto en la tarjeta individual como en el resumen del dashboard.
- **AC-02.5**: El usuario puede editar o eliminar cualquier reunión existente con actualización inmediata en pantalla.

---

### US-03: Gestión de Tareas Diarias y Enfoque del Día (Daily Focus)
**Como** profesional orientado a objetivos diarios,  
**Quiero** registrar mis tareas, asignarles prioridad y definir mi foco principal de la jornada,  
**Para** mantener la productividad y no dispersarme en actividades secundarias.

#### Criterios de Aceptación:
- **AC-03.1**: El usuario puede crear tareas indicando: Título (obligatorio), Prioridad (`Alta`, `Media`, `Baja`) y marcar si es `Enfoque del Día` (booleano).
- **AC-03.2**: La lista de tareas permite transicionar el estado entre `Pendiente`, `En Progreso` y `Completada`.
- **AC-03.3**: La tarea marcada como `Enfoque del Día` debe destacarse visualmente en la parte superior del listado con un distintivo visual dorado/prominente.
- **AC-03.4**: El usuario puede filtrar rápidamente tareas por estado (`Todas`, `Activas`, `Completadas`) y ordenarlas por prioridad.
- **AC-03.5**: El usuario puede eliminar tareas que ya no apliquen.

---

### US-04: Dashboard Unificado de Inicio del Día (Morning Kickoff)
**Como** usuario matutino,  
**Quiero** un panel unificado e interactivo que cargue en una sola pantalla el briefing de seguridad, la agenda y las tareas,  
**Para** tener un panorama completo de mi día en un solo vistazo sin cambiar de pestaña o aplicación.

#### Criterios de Aceptación:
- **AC-04.1**: La pantalla principal presenta simultáneamente las tres columnas principales: Daily Security Briefing, Agenda Diaria y Tareas Pendientes.
- **AC-04.2**: El encabezado del dashboard exhibe un resumen de arranque (*Morning Kickoff Summary*):
  - Fecha actual formateada.
  - Contador de noticias críticas del día.
  - Total de reuniones y alerta de solapamientos si existen.
  - Porcentaje y proporción de tareas completadas (ej. "2 de 5 completadas (40%)").
  - Indicador de estado del motor de IA (`LLM Online` o `Heurístico Local`).
- **AC-04.3**: La interfaz debe ser responsive (adaptándose armoniosamente desde pantallas móviles de 375px hasta monitores ultra-wide).
- **AC-04.4**: Cualquier acción realizada en una columna (completar tarea, agregar reunión) actualiza los indicadores numéricos del resumen sin requerir recarga total del navegador.

---

### US-05: Configuración y Resiliencia del Sistema
**Como** administrador o usuario del sistema,  
**Quiero** poder configurar las fuentes de noticias y el comportamiento de la IA mediante variables de entorno o configuración sencilla,  
**Para** adaptar Samabox a distintos entornos de trabajo (air-gapped, offline, o cloud-connected).

#### Criterios de Aceptación:
- **AC-05.1**: Las fuentes RSS por defecto deben ser personalizables mediante la variable `SECURITY_FEED_URLS` (separadas por comas).
- **AC-05.2**: Si todas las fuentes remotas fallan o la máquina carece de conexión a Internet, el sistema carga noticias mock/curadas de seguridad preconfiguradas, garantizando que el usuario siempre vea al menos 3 noticias estructuradas.
- **AC-05.3**: Los datos de agenda y tareas persisten en base de datos SQLite local (`data/samabox.db`), manteniendo el estado entre reinicios del servidor.
- **AC-05.4**: La aplicación expone un endpoint `/api/health` que valida el estado del almacenamiento SQLite y de los servicios externos.

---

## 6. Métricas de Éxito del Producto
- **Time to Value**: Menos de 5 segundos desde el inicio del servidor hasta visualizar el dashboard con datos reales.
- **Zero Blocker Rate**: 100% de éxito en la renderización del briefing diario aun con fallas en internet o LLM.
- **Cobertura de Pruebas**: > 85% de líneas de código cubiertas por suites automatizadas (`node --test`).
