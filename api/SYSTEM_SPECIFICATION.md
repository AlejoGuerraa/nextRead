# NextRead | Especificación técnica del sistema de recomendaciones

> **Documento de referencia para desarrollo.** Esta especificación define el comportamiento esperado, las responsabilidades, las reglas de negocio y los requisitos técnicos del sistema de recomendaciones de NextRead. Debe consultarse antes de crear, modificar, eliminar o ampliar cualquier recomendación o carrusel.

## 1. Propósito y nivel de exigencia

NextRead ya cuenta con una implementación inicial de recomendaciones basada principalmente en autores, épocas y valoraciones. Esa implementación es básica y debe evolucionar hacia un sistema más completo, personalizado, modular y escalable.

El objetivo no es agregar condiciones aisladas a los endpoints existentes. Se debe **revisar, robustecer y reorganizar el sistema actual**, reutilizando lo que esté bien implementado y reemplazando lo que no sea compatible con esta especificación.

Este trabajo es importante para el futuro de la aplicación. Debe realizarse con criterio de ingeniería senior: investigar primero, comprender el código y el modelo de datos existentes, validar las relaciones y los flujos reales, diseñar antes de modificar y probar cada cambio. No se deben inventar modelos, columnas, relaciones, endpoints, servicios ni comportamientos que no existan sin justificar su incorporación.

### Escala objetivo

El diseño debe contemplar:

- Hasta **100.000 usuarios activos** como objetivo de capacidad.
- Un catálogo de al menos **50.000 libros**.
- Crecimiento posterior del catálogo y de la cantidad de usuarios.
- Múltiples carruseles en la página de inicio.
- Consultas concurrentes sin cargar innecesariamente la base de datos.

Estas cifras son objetivos de diseño, no una afirmación de que cualquier implementación los soportará automáticamente. La capacidad real debe validarse con mediciones y pruebas de carga.

### Principios obligatorios

1. Consultar únicamente los campos necesarios para cada operación.
2. No recuperar el catálogo completo para después filtrar en Node.js.
3. No recalcular recomendaciones en cada visita a la página de inicio.
4. Reutilizar candidatos, puntuaciones, estadísticas y consultas cuando corresponda.
5. Separar cálculos pesados de las peticiones HTTP mediante workers.
6. Utilizar índices, límites, paginación y consultas SQL eficientes.
7. Evitar consultas N+1 y relaciones cargadas innecesariamente.
8. Mantener consistencia entre estados de lectura, valoraciones, preferencias y contadores.
9. Evitar duplicaciones, procesamiento doble y condiciones de carrera.
10. Mantener una arquitectura modular, documentada, segura y fácil de mantener.

---

## 2. Antes de modificar: auditoría obligatoria del proyecto

Antes de escribir código, el agente debe inspeccionar la implementación existente. No debe asumir que los nombres de modelos, tablas, columnas, rutas o relaciones coinciden con los ejemplos de este documento.

Debe investigar, como mínimo:

- Modelos Sequelize de usuarios, libros, autores, listas y relación usuario-libro.
- Dónde se almacena actualmente el estado de lectura y la valoración.
- Cómo se marca un libro como leído, cómo se modifica ese estado y cómo se elimina una lectura.
- Cómo se guardan actualmente favoritos y listas.
- Estructura real y normalización de `tags` en los libros.
- Endpoints actuales de recomendaciones y página de inicio.
- Controllers, services, repositories, middlewares y rutas involucradas.
- Consultas Sequelize existentes, scopes, asociaciones e índices.
- Cómo se autentican y autorizan las peticiones.
- Si ya existe algún worker, scheduler, cola de tareas o mecanismo de procesamiento en segundo plano.
- Cómo se ejecutan las migraciones y cómo se configuran los entornos.
- Tests existentes y convenciones del repositorio.

### Reglas durante la auditoría

- No duplicar una tabla, asociación o funcionalidad que ya exista.
- No crear un endpoint nuevo si uno existente puede evolucionar de forma segura y compatible.
- No cambiar contratos que consume el frontend sin localizar primero todos sus usos.
- No eliminar recomendaciones actuales hasta comprender sus dependencias.
- No modificar datos existentes de manera destructiva.
- No inventar datos bibliográficos ni completar etiquetas mediante suposiciones.
- Si falta información para implementar una regla, identificarla y explicar qué decisión se necesita.
- Antes de modificar, presentar un resumen breve de la arquitectura encontrada y de los cambios necesarios.

El agente debe distinguir entre **lo que ya existe**, **lo que se propone agregar** y **lo que requiere una decisión**. Los nombres de tablas de este documento son nombres de referencia, no autorización para crear duplicados.

---

## 3. Fuentes de información del recomendador

El sistema debe basarse principalmente en los `tags` de cada libro y en las interacciones reales del usuario.

### 3.1. Datos de los libros

Los libros ya cuentan con información bibliográfica y etiquetas. Un ejemplo representativo:

```json
{
  "titulo": "Historias de cronopios y de famas",
  "anio": 1962,
  "tipo": "Cuento",
  "tema": "Surrealismo",
  "ranking": 4.16,
  "generos": ["Cuento", "Absurdo"],
  "read_count": 152,
  "url_portada": "/portadasLibros/Cortazar/HistoriasDeCronopiosYdeFamasCortazar.png",
  "id_autor": 1,
  "tags": [
    "1960",
    "julio cortazar",
    "fantasia",
    "comedia",
    "cuento",
    "argentina",
    "espanol",
    "medio",
    "adolescentes",
    "adultos",
    "absurdo",
    "humor",
    "rutina",
    "sociedad",
    "imaginacion"
  ]
}
```

Los `tags` pueden representar, entre otros atributos:

- Géneros y subgéneros.
- Temas y subtemas.
- Tipo de obra.
- Década o período.
- Autor.
- País.
- Idioma.
- Complejidad.
- Público o rango de edad.
- Otras características disponibles en el catálogo.

