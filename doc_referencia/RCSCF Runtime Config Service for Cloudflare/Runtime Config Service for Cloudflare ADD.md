# Architecture Design Document: Runtime Config Service for Cloudflare

**Nombre de trabajo:** Runtime Config Service for Cloudflare
**Finalidad:** sistema de configuración dinámica en tiempo de ejecución para aplicaciones y servicios desplegados en Cloudflare
**Destinatarios:** personal técnico, equipo de desarrollo y agentes de inteligencia artificial utilizados para implementación, revisión, automatización o soporte técnico

## 1. Objetivo del diseño

Este documento define la arquitectura técnica del sistema de configuración dinámica en tiempo de ejecución para una aplicación web y sus servicios asociados desplegados en Cloudflare.

El diseño parte de una decisión ya fijada en el documento de requisitos de producto:

* `Cloudflare D1` será la **source of truth** (fuente de verdad) de la configuración editable no sensible.
* `Secrets` (Secretos) o `Secrets Store` (Almacén de Secretos) se reservará para datos sensibles.
* `Wrangler CLI` (Command Line Interface, Interfaz de Línea de Comandos) se usará para provisión, migraciones, siembra inicial y despliegue.
* El sistema debe soportar lectura directa y lectura con caché.
* La edición desde la interfaz de usuario debe reflejarse sin redeploy.

`Cloudflare D1` es una base de datos SQL serverless gestionada por Cloudflare y puede enlazarse tanto a `Workers` como a `Pages Functions`; su acceso desde código se realiza mediante *bindings* en `env` o `context.env`. ([Cloudflare Docs][1])

---

## 2. Principios de arquitectura

### 2.1 Separación por clase de dato

La arquitectura separa tres clases de configuración:

1. **Runtime Config** (Configuración de tiempo de ejecución)
   Valores editables en producción sin redeploy.

2. **Sensitive Config** (Configuración sensible)
   Tokens, claves, credenciales y secretos operativos.

3. **Deployment Config** (Configuración de despliegue)
   *Bindings*, nombres de recursos, identificadores, *feature toggles* estructurales y valores ligados al despliegue.

Cloudflare documenta que `Bindings` (Vinculaciones) exponen capacidades y recursos al código del Worker, y que las variables de entorno y los secretos son tipos de *binding* ligados al servicio. ([Cloudflare Docs][2])

### 2.2 Single source of truth (Fuente única de verdad)

Toda clave editable no sensible tendrá un único valor canónico en `D1`.
Ningún otro componente podrá considerarse fuente primaria de esos datos.

### 2.3 Write centralization (Centralización de escritura)

La escritura se centralizará en una capa de servicio interna.
No se permitirá que múltiples servicios escriban directamente en `D1` con lógica de negocio duplicada.

### 2.4 Read flexibility (Flexibilidad de lectura)

La lectura soportará:

* acceso directo a `D1`;
* acceso con caché local de proceso;
* acceso indirecto mediante un servicio interno.

### 2.5 Security by data class (Seguridad por clase de dato)

Los secretos no se almacenarán en `D1`.
Cloudflare documenta que `Secrets` son variables de entorno cuyo valor queda oculto tras su creación y deben usarse para datos sensibles. ([Cloudflare Docs][3])

---

## 3. Arquitectura lógica

## 3.1 Vista de alto nivel

La arquitectura queda compuesta por seis bloques:

1. **Admin UI**
   Interfaz de usuario de administración integrada en la aplicación web.

2. **Config API**
   Capa server-side responsable de exponer operaciones de lectura y escritura de configuración.

3. **Config Store**
   Base de datos `D1` con tablas de configuración, metadatos y auditoría.

4. **Runtime Consumers**
   Servicios que consumen configuración en tiempo de ejecución:

   * `Cloudflare Workers`
   * `Cloudflare Pages Functions`
   * `Cloudflare Workflows` cuando aplique

5. **Cache Layer**
   Caché local de proceso y control de versión para reducir consultas repetidas.

