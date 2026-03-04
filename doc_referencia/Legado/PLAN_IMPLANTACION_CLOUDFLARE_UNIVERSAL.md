# Plan de Implantación Cloudflare Universal (Workers, Pages, D1, KV, R2, Queues) para `/workspaces/cf_sil`

## Resumen
Este plan adapta de forma directa el patrón de `wrangler-action` para que el repositorio despliegue de manera estándar cualquier componente Cloudflare (Workers/Pages) y también operaciones de recursos (D1/KV/R2/Queues), aplicando estrictamente G1-G8 como gobernanza transversal.

Decisiones ya fijadas contigo:
1. Base técnica: `cloudflare/wrangler-action@v3` + wrappers internos reutilizables.
2. Topología CI/CD: un workflow reusable único parametrizable.
3. Entornos: un único entorno.

Estado de ejecución documental (2026-03-04):
1. Plan persistido en `doc_referencia/PLAN_IMPLANTACION_CLOUDFLARE_UNIVERSAL.md`.
2. Inventario exclusivo de recursos creado en `.github/inventario_recursos.md`.
3. Requisitos de usuario incorporados en inventario (secrets, D1, bindings y CORS).
4. Fases 2 a 6 implementadas en `.github/workflows/` y documentadas en `doc_referencia/BITACORA_EJECUCION_FASES_2_A_6.md`.

## Cambios importantes en interfaces públicas (workflows/contratos)
Se estandarizará una interfaz única por `workflow_call` en `.github/workflows/cloudflare_reusable.yml`:

1. Inputs:
   - `target_type`: `worker | pages | infra`.
   - `command`: comando wrangler a ejecutar.
   - `working_directory`: ruta relativa del proyecto objetivo.
   - `environment`: valor de entorno lógico (en este caso único entorno, pero mantenido por compatibilidad futura).
   - `wrangler_version`: versión fijada de Wrangler.
   - `package_manager`: `npm | pnpm | yarn | bun` (opcional).
   - `pre_commands`: comandos opcionales previos.
   - `post_commands`: comandos opcionales posteriores.
   - `secrets_list`: nombres de secretos Worker a subir (multilínea).
   - `vars_list`: nombres de variables Worker a subir (multilínea).

2. Secrets requeridos por workflow:
   - `CLOUDFLARE_API_TOKEN`.
   - `CLOUDFLARE_ACCOUNT_ID`.
   - `GITHUB_TOKEN` (opcional para deployment metadata/summaries).

3. Outputs estandarizados:
   - `command-output`.
   - `command-stderr`.
   - `deployment-url`.
   - `pages-deployment-alias-url`.
   - `pages-deployment-id`.
   - `pages-environment`.

## Alcance
Incluido:
1. Despliegues Workers y Pages.
2. Operaciones de D1/KV/R2/Queues vía `wrangler` dentro del mismo marco reusable.
3. Inventario de recursos como fuente de verdad operativa.
4. Convenciones de seguridad, naming y validación según G1-G8.

Fuera de alcance inicial:
1. Provisionamiento automático de recursos sin validación explícita de nombres por usuario.
2. Multi-entorno (se deja diseñado para extenderse después).

## Requerimientos del usuario (imprescindibles antes de implementar)
1. `account_id` gestionado por GitHub Secret: `CF_ACCOUNT_ID`.
2. API Token gestionado por GitHub Secret: `CF_API_TOKEN` (scopes mínimos según recursos activos).
3. Recurso inicial confirmado para creación: D1 DB `db_endes` (ID pendiente hasta ejecución real en Cloudflare).
4. Bindings base definidos para estandarización:
   - D1: `DB_ENDES`
   - KV: `CACHE` (pendiente de namespace)
   - R2: `BUCKET` (pendiente de bucket)
   - Queue: `QUEUE` (pendiente de queue)
5. Definir política de triggers GitHub:
   - ramas que despliegan.
   - si habrá `workflow_dispatch`.
   - si hay aprobación manual para operaciones de infraestructura.
   - Estado actual: pendiente por decisión de usuario (sin cambios por ahora).
6. Definir estrategia de comandos infra permitidos en CI (allowlist), por ejemplo:
   - `d1 migrations apply`
   - `kv:key put`
   - `r2 object put`
   - `queues create/consumer`.
   - Estado actual: incremental durante el desarrollo.
7. Identificador de commit requerido por G8: `20260304 1117: Incorporar wrangler al proyecto`.
8. CORS: política base por variable de entorno `ALLOWED_ORIGINS` (sin hardcoding de dominios).

## Plan de implementación (decision-complete)