**No se debe asumir que todos los libros tienen todos los atributos ni que todos los tags están completos.** La lógica debe tolerar valores ausentes, listas vacías y diferencias de calidad en los datos.

El formato actual de `tags` debe investigarse y respetarse. No se debe cambiar su estructura ni crear un sistema paralelo de etiquetas sin una justificación técnica y una migración planificada.

### 3.2. Interacciones relevantes

El recomendador puede utilizar las siguientes acciones:

- Marcar un libro como favorito.
- Pasar un libro al estado `leyendo`.
- Pasar un libro al estado `leído`.
- Pasar un libro al estado `para leer`.
- Valorar un libro de 1 a 5 estrellas.
- Modificar o quitar una valoración.
- Modificar el estado de lectura.
- Configurar preferencias explícitas, si esa funcionalidad existe o se incorpora posteriormente.

Abrir la página de un libro **no equivale a leerlo** y no debe modificar las preferencias ni los contadores de lectura.

Las acciones deben procesarse según su transición real. Repetir una petición con el mismo estado no puede volver a sumar el mismo efecto.

---

## 4. Individual tag preferences

Each user has an independent affinity for each normalized tag. The aggregate profile remains in `Usuario.preferences` under `recommendation.tags`; each entry contains `weight`, `updated_at`, `evidence_sum`, `evidence_scale`, `evidence_offset`, and `contribution_count`. `recommendation.signals_initialized` records whether existing interactions have been backfilled.

Tag normalization trims surrounding whitespace, applies Unicode NFC normalization, and lowercases without removing accents. Duplicate normalized tags on one book contribute only once. Missing or invalid tags produce no contribution.

### 4.1. Signal scale and combination

Weights use the bounded normalized interval `(-1, 1)`. To give the proposed percentage for one signal its direct interpretation as the resulting affinity of an otherwise neutral tag, each signal impact `p` is converted to evidence with `atanh(p)`. For a tag:

```text
evidence_sum = sum(active per-book signal evidence)
weight = tanh(evidence_scale * evidence_sum + evidence_offset)
```

The initial `evidence_scale` is `1` and `evidence_offset` is `0`. The stored weight is clamped to `[-(1 - 10^-12), +(1 - 10^-12)]` for finite floating-point values. Multiple signals combine additively in evidence space and saturate asymptotically in weight space; negative signals can offset positive ones.

| Signal | Normalized impact `p` |
|---|---:|
| Favorite | +0.30 |
| `reading` state | +0.05 |
| `to_read` state | +0.15 |
| `read` with no active rating | +0.10 |
| Rating 5/5 | +0.40 |
| Rating 4/5 | +0.25 |
| Rating 3/5 | +0.15 |
| Rating 2/5 | -0.20 |
| Rating 1/5 | -0.30 |

Favorite is independent of reading state and rating. A reading state is mutually exclusive with other reading states. An active rating replaces the `read`-without-rating signal; it does not add to it. An unrated `read` state contributes only while no active rating exists.

### 4.2. Reversible per-book signals

`user_book_preference_signals` stores one row per `(user_id, book_id)`, with the normalized tags and raw evidence contributions currently attributed to that book. It has a composite primary key and foreign keys to `Usuario` and `Libro`. This ledger is required because the current catalog tags may change after a signal was applied; reverting against current tags alone could not remove the original contribution reliably.

Interaction changes update this ledger and `Usuario.preferences` in the same transaction as the state, rating, or favorite. The service subtracts the old ledger contribution and adds the new contribution, and writes nothing for an unchanged signal. Repeated requests therefore do not duplicate evidence. A tag aggregate is removed when its contribution count reaches zero.

Existing interaction dates cannot be reconstructed from the legacy arrays. The one-time backfill initializes their contributions at migration time, after the user-book-state backfill. Future updates use the ledger snapshot rather than reconstructing prior signals from catalog tags.

### 4.3. Deferred temporal decay

Each tag decays independently:

```text
effective_weight = previous_weight * 0.8^(days_elapsed / 150)
```

This retains 80% after 150 days, 64% after 300 days, and the corresponding exponential factor after 75 days. Decay is calculated when an interaction updates that tag or when a future consumer reads effective preferences. Reads do not persist decay.

When applying a new signal, the service first computes the effective decayed weight and derives the scale of the existing evidence. It subtracts the old per-book contribution at that decayed scale, then adds the new contribution at its full impact. `evidence_offset` preserves aggregate evidence in the edge case where active per-book contributions sum to zero. The result is stored with a fresh `updated_at`, so a new interaction is not aged immediately. Multiplication by a positive decay factor moves positive and negative weights toward zero without changing their sign.

---

## 5. Conjunto dinámico de libros candidatos por usuario

El sistema debe generar un conjunto personalizado de aproximadamente **100 a 200 libros candidatos por usuario**. Este conjunto será reutilizado por los carruseles que necesiten recomendaciones personalizadas.

### 5.1. Generación de candidatos

La selección debe utilizar las preferencias individuales y los `tags` de los libros.

No debe limitarse a consultar los libros que coincidan con el tag de mayor peso. Debe contemplar distintos intereses del usuario y producir resultados variados.

La generación debe combinar:

1. Coincidencia con tags de peso positivo.
2. Representación de varios intereses, evitando que un único tag monopolice los candidatos.
3. Diversidad de autores, géneros, épocas, tipos de obra y temáticas.
4. Exclusión de libros que el usuario ya leyó para los carruseles de descubrimiento.
5. Tratamiento de señales negativas según las reglas de puntuación definidas.
6. Un componente de exploración para descubrir libros fuera de los intereses más evidentes.
7. Variación entre usuarios, incluso cuando tengan gustos parecidos.

No se debe traer todo el catálogo a memoria para filtrar en JavaScript. La base de datos debe acotar los candidatos mediante consultas selectivas, índices y límites. La lógica de puntuación y diversidad debe trabajar sobre un conjunto acotado.