6. **Secrets Layer**
   `Secrets` o `Secrets Store` para datos sensibles no expuestos a la interfaz.

`Pages Functions` admite *bindings* para `D1`, `Service Bindings`, variables de entorno y secretos, accesibles en `context.env`. ([Cloudflare Docs][4])

## 3.2 Decisión de topología

Se adopta una topología con **un servicio central de configuración** y **consumidores desacoplados**.

La arquitectura recomendada es:

* `Pages` sirve la interfaz de usuario;
* `Pages Functions` o un `Worker` backend atiende peticiones de la interfaz;
* un `Config API Worker` concentra la lógica canónica de lectura, escritura, validación e invalidación;
* otros `Workers` y `Pages Functions` consumen configuración:

  * directamente desde `D1` solo para lecturas simples y de alto rendimiento controlado;
  * o preferentemente a través de `Service Bindings`.

Cloudflare documenta que `Service Bindings` permite que un Worker llame a otro sin exponer una dirección pública y que `Pages Functions` también puede enlazar un Worker mediante `Service Bindings`. ([Cloudflare Docs][5])

---

## 4. Componentes

## 4.1 Admin UI

### Función

Permitir a usuarios autorizados:

* listar claves;
* editar valores;
* crear claves nuevas;
* desactivar claves;
* forzar refresh o reset de caché;
* consultar auditoría.

### Ubicación

Aplicación web en `Cloudflare Pages`.

### Restricciones

* No accede directamente a `D1`.
* No accede directamente a secretos.
* Solo invoca endpoints internos autenticados.

---

## 4.2 Config API

### Función

Es el componente central del dominio de configuración.
Implementa:

* validación;
* autorización;
* serialización;
* lógica de lectura;
* lógica de escritura;
* auditoría;
* invalidación de caché;
* publicación de versión.

### Forma recomendada

**Opción recomendada:** `Config API Worker` dedicado.

**Motivo técnico:** permite desacoplar la gestión de configuración de la aplicación web, reutilizar la misma lógica desde múltiples consumidores y exponerla internamente por `Service Bindings`. Cloudflare documenta `Service Bindings` precisamente para separar responsabilidades entre servicios. ([Cloudflare Docs][5])

### Accesos permitidos

* `D1` por *binding*
* `Secrets` por `env`
* `Service Bindings` desde otros servicios
* opcionalmente `Workflow` binding, si debe disparar procesos de recalculado o sincronización

---

## 4.3 Config Store

### Recurso

`Cloudflare D1`

### Función

Persistir:

* claves de configuración;
* metadatos;
* estado;
* versión;
* auditoría de cambios;
* versión global de configuración para control de caché.

Cloudflare documenta que para usar `D1` desde un Worker debe enlazarse la base y accederse mediante `env`, preparando y ejecutando sentencias. ([Cloudflare Docs][6])

---

## 4.4 Runtime Consumers

### Tipos de consumidor

1. **Direct Consumer**
   Lee directamente desde `D1`.

2. **Proxy Consumer**
   Lee desde `Config API` mediante `Service Bindings`.

3. **Cached Consumer**
   Mantiene caché temporal local y sincroniza por versión.

### Regla recomendada

* Lecturas simples y escasas: acceso directo permitido.
* Lecturas compartidas entre muchos servicios: acceso por `Config API`.
* Lecturas de alta frecuencia: acceso con caché local y verificación de versión.

---

## 4.5 Cache Layer

### Función

Reducir lecturas repetidas a `D1`, especialmente para claves de:

* bootstrap;
* personalización visual;
* *feature flags* no sensibles;
* parámetros consultados en casi todas las peticiones.

### Forma

Caché local en memoria de proceso, tratada como **no persistente** y **descartable**.

### Regla

La caché nunca será fuente de verdad.
Solo almacén derivado.

---

## 4.6 Secrets Layer

### Recursos

* `Secrets`
* opcionalmente `Secrets Store`

### Función

Almacenar:

