# Product Requirements Document: Runtime Config Service for Cloudflare

## 1. Identificación del producto

**Nombre de trabajo:** Runtime Config Service for Cloudflare
**Tipo de producto:** sistema de configuración dinámica en tiempo de ejecución para aplicaciones y servicios desplegados en Cloudflare
**Destinatarios:** personal técnico, equipo de desarrollo y agentes de inteligencia artificial utilizados para implementación, revisión, automatización o soporte técnico

---

## 2. Propósito

Definir un sistema centralizado para almacenar, leer, crear, actualizar y servir variables y constantes de aplicación en tiempo de ejecución dentro de una arquitectura desplegada en Cloudflare, evitando que la configuración editable dependa del ciclo de despliegue.

El sistema debe permitir que distintos recursos de Cloudflare consuman valores compartidos en tiempo de ejecución, con separación explícita entre:

* configuración editable no sensible;
* secretos y credenciales sensibles;
* configuración estructural ligada al despliegue.

Cloudflare documenta que los *bindings* de `env` exponen recursos y configuración al código del servicio, y que variables de entorno y secretos son tipos de *binding* ligados al Worker o al proyecto, no un almacén global mutable compartido entre todos los servicios. ([Cloudflare Docs][1])

---

## 3. Problema a resolver

La aplicación web necesita permitir que un usuario autorizado modifique ciertos valores funcionales desde una interfaz de usuario, y que dichos cambios se reflejen sin redeploy.

El uso de `Environment Variables` (Variables de Entorno) o `Secrets` (Secretos) como repositorio principal no cubre este requisito operativo porque su gestión pertenece a la configuración del servicio y al proceso de despliegue. Cloudflare indica que la configuración del Worker se gestiona mediante archivo de configuración de Wrangler y opciones de despliegue. Además, los secretos se añaden desde Dashboard o Wrangler y su disponibilidad queda ligada al servicio donde se configuran. ([Cloudflare Docs][2])

---

## 4. Objetivo principal

Construir un **runtime configuration layer** (capa de configuración en tiempo de ejecución) con estas propiedades:

* lectura en tiempo de ejecución desde código;
* escritura en tiempo de ejecución desde una interfaz de usuario de administración;
* acceso compartido desde múltiples recursos de Cloudflare;
* soporte para caché con invalidación o reinicialización;
* separación entre datos sensibles y no sensibles.

---

## 5. Objetivos funcionales

### 5.1 Objetivos obligatorios

1. Permitir almacenar configuración editable no sensible en un repositorio central.
2. Permitir lectura de configuración desde:

   * `Cloudflare Workers`;
   * `Cloudflare Pages Functions`;
   * `Cloudflare Workflows`, cuando aplique.
3. Permitir actualización de configuración desde la interfaz de usuario de la aplicación web sin redeploy.
4. Permitir siembra inicial de datos mediante `Wrangler CLI` (Command Line Interface, Interfaz de Línea de Comandos) o migraciones.
5. Mantener los secretos fuera de la interfaz de usuario.
6. Permitir que algunos consumidores lean en directo y otros operen con caché local o memoria temporal.
7. Permitir un mecanismo de refresh o reset forzado para consumidores con caché.

Cloudflare documenta que `Pages Functions` ejecuta código en la red de Cloudflare con Workers y que los *bindings* de recursos, incluido `D1`, pueden configurarse para `Pages Functions`. También documenta que `Workflows` puede acceder a *bindings* mediante `this.env`. ([Cloudflare Docs][3])

### 5.2 Objetivos deseables

1. Soportar versionado lógico de configuración.
2. Permitir auditoría de cambios.
3. Permitir invalidación selectiva por clave o por namespace.
4. Permitir prefetch de claves críticas para reducir latencia de primer acceso.

---

## 6. No objetivos

1. No convertir `Environment Variables` en sistema de edición diaria para el usuario final.
2. No exponer `Secrets` en la interfaz de usuario.
3. No usar `Cloudflare Dashboard` como interfaz funcional primaria para cambios operativos de negocio.
4. No depender de redeploy para aplicar cambios rutinarios de configuración.
5. No replicar un gestor genérico de secretos de cuenta como `Secrets Store` (Almacén de Secretos) para valores de negocio editables desde interfaz.