La búsqueda inicial puede generar varios grupos de candidatos a partir de tags de interés distintos y luego combinarlos, eliminar duplicados y puntuarlos. La cantidad consultada por grupo debe estar limitada y ser configurable.

### 5.2. Puntuación

Cada libro candidato debe recibir un `score` de compatibilidad con el usuario.

La puntuación debe combinar los pesos efectivos de los tags compartidos, teniendo en cuenta señales negativas y evitando que un libro gane únicamente por contener muchas etiquetas.

No se establece una fórmula definitiva en este documento porque depende de la escala matemática final de los pesos y de la calidad de los tags reales. El agente debe:

- Inspeccionar ejemplos reales de libros y preferencias.
- Proponer una fórmula normalizada y documentarla.
- Evitar que una cantidad grande de tags infle artificialmente la puntuación.
- Definir cómo se tratan los tags ausentes o desconocidos.
- Definir cómo intervienen pesos negativos.
- Crear tests con casos de ejemplo para validar el ranking.

La puntuación de compatibilidad no debe confundirse con la posición final. Después de puntuar, debe ejecutarse una etapa de diversidad y selección.

### 5.3. Diversidad y exploración

El conjunto no debe ser una lista de 200 libros casi idénticos.

Debe distribuir los candidatos entre intereses relevantes del usuario y mantener variedad de autores, géneros, períodos y tipos de obra.

Se propone reservar aproximadamente un **20% de los resultados para exploración**. Este porcentaje es una referencia inicial configurable, no una obligación de incluir libros irrelevantes.

La exploración debe seguir teniendo un criterio de calidad: los libros deben superar los filtros mínimos del catálogo y no ser elegidos completamente al azar.

### 5.4. Almacenamiento independiente

Crear o adaptar una tabla independiente para almacenar recomendaciones por usuario. Nombre de referencia: `UserRecommendation`.

Campos mínimos propuestos:

| Campo | Propósito |
|---|---|
| `id` | Identificador del registro. |
| `user_id` | Usuario propietario. |
| `book_id` | Libro candidato. |
| `score` | Compatibilidad calculada. |
| `position` | Orden final dentro de la generación. |
| `created_at` | Fecha de creación. |

Se deben utilizar claves foráneas y restricciones adecuadas. Como mínimo, revisar:

- Unicidad de libro dentro de la generación activa de un usuario.
- Índice para recuperar candidatos por usuario y posición.
- Índices necesarios para filtrar y ordenar.
- Eliminación o tratamiento consistente de candidatos cuyo libro deje de estar disponible.

Si se necesita conservar el conjunto anterior mientras se calcula uno nuevo, se puede agregar un identificador de generación (`generation_id` o equivalente). El agente debe elegir el mecanismo más simple que garantice que la página de inicio nunca lea un conjunto parcialmente reemplazado.

No guardar la lista de candidatos como un JSON dentro de `User`. La tabla independiente permite filtrar, ordenar, relacionar y actualizar mediante SQL.

No duplicar en esta tabla título, portada, autor ni tags. Esos datos pertenecen al libro y deben obtenerse mediante una consulta con los campos necesarios.

### 5.5. Actualización de candidatos

No regenerar el conjunto en cada visita a la página de inicio.

Marcar las recomendaciones como pendientes de actualización cuando cambien datos relevantes:

- Se registra una nueva lectura.
- Se modifica una valoración.
- Cambia un estado de lectura que influye en las recomendaciones.
- Se agrega o quita un favorito.
- Se modifican preferencias explícitas.

No regenerar por abrir una página, cambiar el avatar, cambiar el nombre u otras acciones irrelevantes.

El trabajo debe ejecutarse en segundo plano. Varias acciones cercanas deben agruparse para evitar múltiples regeneraciones.

La página de inicio debe poder utilizar el último conjunto válido mientras se prepara el nuevo. Si todavía no existe ningún conjunto, se debe definir un comportamiento inicial seguro: generar una primera tanda bajo demanda controlada o mostrar carruseles globales y de descubrimiento hasta que el worker termine. No bloquear una petición HTTP esperando un cálculo costoso.

---

## 6. Reglas generales de los carruseles

Reglas compartidas:

- Máximo **20 libros por carrusel**.
- Máximo **3 libros del mismo autor** dentro de un carrusel.
- Evitar recomendar libros que el usuario ya leyó en carruseles de descubrimiento.
- Permitir libros ya leídos únicamente en carruseles cuyo propósito lo requiera, como `Volver a leerlo`.
- Variar moderadamente el orden y algunos resultados para evitar que la página sea siempre idéntica.
- Mantener estabilidad razonable durante una sesión o período; no randomizar sin control en cada petición.
- No mostrar carruseles que no cumplan sus condiciones mínimas.
- Evitar duplicar un mismo libro en varios carruseles cuando no tenga sentido.
- Aplicar límites y filtros en la base de datos siempre que sea posible, no después de descargar grandes cantidades de resultados.

La variación debe ser reproducible durante un período razonable o basarse en una semilla controlada. No debe cambiar toda la selección ante cada refresco.

---

## 7. Carruseles y criterios de cálculo

Los carruseles se dividen en cuatro grupos: personalizados, basados directamente en datos del usuario, contextuales y globales.

### 7.1. `Para vos` (fijo)

Es el carrusel principal.

- Fuente: conjunto de `UserRecommendation`.
- Utilizar los candidatos con mayor compatibilidad.
- Incorporar variación controlada, por ejemplo, alternando algunos resultados de posiciones intermedias entre los puestos 10 y 50.
- Respetar el máximo de 3 libros por autor.
- Excluir libros ya leídos.
- Mantener un componente de exploración aproximado del 20%.
- Mostrar como máximo 20 libros.
- No ordenar por valoración global de mayor a menor.