* `API tokens`
* credenciales
* claves privadas
* secretos de terceros
* credenciales de integración

Cloudflare documenta que los secretos se añaden mediante Dashboard o `wrangler secret put`, y que el valor no es visible después de definirse. ([Cloudflare Docs][3])

---

## 5. Topología de despliegue

## 5.1 Recursos mínimos

1. Un proyecto `Pages` para la aplicación web.
2. Un `Config API Worker`.
3. Una base `D1`.
4. Un conjunto de `Secrets`.
5. `Service Bindings` desde:

   * `Pages Functions` al `Config API Worker`;
   * otros `Workers` al `Config API Worker`, si se usa acceso indirecto.

## 5.2 Bindings requeridos

### En `Config API Worker`

* `D1` binding, por ejemplo `CONFIG_DB`
* `Secrets` requeridos
* opcionalmente `Workflow` binding

### En `Pages`

* `Service Binding` hacia `Config API Worker`
* opcionalmente `D1` binding si se decide lectura directa de bootstrap desde `Pages Functions`

Cloudflare documenta que los *bindings* en `Pages` pueden configurarse en Dashboard o en el archivo de configuración de Wrangler, y que para que el *binding* tenga efecto en `Pages` hay redeploy. ([Cloudflare Docs][4])

---

## 6. Modelo de datos

## 6.1 Tabla `config_entries`

Tabla principal de configuración.

| Campo         | Tipo lógico | Obligatorio | Descripción                                        |
| ------------- | ----------- | ----------: | -------------------------------------------------- |
| `id`          | integer     |          Sí | Identificador interno                              |
| `namespace`   | text        |          Sí | Dominio funcional de la clave                      |
| `key`         | text        |          Sí | Nombre único dentro del namespace                  |
| `value`       | text        |          Sí | Valor serializado                                  |
| `value_type`  | text        |          Sí | Tipo lógico: `string`, `number`, `boolean`, `json` |
| `is_public`   | integer     |          Sí | Indica si puede exponerse al cliente               |
| `is_editable` | integer     |          Sí | Indica si puede editarse desde la interfaz         |
| `status`      | text        |          Sí | `active`, `disabled`, `deleted_logical`            |
| `version`     | integer     |          Sí | Versión de la clave                                |
| `etag`        | text        |          No | Huella lógica opcional del valor                   |
| `description` | text        |          No | Descripción técnica                                |
| `updated_at`  | text        |          Sí | Fecha de actualización                             |
| `updated_by`  | text        |          Sí | Usuario o actor técnico que modifica               |

### Restricciones

* `UNIQUE(namespace, key)`
* `value_type` con valores limitados
* `status` con valores limitados
* `version >= 1`

---

## 6.2 Tabla `config_namespaces`

Tabla de control por dominio funcional.

| Campo                 | Tipo lógico | Obligatorio | Descripción                  |
| --------------------- | ----------- | ----------: | ---------------------------- |
| `namespace`           | text        |          Sí | Clave primaria del namespace |
| `description`         | text        |          No | Descripción funcional        |
| `is_public_bootstrap` | integer     |          Sí | Si participa en bootstrap    |
| `is_system`           | integer     |          Sí | Si es namespace reservado    |
| `updated_at`          | text        |          Sí | Última actualización         |

### Uso

Permite:

* agrupar claves;
* restringir edición;
* construir cargas de bootstrap;
* aplicar reglas de autorización.

---

## 6.3 Tabla `config_audit_log`

Tabla de auditoría.

| Campo        | Tipo lógico | Obligatorio | Descripción                                                         |
| ------------ | ----------- | ----------: | ------------------------------------------------------------------- |
| `id`         | integer     |          Sí | Identificador interno                                               |
| `event_type` | text        |          Sí | `create`, `update`, `disable`, `delete_logical`, `refresh`, `reset` |
| `namespace`  | text        |          No | Namespace afectado                                                  |
| `key`        | text        |          No | Clave afectada                                                      |
| `old_value`  | text        |          No | Valor anterior, si se permite conservarlo                           |
| `new_value`  | text        |          No | Valor nuevo                                                         |
| `changed_by` | text        |          Sí | Usuario o servicio                                                  |
| `request_id` | text        |          No | Correlación técnica                                                 |
| `created_at` | text        |          Sí | Fecha del evento                                                    |
| `result`     | text        |          Sí | `success`, `rejected`, `error`                                      |
| `error_code` | text        |          No | Código si falla                                                     |