Cloudflare documenta que los secretos están pensados para valores sensibles y quedan ocultos en Dashboard y Wrangler una vez configurados. ([Cloudflare Docs][4])

---

## 7. Principio de diseño aprobado

### 7.1 Patrón base

Separar la configuración en tres capas:

1. **Runtime editable config** (configuración editable en tiempo de ejecución)
   Repositorio central en `Cloudflare D1`.

2. **Sensitive config** (configuración sensible)
   Secretos en `Secrets` o, si el alcance de cuenta lo requiere, en `Secrets Store`.

3. **Deployment config** (configuración de despliegue)
   Valores estáticos o estructurales en `wrangler.toml`, `wrangler.jsonc` o en `Environment Variables`.

Cloudflare documenta que `D1` es una base de datos SQL gestionada y serverless con acceso desde Workers y proyectos Pages, y que su acceso desde código se realiza a través del *binding* del entorno, por ejemplo `env.DB`. ([Cloudflare Docs][5])

### 7.2 Decisión técnica clave

El sistema usará `Cloudflare D1` como **source of truth** (fuente de verdad) para toda configuración editable no sensible.

---

## 8. Usuarios y actores del sistema

### 8.1 Technical Admin (Administrador técnico)

* define estructura de claves;
* ejecuta migraciones;
* establece políticas de acceso;
* configura *bindings* y secretos.

### 8.2 Application Admin (Administrador de aplicación)

* modifica valores desde la interfaz de usuario autorizada;
* fuerza refresh o reset cuando corresponda;
* consulta estado y auditoría.

### 8.3 Runtime Consumers (Consumidores en tiempo de ejecución)

* `Workers`;
* `Pages Functions`;
* `Workflows`;
* otros servicios internos que accedan mediante `Service Bindings` (Vinculaciones de Servicio).

Cloudflare documenta que `Service Bindings` permite a un Worker invocar a otro sin pasar por una dirección pública accesible en Internet. También documenta que un `Pages Function` puede llamar a un Worker mediante `Service Bindings`. ([Cloudflare Docs][6])

### 8.4 AI Agents (Agentes de inteligencia artificial)

* generan código;
* ejecutan comprobaciones;
* redactan migraciones;
* validan cumplimiento de reglas del PRD;
* no deben alterar requisitos funcionales sin aprobación humana.

---

## 9. Alcance funcional

### 9.1 Lectura de configuración

El sistema debe soportar:

* lectura por clave;
* lectura por grupo o namespace;
* lectura de configuración pública mínima para bootstrap de interfaz;
* lectura con fallback controlado.

### 9.2 Escritura de configuración

El sistema debe soportar:

* create;
* update;
* soft delete o desactivación lógica;
* restauración opcional;
* actualización masiva controlada, si se aprueba en fase de diseño.

### 9.3 Caché

El sistema debe permitir dos modos:

1. **Direct read mode**
   El consumidor lee de `D1` en cada acceso.

2. **Cached read mode**
   El consumidor mantiene copia temporal y la refresca por:

   * tiempo de expiración;
   * cambio de versión;
   * invalidación explícita;
   * reinicialización forzada desde la aplicación web.

### 9.4 Bootstrap de interfaz

La aplicación web debe poder obtener una configuración pública mínima en el primer ciclo de carga, por ejemplo:

* `favicon path`;
* `brand name`;
* `theme tokens`;
* `feature flags` públicos.

La obtención inicial debe realizarse desde una ruta server-side, no desde secretos.

---

## 10. Requisitos funcionales detallados

### 10.1 Repositorio central

Debe existir una base de datos `D1` dedicada a configuración de aplicación.

Requisitos:

* estructura relacional simple;
* lectura rápida por clave;
* soporte de metadatos;
* soporte de control de versiones lógico;
* compatibilidad con acceso desde `Worker Binding API` (Interfaz de Programación de Aplicaciones de Vinculación para Workers).