**Regla específica del catálogo:** solo mostrar libros con `ranking > 3.0`. Este filtro debe aplicarse en la consulta que obtiene los libros, no después de traer el conjunto completo. Si `ranking` puede ser nulo, los nulos no deben superar el filtro.

La selección debe mantener relevancia y variedad. La variación no significa elegir 20 libros aleatorios de todo el catálogo.

### 7.2. `Seguir leyendo` (fijo)

- Fuente: relación del usuario con los libros.
- Mostrar únicamente libros con estado `leyendo`.
- No necesita calcular compatibilidad ni utilizar `UserRecommendation`.
- Recuperar solo los campos necesarios para las tarjetas.
- Ordenar mediante un criterio real disponible, por ejemplo última actualización, después de verificar qué fecha almacena el modelo.

### 7.3. `Para leer` (variable)

- Fuente: relación del usuario con los libros.
- Mostrar libros con estado `para leer`.
- No necesita el conjunto de candidatos.
- Aplicar límites y orden consistente.

### 7.4. `Autores` (variable)

- Mostrar autores, no libros.
- Utilizar autores relevantes para los intereses o actividad del usuario.
- Cada elemento debe conducir a la página del autor.
- La página de autor es una funcionalidad relacionada que debe verificarse antes de asumir que ya existe.
- No cargar todos los libros de cada autor para construir este carrusel.

### 7.5. `Más de Autor` (variable)

- Detectar autores de los que el usuario haya leído al menos dos libros.
- Mostrar otras obras de esos autores.
- Excluir los libros ya leídos cuando el objetivo sea descubrir nuevas lecturas.
- Aplicar máximo 3 libros del mismo autor por carrusel; si el carrusel representa a un solo autor, esta regla debe interpretarse de forma coherente con su propósito y documentarse.
- Ordenar por compatibilidad cuando exista puntuación disponible; no inventar puntuaciones.

### 7.6. `De lista` (variable)

- Mostrar libros de una lista específica del usuario.
- Consultar la relación de lista y libros.
- No necesita el recomendador.
- Verificar permisos y propiedad de la lista.
- No cargar listas ni libros ajenos sin autorización.

### 7.7. `Los más leídos en NextRead` (fijo)

- Fuente: contador actual `read_count`.
- Ordenar por cantidad de usuarios que actualmente tienen el libro marcado como leído.
- No confundirlo con nuevas lecturas del mes.
- Utilizar resultados globales precalculados.
- Aplicar límites y filtros de disponibilidad del libro.

### 7.8. `Volver a leerlo` (variable)

- Fuente: libros que el usuario ya leyó.
- Priorizar valoraciones altas, favoritos u otras señales positivas existentes.
- Puede incluir libros ya leídos, porque ese es su propósito.
- No debe confundirse con el carrusel de descubrimiento.
- Si el usuario no tiene lecturas suficientes, no mostrarlo.

### 7.9. `Tendencias espontáneas` (variable)

- Detectar crecimiento de nuevas lecturas en períodos cortos.
- Utilizar eventos de lectura con fecha, no solamente `read_count`.
- Comparar el período reciente con el anterior.
- Evitar que pocos eventos produzcan una tendencia engañosa.
- Utilizar el caché global actualizado por worker.

### 7.10. `Épocas` (variable)

- Agrupar candidatos por tags de década o período.
- Priorizar períodos con afinidad positiva.
- Mostrar únicamente grupos con suficientes candidatos.
- No consultar todo el catálogo: reutilizar `UserRecommendation` y las etiquetas necesarias.

### 7.11. `Tipo de cuentos` / tipo de obra (variable)

- Agrupar candidatos por tipo de obra: novela, cuento, poesía, ensayo, biografía, autobiografía, crónica, teatro, reportaje u otros tipos existentes.
- Mostrar los tipos con afinidad y cantidad suficiente.
- No asumir que los valores están todos normalizados; inspeccionar los datos reales.

### 7.12. `Género` (variable)

- Agrupar candidatos por género o subgénero.
- Priorizar los géneros con afinidad positiva.
- Evitar mostrar grupos vacíos o con muy pocos libros.
- Reutilizar el conjunto de candidatos.

### 7.13. `Joyas por descubrir` (variable)

- Combinar afinidad personalizada y baja popularidad.
- No seleccionar libros únicamente por ser poco leídos.
- Utilizar `read_count` u otra métrica global disponible.
- Excluir libros ya leídos.
- Evitar que un libro con datos incompletos sea considerado una joya solamente por no tener estadísticas.

### 7.14. `Nuevos lanzamientos` (variable)

- Utilizar fecha de publicación y actividad reciente.
- Definir un período configurable para considerar un libro nuevo.
- Priorizar libros nuevos que estén recibiendo lecturas positivas o una tendencia reciente.
- No asumir que la fecha de publicación está completa o en un formato homogéneo sin auditar el catálogo.

### 7.15. Libros por `tema` (variable)

- Agrupar candidatos por el atributo `tema` o los tags temáticos disponibles.
- Mostrar temas recurrentes y relevantes para el usuario.
- No confundir el campo singular `tema` con la lista `tags` sin comprobar su relación real.
- Evitar consultas generales sobre todo el catálogo.

### 7.16. Mejores libros de `país` (variable)

- Utilizar el tag de país de origen.
- Agrupar candidatos por país y seleccionar los grupos con afinidad.
- Ordenar dentro de cada grupo por compatibilidad, y aplicar un criterio de calidad del catálogo si existe.
- No asumir que el país del autor y el país de origen de la obra son necesariamente lo mismo.

### 7.17. `Porque leíste...` (variable)

- Requiere al menos un libro leído y valorado con 4 o 5 estrellas.
- Cada recomendación parte de un libro concreto.
- Buscar otros libros que compartan tags, autor, género, temática, tipo o época.
- La similitud debe utilizar datos reales disponibles.
- Excluir el libro de origen y libros ya leídos.
- Mostrar el carrusel únicamente cuando exista un libro de origen válido y suficientes resultados.
- Si hay varios libros de origen, elegirlos con una regla estable y evitar repetir el mismo carrusel sin necesidad.