### Regla de seguridad

No se registrarán secretos.
Para claves públicas editables, el registro del valor dependerá de la política de privacidad del proyecto.

---

## 6.4 Tabla `config_runtime_state`

Tabla de estado global para control de caché.

| Campo         | Tipo lógico | Obligatorio | Descripción            |
| ------------- | ----------- | ----------: | ---------------------- |
| `state_key`   | text        |          Sí | Clave del estado       |
| `state_value` | text        |          Sí | Valor del estado       |
| `version`     | integer     |          Sí | Versión del estado     |
| `updated_at`  | text        |          Sí | Fecha de actualización |

### Claves recomendadas

* `global_config_version`
* `public_bootstrap_version`
* `cache_reset_token`

### Función

Permite que los consumidores verifiquen si su caché ha quedado obsoleta sin tener que releer todo el catálogo.

---

## 7. Contratos de interfaz

## 7.1 Contrato interno de servicio

La capa canónica será un `ConfigService` con este contrato lógico:

### Métodos de lectura

* `getConfig(namespace, key)`
* `getMany(keys[])`
* `getNamespace(namespace)`
* `getPublicBootstrapConfig()`
* `getGlobalVersion()`

### Métodos de escritura

* `createConfig(input)`
* `updateConfig(input)`
* `disableConfig(namespace, key)`
* `deleteLogicalConfig(namespace, key)`
* `refreshCache(scope)`
* `resetCache(scope)`

### Métodos de soporte

* `validateConfigInput(input)`
* `authorizeConfigWrite(actor, scope)`
* `recordAudit(event)`
* `bumpVersion(scope)`

---

## 7.2 Contrato de repositorio

La capa de acceso a datos será un `ConfigRepository`.

### Métodos

* `findByKey(namespace, key)`
* `findByNamespace(namespace)`
* `findPublicBootstrap()`
* `insertEntry(entry)`
* `updateEntry(entry)`
* `disableEntry(namespace, key)`
* `insertAudit(event)`
* `readRuntimeState(stateKey)`
* `writeRuntimeState(stateKey, value)`
* `incrementRuntimeVersion(stateKey)`

### Requisito

Toda consulta SQL debe quedar encapsulada aquí.

`D1` expone un modelo de trabajo basado en enlazar la base, preparar la sentencia y ejecutarla; este patrón encaja directamente con una capa de repositorio centralizada. ([Cloudflare Docs][6])

---

## 7.3 Contrato HTTP interno

Si el `Config API Worker` expone interfaz HTTP interna, el contrato recomendado es el siguiente.

### Lectura

#### `GET /internal/config/:namespace/:key`

Devuelve una clave concreta.

**Respuesta de éxito:**

* `namespace`
* `key`
* `value`
* `valueType`
* `version`
* `cacheable`

#### `GET /internal/config/namespace/:namespace`

Devuelve todas las claves activas de un namespace.

#### `GET /internal/config/bootstrap`

Devuelve el conjunto mínimo público para bootstrap de la interfaz.

#### `GET /internal/config/version`

Devuelve:

* `globalConfigVersion`
* `publicBootstrapVersion`
* `cacheResetToken`

### Escritura

#### `POST /internal/config`

Crea una clave nueva.

#### `PUT /internal/config/:namespace/:key`

Actualiza una clave existente.

#### `POST /internal/config/:namespace/:key/disable`

Desactiva una clave.

#### `POST /internal/config/cache/refresh`

Solicita invalidación o refresh lógico.