Cloudflare documenta que el patrón de acceso a `D1` desde un Worker consiste en enlazar la base de datos, preparar una sentencia y ejecutarla. ([Cloudflare Docs][7])

### 10.2 Acceso desde código

El acceso debe efectuarse a través de un servicio de aplicación, no mediante consultas dispersas en cualquier módulo.

Se define como requisito:

* encapsular acceso a `D1` en un `Config Repository` o `Config Service`;
* exponer métodos normalizados de lectura y escritura;
* impedir lógica SQL repetida en múltiples componentes.

### 10.3 Escritura desde interfaz de usuario

La aplicación web debe exponer un conjunto de endpoints internos para administración de configuración.

Requisitos:

* autenticación obligatoria;
* autorización por rol;
* validación de esquema;
* trazabilidad de usuario;
* respuesta determinista.

### 10.4 Siembra inicial y migraciones

`Wrangler` debe usarse para:

* crear `D1`;
* aplicar `migrations`;
* cargar configuración inicial;
* asociar *bindings*;
* desplegar cambios de infraestructura.

Cloudflare documenta el uso de `wrangler d1 create` para crear bases `D1`, así como la configuración de *bindings* en el archivo de configuración de Wrangler. ([Cloudflare Docs][8])

### 10.5 Separación de secretos

Toda credencial sensible debe almacenarse en `Secrets` o `Secrets Store`.

Requisitos:

* no persistir secretos en `D1`;
* no devolver secretos en respuestas de la interfaz;
* no registrar secretos en logs;
* no mezclar secretos con configuración pública editable.

Cloudflare documenta `Secrets` como mecanismo específico para valores sensibles y `Secrets Store` como opción a nivel de cuenta para su integración con Workers. ([Cloudflare Docs][4])

---

## 11. Requisitos no funcionales

### 11.1 Seguridad

1. Toda escritura requiere autenticación.
2. Toda escritura requiere autorización explícita por rol o política.
3. Debe existir validación estricta de claves permitidas.
4. Debe impedirse la edición de claves reservadas.
5. Debe existir separación entre configuración pública y privada.

### 11.2 Rendimiento

1. La lectura de claves críticas debe ser de baja latencia.
2. El sistema debe permitir caché para reducir lecturas repetidas.
3. Debe evitarse consultar `D1` innecesariamente en rutas de alto tráfico cuando exista caché válida.

### 11.3 Consistencia

1. `D1` será la fuente de verdad de configuración editable.
2. Los consumidores con caché deben poder detectar obsolescencia.
3. La reinicialización manual debe producir convergencia a estado consistente.

### 11.4 Mantenibilidad

1. Debe existir tipado o esquema validable.
2. Debe existir separación entre acceso a datos, reglas de negocio y exposición de endpoints.
3. El sistema debe ser apto para pruebas automatizadas.

### 11.5 Observabilidad

1. Deben registrarse cambios de configuración.
2. Deben registrarse errores de validación.
3. Deben registrarse eventos de invalidación o reset.
4. Los logs no deben incluir secretos.

---

## 12. Requisitos de arquitectura

### 12.1 Componentes mínimos

1. `D1` como almacén central de configuración editable.
2. Un `Config API Worker` o un módulo server-side equivalente.
3. `Pages Functions` o `Workers` consumidores.
4. Módulo de caché local o estrategia de memoización controlada.
5. Mecanismo de invalidación o refresh.
6. `Secrets` para datos sensibles.

### 12.2 Patrón de acceso recomendado

Se recomienda centralizar la escritura y, preferiblemente, también la lectura compleja a través de un servicio dedicado, en lugar de permitir que cada consumidor implemente su propia lógica de consulta.

Cuando exista desacoplamiento entre aplicaciones o servicios, se permite usar `Service Bindings` para invocación interna entre Workers. Cloudflare documenta este patrón como mecanismo nativo de comunicación interna entre servicios. ([Cloudflare Docs][6])

### 12.3 Compatibilidad con Workflows