### 7.18. `Tendencias del mes` (variable)

- Utilizar eventos de nuevas lecturas del mes correspondiente.
- Contar usuarios únicos por libro dentro del período para evitar que un mismo usuario infle artificialmente la tendencia.
- Ordenar por cantidad de nuevos lectores.
- El período debe estar definido por fechas y zona horaria coherentes.

### 7.19. `Tendencias del año` (futura)

- Mismo criterio general que tendencias del mes, pero agrupado por año.
- No es necesario implementarlo si todavía no forma parte del alcance inmediato.
- La estructura de eventos debe permitir incorporarlo sin rediseñar el sistema.

---

## 8. Estadísticas globales y tendencias: eventos y caché

Los carruseles globales tienen los mismos resultados para todos los usuarios en un momento dado. No deben calcularse en cada petición de inicio.

### 8.1. Diferenciar popularidad de tendencia

`read_count` representa la cantidad actual de usuarios que tienen un libro en estado `leído`.

No informa cuándo ocurrió cada lectura. Por lo tanto, no alcanza para calcular tendencias.

Se necesita registrar cada transición válida hacia `leído` como un evento.

Nombre de referencia: `BookReadEvent` o `book_read_events`.

Campos mínimos:

| Campo | Propósito |
|---|---|
| `id` | Identificador del evento. |
| `user_id` | Usuario que realizó la transición. |
| `book_id` | Libro que pasó a leído. |
| `created_at` | Fecha y hora del evento. |

Debe tener índices para consultas por libro y fecha, y por usuario y fecha cuando corresponda. Revisar una restricción única o mecanismo de idempotencia que evite registrar dos veces la misma transición lógica.

**¿Cómo sabe el sistema cuándo una persona leyó un libro?**

No se deduce de una visita ni de una valoración aislada. Se sabe porque el backend recibe una operación válida que cambia el estado de lectura del usuario a `leído`.

El flujo correcto es:

1. Leer el estado anterior de la relación usuario-libro.
2. Validar la operación y los permisos.
3. Si el estado anterior no era `leído` y el nuevo sí lo es, registrar un evento.
4. Incrementar `read_count` una sola vez.
5. Actualizar la relación usuario-libro.
6. Aplicar la actualización de preferencias que corresponda.
7. Ejecutar los cambios relacionados dentro de una transacción cuando deban mantenerse consistentes.

Si el estado ya era `leído`, no se registra otro evento ni se incrementa el contador.

Si el usuario pasa de `leído` a `leyendo` o `para leer`, se decrementa `read_count`, pero no se borra el evento histórico. El evento representa que esa transición a leído ocurrió; el contador representa el estado actual. Esta distinción permite que las tendencias históricas no desaparezcan cuando alguien modifica posteriormente su estado.

Para las tendencias se deben contar **usuarios únicos por libro dentro de cada período**, según la regla definida. Si un mismo usuario puede registrar más de una transición a leído para un mismo libro, se debe decidir si el análisis de tendencias cuenta la primera transición de su vida o una nueva lectura explícita. No asumir que ambas significan lo mismo. La primera versión debe evitar inflar tendencias por cambios repetidos de estado.

### 8.2. Cálculo de tendencias

Una métrica inicial propuesta compara:

- `R`: usuarios únicos que registraron una nueva lectura durante los últimos 30 días.
- `P`: usuarios únicos que registraron una nueva lectura durante los 30 días anteriores.

Fórmula borrador:

```text
T = R + 0.5 * max(0, R - P)
```

Aplicar un umbral mínimo inicial de **30 lectores únicos** para que un libro pueda aparecer como tendencia. El umbral debe ser configurable y revisable con datos reales.

La fórmula y el umbral son parámetros iniciales, no verdades universales. Deben quedar centralizados y documentados para poder ajustarlos sin reescribir todos los endpoints.

### 8.3. Agregación diaria

Para evitar consultar millones de eventos cada vez que se calculan tendencias, se puede mantener una tabla agregada diaria, por ejemplo `BookReadStatsDaily`.

Campos de referencia:

- `book_id`
- `date`
- `read_count` o cantidad de eventos del día
- Si se necesita contar usuarios únicos de manera exacta, la estructura debe conservar información suficiente para deduplicar por usuario y período. Un simple contador diario no permite deduplicar un usuario que aparezca en varios días del mismo período.

La tabla diaria puede ser una optimización derivada de los eventos, no la única fuente de verdad. Debe poder reconstruirse desde los eventos si se detectan inconsistencias.

El agente debe elegir una estructura que permita contar usuarios únicos correctamente. Una opción es consultar eventos con `COUNT(DISTINCT user_id)` sobre ventanas acotadas y luego optimizar con agregaciones adecuadas cuando el volumen lo justifique. No sacrificar exactitud sin documentarlo.

### 8.4. Caché persistente de carruseles globales

Crear o adaptar una estructura de caché persistente, nombre de referencia `HomeCarouselCache`.

Campos posibles:

| Campo | Propósito |
|---|---|
| `id` | Identificador. |
| `carousel_key` | Clave del carrusel. |
| `period` | Período asociado, si aplica. |
| `data` | IDs ordenados de libros o autores y metadatos mínimos necesarios. |
| `generated_at` | Fecha de generación. |
| `expires_at` | Vencimiento opcional. |

Ejemplos de claves:

- `most_read`
- `spontaneous_trends`
- `monthly_trends`
- `yearly_trends`
- `new_releases`

La clave debe ser única según la combinación de carrusel y período. Los IDs guardados deben corresponder a libros/autores válidos. No duplicar toda la información bibliográfica en el JSON.

Si el proyecto ya cuenta con Redis u otra caché apropiada, investigar si conviene utilizarla. No agregar una dependencia externa sin necesidad. Una tabla MySQL puede ser suficiente para una primera implementación, especialmente si los resultados son pequeños y se actualizan una vez al día.