#### `POST /internal/config/cache/reset`

Fuerza reinicialización de caché.

### Requisitos del contrato

* autenticación obligatoria;
* autorización por rol o policy;
* idempotencia razonable en operaciones repetibles;
* `request_id` para trazabilidad;
* errores tipados.

---

## 7.4 Contrato por `Service Bindings`

Cuando el acceso sea interno entre servicios, se recomienda exponer un `WorkerEntrypoint` con métodos públicos.

Cloudflare documenta que un Worker puede exponer métodos públicos a otros Workers extendiendo `WorkerEntrypoint` y consumiéndose mediante `Service Bindings`. ([Cloudflare Docs][7])

### Métodos públicos recomendados

* `getConfig(namespace, key)`
* `getNamespace(namespace)`
* `getBootstrapConfig()`
* `updateConfig(input)`
* `invalidateCache(scope)`

### Ventaja

Evita exponer endpoints HTTP públicos o semipúblicos para tráfico interno.

---

## 8. Flujos operativos

## 8.1 Flujo de lectura de bootstrap

### Caso de uso

La interfaz necesita datos visibles desde el primer render, por ejemplo:

* `favicon path`
* `brand title`
* `theme tokens`
* *feature flags* públicas

### Flujo

1. El navegador solicita la carga inicial.
2. `Pages Function` recibe la petición.
3. `Pages Function` llama a `Config API` por `Service Binding` o consulta el bootstrap en `D1`.
4. El servicio comprueba versión de caché.
5. Si la caché local es válida, responde desde caché.
6. Si no es válida, lee desde `D1`, actualiza caché y responde.
7. La interfaz se renderiza con los valores de bootstrap.

`Pages Functions` puede usar `Service Bindings` para llamar a un Worker y también puede enlazar `D1` directamente. ([Cloudflare Docs][4])

---

## 8.2 Flujo de lectura directa por un Worker

### Caso de uso

Un Worker necesita una clave concreta, por ejemplo una ruta, una bandera o un parámetro funcional.

### Flujo

1. El Worker recibe una petición.
2. Consulta su caché local.
3. Si no existe entrada válida, consulta:

   * `getGlobalVersion()`;
   * o directamente `getConfig(namespace, key)`.
4. Si hay desalineación de versión, relee desde `D1`.
5. Usa el valor y continúa la lógica de negocio.

---

## 8.3 Flujo de edición desde la interfaz de usuario

### Caso de uso

Un usuario autorizado modifica una clave editable.

### Flujo

1. El usuario envía una petición desde Admin UI.
2. La aplicación autentica al usuario.
3. `Pages Function` o backend llama a `Config API`.
4. `Config API` valida:

   * permisos;
   * namespace;
   * esquema;
   * tipo;
   * si la clave es editable.
5. `Config API` abre operación de escritura en `D1`.
6. Actualiza `config_entries`.
7. Inserta evento en `config_audit_log`.
8. Incrementa:

   * `global_config_version`;
   * y, si procede, `public_bootstrap_version`.
9. Devuelve confirmación.
10. Los consumidores detectan nueva versión y refrescan su caché en la siguiente comprobación, o se ejecuta un reset explícito.

---

## 8.4 Flujo de refresh

### Caso de uso

El usuario o un proceso operativo quiere acelerar la convergencia de caché.

### Flujo

1. Admin UI invoca `refreshCache(scope)` o `resetCache(scope)`.
2. `Config API` incrementa `cache_reset_token` o una versión específica.
3. Los consumidores comparan su token local con el token global.
4. Si difiere, invalidan caché local y releen.

### Observación

No se asume propagación activa ni señal push entre servicios.
La convergencia se diseña como **pull on next check** (consulta en la siguiente verificación).

---

## 8.5 Flujo de Workflows

### Caso de uso

Un flujo de trabajo necesita leer configuración.

### Flujo recomendado

1. El Workflow recibe evento o arranca por trigger.
2. Dentro del paso, lee configuración:

   * vía `this.env` con acceso a *bindings*;
   * o llamando al `Config API Worker`.