Si se requiere que `Cloudflare Workflows` lea configuración compartida, el diseño debe asumir que el flujo accede a *bindings* mediante `this.env` y que las operaciones deben ser idempotentes cuando formen parte de pasos con reintentos.

Cloudflare documenta tanto el acceso a *bindings* desde `this.env` como la necesidad de idempotencia en llamadas a APIs o *bindings* dentro de pasos de Workflow. ([Cloudflare Docs][9])

---

## 13. Modelo conceptual de datos

### 13.1 Entidad principal: config_entry

Campos funcionales mínimos:

* `key`
* `value`
* `value_type`
* `namespace`
* `is_sensitive`
* `is_public`
* `version`
* `status`
* `updated_at`
* `updated_by`

### 13.2 Reglas conceptuales

1. `key` debe ser única dentro de su `namespace`.
2. `is_sensitive = true` no debe permitirse en `D1`; si se conserva este campo, solo podrá marcar entradas de referencia, no secretos reales.
3. `is_public = true` habilita uso para bootstrap de interfaz.
4. `version` debe cambiar en cada escritura efectiva.
5. `status` debe permitir desactivar sin borrar físicamente, si se aprueba este comportamiento.

---

## 14. Reglas de negocio

1. Una clave pública puede usarse en el primer render de la interfaz.
2. Una clave no pública no debe exponerse al cliente.
3. Una clave sensible no debe almacenarse en `D1`.
4. Una clave reservada no puede editarse desde la interfaz.
5. Toda modificación debe dejar rastro de autor y fecha.
6. Toda modificación debe invalidar o marcar como obsoleta la caché relacionada.
7. Toda operación de escritura debe validar tipo, formato y permiso.

---

## 15. Interfaz funcional esperada

### 15.1 Endpoints internos mínimos

Se requieren, como mínimo, operaciones equivalentes a:

* `getConfig(key)`
* `getConfigByNamespace(namespace)`
* `setConfig(key, value)`
* `deleteConfig(key)` o `disableConfig(key)`
* `refreshConfigCache()`
* `getPublicBootstrapConfig()`

Los nombres definitivos se decidirán en diseño de arquitectura, pero el contrato funcional debe cubrir esas capacidades.

### 15.2 Restricción de exposición

No debe existir exposición pública irrestricta de endpoints de escritura.

---

## 16. Administración y operaciones

### 16.1 Operaciones iniciales

1. Crear base de datos con `wrangler d1 create`.
2. Declarar *binding* en `wrangler.toml` o `wrangler.jsonc`.
3. Aplicar migraciones.
4. Sembrar valores iniciales.
5. Configurar secretos.
6. Desplegar servicios consumidores.

Cloudflare documenta que la configuración de Workers se gestiona mediante el archivo de configuración de Wrangler y que `D1` se enlaza como *binding*. ([Cloudflare Docs][2])

### 16.2 Operaciones recurrentes

1. Alta de nuevas claves.
2. Modificación de valores.
3. Invalidación o reset de caché.
4. Auditoría de cambios.
5. Rotación de secretos por canal separado.

### 16.3 Recuperación

Debe definirse una estrategia de:

* backup lógico de configuración;
* re-seeding;
* restauración de valores por versión o snapshot, si se aprueba en diseño.

---

## 17. Riesgos y restricciones

### 17.1 Riesgos

1. Lecturas repetidas a `D1` en rutas de alto tráfico pueden introducir latencia evitable.
2. Una caché mal invalidada puede servir configuración obsoleta.
3. Exponer demasiadas claves a bootstrap puede filtrar configuración interna.
4. Mezclar secretos con configuración editable puede romper el modelo de seguridad.
5. Permitir escrituras sin esquema puede generar corrupción funcional.

### 17.2 Restricciones técnicas

1. `Environment Variables` y `Secrets` pertenecen al modelo de *bindings* del servicio, no al de almacenamiento dinámico compartido.
2. `Pages Functions` consume recursos mediante *bindings* del proyecto.
3. `Workflows` puede requerir diseño específico si se invoca desde Pages, ya que Cloudflare documenta que para llamar a Workflows desde Pages se usa un Worker separado o `Service Bindings`. ([Cloudflare Docs][10])

