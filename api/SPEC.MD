Durante toda la implementación respetá estas reglas:

SYSTEM_SPECIFICATION.md sigue siendo la referencia funcional del sistema, pero debe interpretarse teniendo en cuenta las decisiones de arquitectura posteriores y el código que ya está implementado.

Antes de modificar algo, inspeccioná su implementación actual. No crees modelos, tablas, servicios, controladores ni endpoints que ya existan.

No reimplementes funcionalidades de las etapas 1 a 4. Si encontrás problemas, identificá su causa y corregí únicamente lo necesario.

No hagas refactorizaciones ajenas al sistema de recomendaciones.

No cambies contratos de API sin localizar sus consumidores y comprobar la compatibilidad con el frontend.

Utilizá Node.js, Express, Sequelize y MySQL, respetando las convenciones actuales del proyecto.

Priorizá el costo de infraestructura y la simplicidad operativa. El sistema todavía no tiene un volumen de usuarios que justifique infraestructura distribuida.

No incorpores Redis, BullMQ, servicios de colas externos, MongoDB, Elasticsearch, OpenSearch, bases vectoriales ni otros servicios sin demostrar primero una necesidad concreta.

No agregues dependencias si podés resolver el problema razonablemente con las herramientas existentes.

No cargues el catálogo completo en memoria. Las consultas deben estar acotadas y recuperar solamente los atributos necesarios.

Evitá consultas N+1 y transacciones innecesariamente largas.

Utilizá transacciones, restricciones e idempotencia cuando corresponda.

No ejecutes cálculos pesados dentro de las peticiones HTTP si pueden realizarse en segundo plano.

No regeneres las recomendaciones cuando el usuario simplemente abre Home.

Diferenciá siempre entre:

Actualizar las preferencias del usuario ante una interacción.

Marcar que las recomendaciones necesitan regenerarse.

Ejecutar la generación de recomendaciones.

Consultar las recomendaciones que ya están persistidas.

No afirmes que una funcionalidad está terminada si no ejecutaste las pruebas pertinentes.

Si encontrás una contradicción entre la especificación, el código y estas instrucciones, documentala y explicá sus consecuencias antes de tomar una decisión importante.

Al terminar cada etapa, informá archivos modificados, migraciones, endpoints, pruebas ejecutadas, resultados y decisiones pendientes.