3. Las lecturas y escrituras asociadas a pasos deben ser idempotentes.

Cloudflare documenta que dentro de un Workflow puede accederse a *bindings* como `D1` mediante `this.env`, y que las llamadas a API o *bindings* dentro de pasos deben diseñarse como idempotentes porque un paso puede reintentarse. ([Cloudflare Docs][8])

---

## 9. Estrategia de caché

## 9.1 Objetivo

Reducir latencia y presión sobre `D1` sin perder control de consistencia.

## 9.2 Tipos de caché

### Nivel 1: Process Local Cache (Caché local de proceso)

Caché en memoria del proceso del consumidor.

**Uso:**

* claves leídas con frecuencia;
* bootstrap;
* parámetros de personalización;
* *feature flags* públicas.

**Ventajas:**

* latencia mínima;
* simplicidad;
* sin dependencia externa adicional.

**Limitaciones:**

* no persistente;
* no compartida entre instancias;
* debe tratarse como descartable.

### Nivel 2: No cache

Lectura directa de `D1`.

**Uso:**

* claves críticas que cambian con frecuencia;
* operaciones administrativas;
* comprobaciones de consistencia.

## 9.3 Clave de coherencia

La coherencia se controlará por versión, no por tiempo únicamente.

### Mecanismo

Cada consumidor mantiene:

* `localGlobalVersion`
* `localBootstrapVersion`
* `localCacheResetToken`

Antes de usar ciertas entradas, compara con:

* `global_config_version`
* `public_bootstrap_version`
* `cache_reset_token`

Si hay diferencia, invalida y recarga.

## 9.4 Políticas de caché

### Política `strict`

* Siempre comprueba versión antes de usar valor.
* Más consistente.
* Mayor coste de lectura.

### Política `balanced`

* Usa `time to live` (tiempo de vida) corto y comprueba versión al expirar.
* Recomendación general.

### Política `aggressive`

* Reutiliza caché mientras no se fuerce reset.
* Solo recomendable para claves visuales o de baja criticidad.

## 9.5 Recomendación operativa

Usar:

* `strict` para valores que alteran lógica crítica;
* `balanced` para bootstrap y configuración general;
* `aggressive` solo para presentación visual no crítica.

## 9.6 Invalidación

La invalidación soportará:

* por clave;
* por namespace;
* global;
* específica de bootstrap.

### Mecanismos

1. Incremento de versión global.
2. Incremento de versión de bootstrap.
3. Incremento de `cache_reset_token`.
4. Invalidación selectiva en memoria local.

---

## 10. Seguridad y control de acceso

## 10.1 Reglas de seguridad

1. Ningún secreto se almacena en `D1`.
2. Ningún secreto se devuelve a Admin UI.
3. Ninguna clave no editable puede alterarse desde la interfaz.
4. Ninguna clave reservada de sistema puede alterarse sin canal técnico.

Cloudflare documenta que `Secrets` deben usarse para información sensible y que su valor no queda visible tras la definición. ([Cloudflare Docs][9])

## 10.2 Roles recomendados

### `platform_admin`

* define namespaces;
* ejecuta migraciones;
* siembra configuración inicial;
* configura *bindings* y secretos.

### `app_admin`

* crea y edita claves permitidas;
* fuerza refresh;
* revisa auditoría.

### `read_only_admin`

* consulta estado y auditoría;
* no modifica.

### `runtime_service`

* solo lectura;
* escritura prohibida salvo casos de sistema explícitos.

## 10.3 Ámbitos de autorización

La autorización debe poder aplicarse por:

* namespace;
* operación;
* tipo de clave;
* visibilidad (`public` frente a `internal`);
* capacidad de refresh global.

---

## 11. Observabilidad y auditoría

## 11.1 Logging

Registrar:

* lecturas fallidas;
* escrituras aceptadas;
* escrituras rechazadas;
* invalidaciones;
* resets;
* discrepancias de versión;
* errores SQL;
* errores de autorización.