### 8.5. Worker global diario

Un worker independiente debe actualizar los carruseles globales una vez al día.

Proceso esperado:

1. Consultar los eventos y agregados necesarios.
2. Calcular `most_read`, tendencias, lanzamientos y demás carruseles globales.
3. Aplicar umbrales, períodos, filtros de disponibilidad y límites.
4. Guardar el nuevo resultado.
5. Publicar el nuevo conjunto únicamente cuando esté completo.
6. Mantener el resultado anterior si el cálculo falla.

La actualización debe ser atómica desde el punto de vista del lector. La página de inicio nunca debe recibir una lista parcialmente escrita.

El worker debe tener manejo de errores, logs, métricas y protección contra ejecuciones simultáneas. Debe ser posible volver a ejecutarlo sin duplicar resultados ni alterar contadores.

El horario debe definirse con una zona horaria explícita. Para estadísticas globales se recomienda utilizar una referencia uniforme, preferentemente UTC, y documentar cómo se interpretan los límites de mes y año.

---

## 9. Composición de la página de inicio y endpoints

La página de inicio debe coordinar las fuentes de datos sin convertir un único endpoint en una consulta gigante.

Puede existir un endpoint general, por ejemplo `GET /api/home`, si el contrato actual del frontend lo permite. Debe actuar como orquestador de servicios especializados, no contener toda la lógica de negocio ni ejecutar cálculos pesados.

Fuentes principales:

| Tipo | Fuente | Carruseles |
|---|---|---|
| Personalizados | `UserRecommendation` | Para vos, épocas, géneros, tipos, temas, países, joyas. |
| Datos del usuario | Relación usuario-libro y listas | Seguir leyendo, para leer, de lista, volver a leerlo. |
| Contextuales | Libros leídos, autores y similitud | Porque leíste, más de autor, autores. |
| Globales | `HomeCarouselCache` | Más leídos, tendencias, lanzamientos. |

### 9.1. Consultas específicas por endpoint

Cada endpoint debe seleccionar únicamente los atributos que necesita.

Ejemplo conceptual:

- `for_you`: necesita `id`, `titulo`, `url_portada`, `ranking`, `id_autor` y `tags` para aplicar filtros o construir la respuesta. No debe devolver descripción extensa, campos administrativos ni relaciones que no utilice.
- `seguir_leyendo`: necesita los datos de tarjeta y el estado/fecha de la relación. No necesita `tags` si no los utiliza.
- `para_leer`: necesita datos de tarjeta y la relación de lectura. No necesita `tags`.
- `most_read`: necesita datos de tarjeta y `read_count` o los IDs precalculados. No necesita `tags`.
- `porque_leiste`: necesita los atributos necesarios para la similitud, incluidos los tags relevantes, pero solo de los candidatos acotados.
- `de_lista`: necesita datos de tarjeta y la relación con la lista. No necesita `tags` salvo que la interfaz o la regla lo requiera.

Los ejemplos son orientativos. El agente debe verificar qué campos consume realmente el frontend.

**No incluir `tags` en todas las respuestas por comodidad.** Es un atributo potencialmente pesado y solo debe recuperarse cuando la lógica del endpoint lo necesite. Del mismo modo, no seleccionar descripciones largas, metadatos o relaciones que no se utilizan.

### 9.2. Consultas SQL y Sequelize

- Utilizar `attributes` para proyectar solo los campos necesarios.
- Utilizar `include` únicamente para relaciones requeridas.
- Evitar `include` anidados innecesarios.
- Aplicar `where`, `limit`, `order` y filtros en SQL.
- No traer 50.000 libros para filtrarlos en JavaScript.
- Evitar consultas N+1.
- No ejecutar una consulta por cada libro para obtener su autor o portada.
- Usar consultas agrupadas y joins cuando sean adecuados.
- Revisar el SQL generado por Sequelize en consultas críticas.
- Analizar planes de ejecución (`EXPLAIN`) para consultas importantes.
- No utilizar `raw: true` o consultas manuales indiscriminadamente: elegir según necesidad y mantener seguridad.
- No construir SQL mediante concatenación de valores proporcionados por el usuario.

### 9.3. Límites, paginación y respuestas

- Máximo 20 libros por carrusel.
- Limitar resultados en la base de datos.
- Para listados extensos, utilizar paginación adecuada; evaluar paginación por cursor cuando el volumen y el orden lo requieran.
- Validar parámetros y establecer máximos del lado del servidor.
- No permitir que el cliente solicite cantidades arbitrarias.
- Evitar respuestas enormes que incluyan todos los datos de cada libro.
- Mantener un contrato consistente para que el frontend pueda representar carruseles vacíos u omitidos.

La composición debe omitir carruseles que no cumplan las condiciones mínimas. No debe devolver carruseles vacíos solo para mantener una estructura fija.

---

## 10. Organización de workers y procesamiento en segundo plano

Se requieren dos responsabilidades de procesamiento independientes:

### 10.1. Worker de recomendaciones por usuario

Responsabilidades:

- Detectar usuarios cuyas recomendaciones estén pendientes.
- Agrupar cambios cercanos del mismo usuario.
- Leer sus preferencias efectivas.
- Generar candidatos acotados.
- Calcular puntuaciones.
- Aplicar diversidad y exploración.
- Guardar una nueva generación de recomendaciones de forma segura.
- Marcar el trabajo como completado y registrar errores.

No debe recalcular a todos los usuarios por cada cambio individual.

La implementación puede utilizar una cola existente o una tabla de trabajos en MySQL si el proyecto no dispone de infraestructura de colas. Antes de incorporar Redis, BullMQ u otra herramienta, investigar qué está instalado y qué necesita realmente el proyecto.

Debe existir control de concurrencia para que dos workers no regeneren simultáneamente las recomendaciones del mismo usuario.

### 10.2. Worker de estadísticas globales