---

## 18. Criterios de aceptación

El producto se considerará válido cuando se cumplan, como mínimo, estos criterios:

1. Un valor no sensible puede crearse y editarse desde la interfaz de usuario sin redeploy.
2. Un `Worker` puede leer ese valor en tiempo de ejecución.
3. Un `Pages Function` puede leer ese valor en tiempo de ejecución.
4. Un flujo compatible puede leer el valor mediante su acceso a *bindings* o a través del servicio definido.
5. Un cambio de valor puede reflejarse:

   * en lectura directa, de forma inmediata en la siguiente consulta;
   * en lectura con caché, tras refresh o reset.
6. Un secreto no aparece en la interfaz ni se almacena en `D1`.
7. El sistema registra autor, fecha y resultado de cada operación de escritura.
8. La configuración de despliegue queda separada de la configuración editable.

---

## 19. Decisiones ya fijadas por este documento

1. `Cloudflare D1` será el almacén central de configuración editable no sensible.
2. `Secrets` o `Secrets Store` se reservará para datos sensibles.
3. `Wrangler` se usará para infraestructura, migraciones y siembra inicial, no como mecanismo principal de edición diaria.
4. El sistema soportará lectura directa y lectura con caché.
5. La aplicación web podrá forzar refresh o reset de configuración en consumidores que mantengan caché.

---

## 20. Cuestiones abiertas para la siguiente fase de diseño de arquitectura

1. ¿La caché será solo en memoria del proceso, o incluirá un nivel distribuido adicional?
2. ¿La invalidación será por versión global, por namespace o por clave?
3. ¿La auditoría vivirá en tabla separada?
4. ¿Se permitirá edición masiva?
5. ¿Se usará un `Config API Worker` dedicado o se integrará en el backend actual de la aplicación?
6. ¿Qué claves formarán parte del bootstrap público inicial?
7. ¿Qué política de control de acceso se aplicará a cada namespace?

---

## 21. Resumen ejecutivo técnico

Este PRD fija un sistema de configuración dinámica para Cloudflare basado en `D1` como fuente de verdad de toda configuración editable no sensible, con acceso en tiempo de ejecución desde `Workers`, `Pages Functions` y componentes compatibles, mientras que la información sensible queda aislada en `Secrets` o `Secrets Store`. `Wrangler` queda reservado para provisión, *bindings*, migraciones y despliegue. El sistema debe admitir lectura directa, lectura con caché e invalidación controlada, y debe permitir que la aplicación web modifique valores sin redeploy. ([Cloudflare Docs][7])

[1]: https://developers.cloudflare.com/workers/runtime-apis/bindings/?utm_source=chatgpt.com "Bindings (env) · Cloudflare Workers docs"
[2]: https://developers.cloudflare.com/workers/configuration/?utm_source=chatgpt.com "Configuration · Cloudflare Workers docs"
[3]: https://developers.cloudflare.com/pages/functions/?utm_source=chatgpt.com "Functions · Cloudflare Pages docs"
[4]: https://developers.cloudflare.com/workers/configuration/secrets/?utm_source=chatgpt.com "Secrets · Cloudflare Workers docs"
[5]: https://developers.cloudflare.com/d1/?utm_source=chatgpt.com "Overview · Cloudflare D1 docs"
[6]: https://developers.cloudflare.com/workers/runtime-apis/bindings/service-bindings/?utm_source=chatgpt.com "Service bindings - Runtime APIs · Cloudflare Workers docs"
[7]: https://developers.cloudflare.com/d1/worker-api/?utm_source=chatgpt.com "Workers Binding API - D1"
[8]: https://developers.cloudflare.com/d1/get-started/?utm_source=chatgpt.com "Getting started · Cloudflare D1 docs"
[9]: https://developers.cloudflare.com/workflows/get-started/guide/?utm_source=chatgpt.com "Build your first Workflow"
[10]: https://developers.cloudflare.com/workers/configuration/environment-variables/?utm_source=chatgpt.com "Environment variables - Workers"