## 11.2 Trazabilidad

Toda operación de escritura debe incluir:

* `request_id`
* actor
* recurso afectado
* resultado
* marca temporal

## 11.3 Auditoría

La tabla `config_audit_log` será obligatoria.

### Recomendación

Conservar siempre:

* `event_type`
* `changed_by`
* `created_at`
* `result`

Conservar `old_value` y `new_value` dependerá del nivel de sensibilidad de la clave.

---

## 12. Provisión, migraciones y operación

## 12.1 Provisión inicial

Secuencia recomendada:

1. Crear `D1` con `wrangler d1 create`.
2. Declarar el *binding* en el archivo de configuración de Wrangler.
3. Crear migraciones con `wrangler d1 migrations create`.
4. Aplicar migraciones con `wrangler d1 migrations apply`.
5. Cargar configuración inicial.
6. Definir secretos con `wrangler secret put`.
7. Desplegar `Config API Worker`.
8. Configurar `Service Bindings`.
9. Desplegar `Pages`.

Cloudflare documenta `wrangler d1 create`, `d1 migrations apply` y `wrangler secret put` como comandos oficiales de operación. ([Cloudflare Docs][10])

## 12.2 Siembra de datos

La siembra inicial debe ejecutarse como operación técnica controlada, no desde la interfaz de usuario.

### Tipos de datos de siembra

* namespaces iniciales;
* claves públicas de bootstrap;
* valores por defecto;
* marcas de versión iniciales.

## 12.3 Rotación de secretos

Debe hacerse por el canal de secretos de Cloudflare, no por `D1`.

---

## 13. Estrategia de implementación

## 13.1 Fase 1

Implementación mínima viable:

* `D1`
* tabla `config_entries`
* tabla `config_runtime_state`
* `Config API Worker`
* lectura por clave
* actualización por clave
* bootstrap público
* caché local simple con versión global

## 13.2 Fase 2

Refuerzo funcional:

* `config_audit_log`
* namespaces
* autorización por ámbito
* invalidación por namespace
* reset global
* `Service Bindings` para todos los consumidores

## 13.3 Fase 3

Madurez operativa:

* validación avanzada por esquema
* edición masiva controlada
* versionado lógico más fino
* integración con `Workflows`
* panel de auditoría

---

## 14. Decisiones de diseño

## 14.1 Decisiones aprobadas

1. `D1` es la fuente única de verdad de configuración editable no sensible.
2. `Config API Worker` será el punto canónico de escritura.
3. `Service Bindings` será el canal interno preferido entre servicios.
4. `Secrets` se usa para datos sensibles.
5. La caché será local de proceso y controlada por versión.

## 14.2 Decisiones explícitamente rechazadas

1. Usar `Environment Variables` como almacén principal de configuración editable.
2. Guardar secretos en `D1`.
3. Permitir edición directa en `D1` desde la interfaz de usuario.
4. Basar la consistencia en redeploy.
5. Distribuir lógica SQL de configuración por todos los servicios.

Cloudflare documenta que variables de entorno y secretos forman parte del modelo de *bindings* del servicio, no de un almacén de configuración compartido mutable entre recursos. ([Cloudflare Docs][2])

---

## 15. Riesgos técnicos y mitigaciones

## 15.1 Riesgo: sobrelectura de `D1`

**Riesgo:** demasiadas lecturas repetidas para claves muy consultadas.
**Mitigación:** caché local por versión.

## 15.2 Riesgo: caché obsoleta

**Riesgo:** un servicio usa valores antiguos durante una ventana corta.
**Mitigación:** control por versión, `cache_reset_token` y refresh manual.

## 15.3 Riesgo: mezcla de clases de dato

**Riesgo:** un desarrollador intenta guardar una credencial en `D1`.
**Mitigación:** validación de tipo de clave, namespaces restringidos y reglas de revisión.

## 15.4 Riesgo: lógica duplicada