Responsabilidades:

- Ejecutarse con una frecuencia diaria.
- Calcular los carruseles globales.
- Actualizar agregados si corresponde.
- Escribir el nuevo caché de forma atómica.
- Mantener el resultado anterior ante fallos.
- Registrar duración, cantidad de elementos y errores.

Los workers deben poder ejecutarse de forma independiente del servidor web y no deben bloquear el event loop con cálculos sin límite. Los lotes deben tener tamaños controlados.

---

## 11. Seguridad y consistencia

La implementación debe seguir las prácticas de seguridad del backend existente y reforzarlas donde sea necesario.

### SQL injection

- Utilizar Sequelize con parámetros y condiciones estructuradas.
- En SQL manual, utilizar parámetros enlazados (`bind`/replacements) correctamente.
- Nunca concatenar strings del usuario para construir `WHERE`, `ORDER BY`, nombres de columnas o fragmentos SQL.
- Los campos dinámicos de ordenamiento deben seleccionarse desde una lista permitida del servidor.
- Validar tipos, rangos y formatos de todos los parámetros.

### Autorización

- Los endpoints personalizados deben obtener el usuario desde el contexto autenticado, no confiar en un `user_id` enviado libremente por el cliente.
- Verificar que el usuario tenga permiso para acceder a listas y datos privados.
- Evitar que un usuario pueda consultar o regenerar las recomendaciones de otro.
- Proteger endpoints administrativos y tareas de mantenimiento.

### Validación y límites

- Validar parámetros y cuerpos con el mecanismo de validación ya incorporado en el proyecto.
- Establecer límites de resultados, paginación y frecuencia.
- Aplicar rate limiting donde corresponda.
- Evitar endpoints que permitan disparar regeneraciones costosas repetidamente.
- No permitir que el cliente controle pesos, puntuaciones o contadores internos sin validación y reglas de negocio del servidor.

### Transacciones e idempotencia

- Mantener consistentes la relación usuario-libro, `read_count`, eventos y preferencias.
- Registrar eventos solo ante transiciones válidas.
- Evitar incrementos duplicados por reintentos.
- Utilizar transacciones donde varias escrituras formen una única operación lógica.
- Definir cómo recuperar trabajos fallidos y cómo reintentar sin duplicar efectos.

### Datos y logs

- No registrar tokens, contraseñas ni datos sensibles.
- Registrar errores con contexto suficiente para diagnosticar, sin exponer información privada.
- No devolver trazas internas ni consultas SQL al cliente en producción.

---

## 12. Rendimiento: objetivo de 100.000 usuarios activos

La arquitectura debe diseñarse para ese objetivo desde el principio, pero las decisiones deben basarse en mediciones.

### Requisitos obligatorios

1. **Índices:** revisar índices en claves foráneas y columnas usadas para filtrar, unir y ordenar. Evaluar índices compuestos según las consultas reales.
2. **Proyección:** seleccionar solo atributos necesarios; `tags` se consulta únicamente cuando el endpoint lo necesita.
3. **Filtros en base de datos:** evitar traer el catálogo y filtrar en memoria.
4. **Límites:** todas las consultas de carruseles deben tener límites definidos.
5. **N+1:** evitar consultas por elemento del carrusel.
6. **Caché:** reutilizar resultados globales y recomendaciones persistidas.
7. **Workers:** sacar cálculos costosos del ciclo HTTP.
8. **Concurrencia:** agrupar regeneraciones y evitar trabajos duplicados.
9. **Consultas eficientes:** revisar SQL generado y planes de ejecución.
10. **Observabilidad:** medir latencia, cantidad de filas leídas, consultas por endpoint, errores y duración de workers.
11. **Pruebas de carga:** probar escenarios de concurrencia y volumen representativos antes de afirmar que se soportan 100.000 usuarios activos.
12. **Degradación controlada:** si un worker falla, la aplicación debe seguir mostrando el último conjunto válido o carruseles alternativos; la página de inicio no debe quedar inutilizable.

No asumir que 100.000 usuarios activos equivalen a 100.000 peticiones simultáneas. Se deben definir escenarios de carga realistas y medirlos. Tampoco se debe afirmar que el sistema escala únicamente por agregar índices: hay que revisar consultas, conexiones, pool de Sequelize, workers y límites de la infraestructura.

---

## 13. Pruebas obligatorias

El sistema debe contar con tests unitarios y de integración para las reglas de negocio y las consultas críticas.

Casos mínimos:

### Preferencias

- Crear preferencias cuando el usuario no tiene ninguna.
- Actualizar un tag existente.
- Aplicar decaimiento tras 75, 150 y 300 días.
- Decaer pesos positivos y negativos hacia cero.
- No cambiar el signo de un peso.
- Modificar una valoración sin duplicar el efecto anterior.
- Repetir una acción sin duplicar el efecto.
- Quitar un favorito y verificar el tratamiento de su señal.

### Estados y estadísticas

- `para leer -> leído`: `read_count` aumenta una vez y se registra un evento.
- `leyendo -> leído`: aumenta una vez y se registra un evento.
- `leído -> para leer`: disminuye una vez, no elimina el evento histórico.
- `leído -> leyendo`: disminuye una vez.
- `leído -> leído`: no cambia el contador ni registra otro evento.
- Reintento de una petición: no duplica estadísticas.
- Dos operaciones concurrentes: no dejan contadores inconsistentes.

### Recomendaciones

- Usuario sin preferencias.
- Usuario con preferencias positivas.
- Usuario con preferencias negativas.
- Usuario con varios intereses.
- Usuario con tags ausentes en algunos libros.
- Exclusión de libros leídos en carruseles de descubrimiento.
- `Para vos` excluye `ranking <= 3.0` y nulos.
- Máximo 3 libros por autor.
- Máximo 20 libros por carrusel.
- Aproximadamente 20% de exploración cuando haya candidatos válidos.
- Variación controlada y resultados estables durante el período definido.
- Carruseles omitidos cuando no cumplen condiciones.