### Fase 1: Gobernanza y baseline documental
1. Crear documento operativo central de despliegue Cloudflare en `doc_referencia/`.
2. Crear inventario de recursos (tabla abajo) y declararlo fuente de verdad para nombres y bindings (G1).
3. Definir checklist de validación G1-G8 para PRs y despliegues.
4. Definir política “cero hardcoding” para URLs, IDs y credenciales (G2-G3).

### Fase 2: Workflow reusable único
1. Implementar `cloudflare_reusable.yml` con `workflow_call` e inputs/outputs arriba definidos.
2. Integrar `cloudflare/wrangler-action@v3`.
3. Encadenar ejecución:
   - setup/auth.
   - pre-commands.
   - upload secrets/vars.
   - comando principal wrangler.
   - post-commands.
4. Publicar outputs de despliegue para consumo en jobs posteriores.

### Fase 3: Wrappers de uso estándar
1. Crear wrapper `deploy_worker.yml` que llame al reusable con `target_type=worker`.
2. Crear wrapper `deploy_pages.yml` que llame al reusable con `target_type=pages`.
3. Crear wrapper `infra_cloudflare.yml` para operaciones D1/KV/R2/Queues con `target_type=infra`.
4. Añadir validaciones de seguridad:
   - bloquear comandos no permitidos en `infra`.
   - exigir referencia a recurso presente en inventario para comandos destructivos.

### Fase 4: Seguridad y cumplimiento
1. Forzar uso de GitHub Secrets para token/account (G3).
2. Prohibir valores hardcodeados de configuración sensible (G2).
3. Definir convención de variables de entorno y bindings por tipo de despliegue.
4. Añadir validación previa de ambigüedades:
   - si falta nombre de recurso o binding en inventario, fallar con mensaje claro (G1).

### Fase 5: Calidad y validación técnica
1. Ejecutar lint/typecheck/test del proyecto objetivo antes de desplegar (G5).
2. Añadir smoke checks post-deploy:
   - Workers: URL responde 2xx.
   - Pages: URL/alias publicado.
   - D1/KV/R2/Queues: comando de verificación no destructivo.
3. Publicar resumen de resultado con outputs relevantes.

### Fase 6: Operación y evolución
1. Registrar cada nuevo recurso en inventario al momento de incorporarlo.
2. Mantener changelog operativo de pipeline.
3. Mantener formato de commit con identificador y descripción detallada (G8).

## Tabla de inventario de recursos (a completar progresivamente)

| ID | Tipo | Nombre Cloudflare | Binding/Variable | Uso (Worker/Pages/Job) | Cuenta/Proyecto | Entorno | Estado | Fuente de verificación | Responsable | Última validación (YYYY-MM-DD) | Notas |
|---|---|---|---|---|---|---|---|---|---|---|---|
| CF-001 | Worker |  |  |  |  | único | pendiente |  |  |  |  |
| CF-002 | Pages Project |  |  |  |  | único | pendiente |  |  |  |  |
| CF-003 | D1 |  |  |  |  | único | pendiente |  |  |  |  |
| CF-004 | KV Namespace |  |  |  |  | único | pendiente |  |  |  |  |
| CF-005 | R2 Bucket |  |  |  |  | único | pendiente |  |  |  |  |
| CF-006 | Queue |  |  |  |  | único | pendiente |  |  |  |  |

## Casos de prueba y escenarios de aceptación
1. Deploy Worker exitoso con `command: deploy` y salida `deployment-url` no vacía.
2. Deploy Pages exitoso con `command: pages deploy ...` y alias disponible si aplica.
3. Carga de secrets falla correctamente si falta variable de entorno declarada.
4. Operación D1 (migración) falla si el recurso no está en inventario.
5. Operación KV/R2/Queues rechazada si comando no está en allowlist.
6. Pipeline falla si faltan secrets obligatorios.
7. Pipeline falla si `working_directory` no existe.
8. Pipeline muestra outputs y resumen de ejecución.

## Criterios de aceptación del plan
1. Un único workflow reusable cubre Worker/Pages/infra.
2. No hay hardcoding de datos sensibles ni IDs.
3. Todos los recursos usados por CI están inventariados.
4. Los despliegues y operaciones dejan trazabilidad clara en logs y outputs.
5. Se cumple checklist G1-G8 en PR y en ejecución.

## Supuestos y defaults explícitos
1. Se adopta `cloudflare/wrangler-action@v3` como base oficial.
2. Se opera inicialmente con un solo entorno.
3. No se crea infraestructura automáticamente sin datos validados por usuario.
4. Cualquier nombre ambiguo de recurso se bloquea hasta validación explícita (G1).
5. La expansión futura a `dev/stg/prod` se hace sin romper la interfaz del reusable.
6. La fuente de verdad de inventario operativo es `.github/inventario_recursos.md`.