**Riesgo:** varios servicios implementan consultas y validaciones distintas.
**Mitigación:** centralización en `Config API Worker` y `ConfigRepository`.

## 15.5 Riesgo: operaciones no idempotentes en Workflows

**Riesgo:** reintentos duplican efectos.
**Mitigación:** en Workflows, hacer que las operaciones de lectura y actualización de estado estén protegidas por comprobaciones idempotentes. Cloudflare recomienda diseñar las llamadas a API o *bindings* dentro de pasos como idempotentes. ([Cloudflare Docs][11])

---

## 16. Criterios de aceptación de arquitectura

La arquitectura se considerará correctamente implantada cuando se cumpla todo lo siguiente:

1. Una clave editable no sensible puede cambiarse desde Admin UI sin redeploy.
2. El valor actualizado queda persistido en `D1`.
3. `Pages Functions` puede leer ese valor en tiempo de ejecución.
4. Un `Worker` puede leer ese valor en tiempo de ejecución.
5. Un consumidor con caché detecta cambio de versión y refresca.
6. Un secreto sigue fuera de `D1` y fuera de la interfaz.
7. La lógica de escritura solo existe en `Config API`.
8. Los cambios quedan auditados.
9. El bootstrap público puede resolverse en la carga inicial de la aplicación.
10. Los `Service Bindings` internos permiten desacoplar consumidores del acceso directo, si se adopta ese modo.

---

## 17. Resumen técnico final

La arquitectura propuesta se basa en un patrón de **centralized runtime configuration** (configuración centralizada en tiempo de ejecución):

* `D1` guarda toda la configuración editable no sensible;
* `Config API Worker` actúa como capa canónica de dominio;
* `Pages` y otros `Workers` consumen configuración mediante `Service Bindings` o acceso controlado;
* `Secrets` queda reservado para datos sensibles;
* la consistencia se resuelve con una combinación de versión global, versión de bootstrap, `cache_reset_token` y caché local descartable.

La base técnica encaja con el modelo oficial de Cloudflare: `D1` se enlaza a `Workers` y `Pages Functions`, `Service Bindings` permite comunicación interna entre servicios, y `Workflows` puede acceder a *bindings* mediante `this.env`, siempre teniendo en cuenta la idempotencia de sus pasos. ([Cloudflare Docs][12])

---

[1]: https://developers.cloudflare.com/d1/?utm_source=chatgpt.com "Overview · Cloudflare D1 docs"
[2]: https://developers.cloudflare.com/workers/runtime-apis/bindings/?utm_source=chatgpt.com "Bindings (env) - Workers"
[3]: https://developers.cloudflare.com/workers/configuration/secrets/?utm_source=chatgpt.com "Secrets · Cloudflare Workers docs"
[4]: https://developers.cloudflare.com/pages/functions/bindings/ "Bindings · Cloudflare Pages docs"
[5]: https://developers.cloudflare.com/workers/runtime-apis/bindings/service-bindings/ "Service bindings - Runtime APIs · Cloudflare Workers docs"
[6]: https://developers.cloudflare.com/d1/worker-api/ "Workers Binding API · Cloudflare D1 docs"
[7]: https://developers.cloudflare.com/workers/runtime-apis/bindings/service-bindings/rpc/ "Service bindings - RPC (WorkerEntrypoint) · Cloudflare Workers docs"
[8]: https://developers.cloudflare.com/workflows/get-started/guide/?utm_source=chatgpt.com "Build your first Workflow"
[9]: https://developers.cloudflare.com/workers/configuration/secrets/ "Secrets · Cloudflare Workers docs"
[10]: https://developers.cloudflare.com/d1/get-started/?utm_source=chatgpt.com "Getting started · Cloudflare D1 docs"
[11]: https://developers.cloudflare.com/workflows/build/rules-of-workflows/ "Rules of Workflows · Cloudflare Workflows docs"
[12]: https://developers.cloudflare.com/d1/worker-api/d1-database/ "D1 Database · Cloudflare D1 docs"