### Globales y workers

- Conteo de usuarios únicos por período.
- Umbral mínimo de 30 para tendencias.
- Períodos mensuales y ventanas móviles correctamente delimitados.
- Worker idempotente.
- Fallo durante generación: conserva caché anterior.
- Dos ejecuciones simultáneas: no publican resultados parciales ni se pisan incorrectamente.

### Rendimiento

- Verificar que cada endpoint selecciona solo sus atributos necesarios.
- Verificar que endpoints que no utilizan tags no consultan ni devuelven `tags`.
- Verificar límites máximos.
- Revisar consultas N+1.
- Ejecutar `EXPLAIN` sobre consultas importantes.
- Crear pruebas de carga para escenarios definidos.

---

## 14. Alcance futuro: no implementar ahora sin aprobación

La arquitectura debe permitir evolucionar, pero no se deben incorporar estas tecnologías como parte de la primera implementación sin una necesidad demostrada.

Posibles mejoras futuras:

- Google Analytics u otra herramienta de analítica para entender el uso de los carruseles.
- Registro de impresiones, clics, omisiones y acciones sobre recomendaciones, con criterios de privacidad y retención.
- Embeddings para encontrar similitud semántica entre sinopsis y libros.
- Modelos de machine learning para ranking o personalización.
- Recomendaciones basadas en usuarios con gustos similares.
- Caché distribuida si las mediciones justifican Redis u otra solución.
- Procesamiento distribuido si un único worker deja de ser suficiente.
- Experimentos A/B para comparar algoritmos.
- Ajuste automático de parámetros a partir de resultados medidos.

Estas son posibilidades de evolución, no requisitos actuales. No agregar IA, embeddings, servicios pagos o infraestructura externa por anticipado.

---

## 15. Plan de implementación recomendado

El trabajo debe realizarse en etapas pequeñas, revisables y con pruebas.

1. **Auditoría:** documentar modelos, relaciones, endpoints, consultas y dependencias existentes.
2. **Diseño de datos:** definir cómo se almacenan preferencias, candidatos, eventos y caché, reutilizando estructuras existentes.
3. **Consistencia de interacciones:** asegurar transiciones de lectura, valoraciones, favoritos y contadores idempotentes.
4. **Preferencias:** implementar actualización de tags, reversión/cambio de señales y decaimiento.
5. **Candidatos:** implementar generación acotada, puntuación, diversidad y almacenamiento independiente.
6. **Worker personalizado:** procesar regeneraciones sin bloquear peticiones.
7. **Carruseles personalizados:** implementar `Para vos` y carruseles que reutilizan candidatos.
8. **Carruseles del usuario y contextuales:** implementar consultas específicas y filtros.
9. **Eventos y estadísticas:** registrar nuevas lecturas y construir métricas globales.
10. **Worker global y caché:** precalcular tendencias y popularidad.
11. **Composición de inicio:** coordinar los carruseles sin convertir el endpoint en una consulta pesada.
12. **Optimización y pruebas:** revisar índices, SQL, N+1, carga, seguridad y observabilidad.

No es necesario realizar todo en un único cambio. Cada etapa debe dejar el sistema en un estado funcional y probado.

---

## 16. Entrega y comunicación de cambios

Al finalizar cada etapa, el agente debe informar:

- Qué archivos inspeccionó.
- Qué comportamiento encontró en la implementación anterior.
- Qué archivos modificó y por qué.
- Qué tablas, columnas, índices, asociaciones o migraciones agregó o modificó.
- Qué endpoints cambió o creó y qué contrato tienen.
- Qué lógica anterior reemplazó y cómo se mantuvo la compatibilidad.
- Qué tests ejecutó y sus resultados.
- Qué decisiones quedaron pendientes.
- Qué riesgos o limitaciones siguen existiendo.

Debe comentar el código donde la lógica no sea evidente, especialmente en cálculos de preferencias, transiciones de estado, idempotencia, selección de candidatos y workers. No llenar el código de comentarios redundantes que repitan lo que ya expresa la implementación.

No declarar una tarea terminada si no se ejecutaron las pruebas relevantes o si quedan errores conocidos sin informar.

---

## 17. Criterios de aceptación

La implementación puede considerarse preparada para su siguiente etapa cuando:

- Las recomendaciones antiguas fueron auditadas y su reemplazo está documentado.
- Las preferencias individuales se actualizan de forma consistente y sin duplicaciones.
- El decaimiento temporal funciona con `updated_at` por tag.
- Los candidatos se generan de forma acotada y se almacenan en una tabla independiente.
- Los carruseles personalizados reutilizan candidatos y no recorren el catálogo completo.
- `Para vos` aplica `ranking > 3.0`, máximo 20 libros, máximo 3 por autor y exploración controlada.
- Los carruseles del usuario consultan únicamente sus relaciones.
- Las nuevas lecturas se registran mediante transiciones reales a `leído`.
- `read_count` representa el estado actual y no se confunde con eventos históricos.
- Los carruseles globales se precalculan y almacenan para reutilizarlos entre usuarios.
- Los workers pueden reintentarse sin duplicar efectos y conservan resultados válidos ante fallos.
- Los endpoints proyectan únicamente los atributos necesarios y omiten `tags` cuando no se utiliza.
- Las consultas críticas tienen índices revisados y no presentan N+1 conocidos.
- La implementación tiene tests de reglas de negocio, seguridad e integración.
- La capacidad objetivo está acompañada por pruebas de carga y métricas, no por suposiciones.

**Regla final:** actuar como un ingeniero senior responsable de un sistema de producción. Investigar antes de modificar, diseñar antes de implementar, reutilizar antes de duplicar, medir antes de optimizar y no inventar comportamientos ni datos. La prioridad es que el sistema sea correcto, consistente, seguro, eficiente y mantenible a medida que NextRead crezca.
