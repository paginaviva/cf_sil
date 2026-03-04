# Inventario de Recursos Cloudflare y CI

Tabla exclusiva de inventario operativo para este proyecto. Fuente de verdad para nombres, bindings, secrets y configuraciones relacionadas con despliegue Cloudflare.

## Vocabulario de estado permitido

Valores válidos para la columna `Estado`:
1. `pending`
2. `in_progress`
3. `resolved`
4. `blocked`

| ID | Categoria | Tipo | Nombre recurso/clave | Binding/Variable | Valor o referencia | Estado | Propietario | Ultima validacion | Notas |
|---|---|---|---|---|---|---|---|---|---|
| CF-SEC-001 | CI | GitHub Secret | `CF_ACCOUNT_ID` | `CLOUDFLARE_ACCOUNT_ID` | Secret de GitHub Actions (valor no versionado) | resolved | Usuario | 2026-03-04 | Metodo de resolucion: secret explicito |
| CF-SEC-002 | CI | GitHub Secret | `CF_API_TOKEN` | `CLOUDFLARE_API_TOKEN` | Secret de GitHub Actions (valor no versionado) | resolved | Usuario | 2026-03-04 | Scopes minimos: Workers/Pages/D1/KV/R2/Queues segun recursos activos |
| CF-D1-001 | Cloudflare | D1 Database | `db_endes` | `DB_ENDES` | `database_id`: pendiente (se obtiene al crear en Cloudflare) | pending | AGTO | 2026-03-04 | Recurso inicial solicitado por usuario |
| CF-BND-001 | App Contract | Binding Convencion | D1 principal | `DB_ENDES` | Binding estandar para D1 `db_endes` | resolved | AGTO | 2026-03-04 | Listo para usar en `wrangler.toml` cuando se implemente |
| CF-BND-002 | App Contract | Binding Convencion | KV cache | `CACHE` | Namespace KV: pendiente de nombre final | pending | AGTO | 2026-03-04 | Sin nombre de namespace confirmado (G1) |
| CF-BND-003 | App Contract | Binding Convencion | R2 storage | `BUCKET` | Bucket R2: pendiente de nombre final | pending | AGTO | 2026-03-04 | Sin nombre de bucket confirmado (G1) |
| CF-BND-004 | App Contract | Binding Convencion | Queue principal | `QUEUE` | Queue: pendiente de nombre final | pending | AGTO | 2026-03-04 | Sin nombre de queue confirmado (G1) |
| CF-CORS-001 | Seguridad | CORS Policy | Origenes permitidos | `ALLOWED_ORIGINS` | Variable de entorno (lista CSV, sin hardcoding) | pending | AGTO | 2026-03-04 | Requiere dominios concretos para quedar en resolved |
| CF-CI-001 | CI/CD | Workflow Reusable | `cloudflare_reusable.yml` | `workflow_call` | Pipeline base Worker/Pages/Infra con `cloudflare/wrangler-action@v3` | resolved | AGTO | 2026-03-04 | Validaciones técnicas de ejecución |
| CF-CI-002 | CI/CD | Workflow Guard (Legacy) | `cloudflare_policy_guard.yml` | `workflow_call` | Guard anterior, reemplazado por Gatekeeper | blocked | AGTO | 2026-03-04 | Se conserva como legado, no debe ser gate primario |
| CF-CI-003 | CI/CD | Workflow Quality | `quality_baseline.yml` | `workflow_call` | Validación YAML + gobernanza + comandos opcionales | resolved | AGTO | 2026-03-04 | Base de cumplimiento G5 |
| CF-CI-004 | CI/CD | Wrapper Workflow | `deploy_worker.yml` | `workflow_call` | Wrapper para despliegue Worker | resolved | AGTO | 2026-03-04 | Encadena Quality -> Gatekeeper -> Deploy |
| CF-CI-005 | CI/CD | Wrapper Workflow | `deploy_pages.yml` | `workflow_call` | Wrapper para despliegue Pages | resolved | AGTO | 2026-03-04 | Encadena Quality -> Gatekeeper -> Deploy |
| CF-CI-006 | CI/CD | Wrapper Workflow | `infra_cloudflare.yml` | `workflow_call` | Wrapper para operaciones infra (D1 inicial) | resolved | AGTO | 2026-03-04 | Encadena Quality -> Gatekeeper -> Infra |
| CF-CI-007 | CI/CD | Workflow Gatekeeper | `predeploy_gatekeeper.yml` | `workflow_call` | Evaluación predespliegue con política ejecutable | resolved | AGTO | 2026-03-04 | Reemplaza guard para bloqueo efectivo |
| CF-CI-008 | CI/CD | Política Ejecutable | `predeploy_policy.yml` | `policy` | Reglas A1-A10, estados, excepciones y trazabilidad | resolved | AGTO | 2026-03-04 | Sin dependencia runtime de INSTRUCCION_PRE_DESPLIEGUE |
| CF-CI-009 | CI/CD | Especificación de Agente | `.github/agents/predeploy-gatekeeper.md` | `agent-spec` | Contrato de agente especializado | resolved | AGTO | 2026-03-04 | Coordinado por AGTO |
| CF-CI-010 | CI/CD | Registro Auditoría | `doc_referencia/predeploy_audit_log.md` | `audit-log` | Registro de decisiones de gatekeeper | resolved | AGTO | 2026-03-04 | Activo para trazabilidad de validaciones |

## Registro de decisiones operativas

| ID | Decision | Valor | Estado | Fecha |
|---|---|---|---|---|
| CF-DEC-001 | Triggers GitHub (ramas, `workflow_dispatch`, aprobacion manual infra) | Sin cambios por el momento | pending | 2026-03-04 |
| CF-DEC-002 | Allowlist comandos infra CI | Se incorpora incrementalmente segun desarrollo | pending | 2026-03-04 |
| CF-DEC-003 | Formato identificador de commit (G8) | `20260304 1117: Incorporar wrangler al proyecto` | resolved | 2026-03-04 |
| CF-DEC-004 | Arquitectura pipelines | Reusable + wrappers + quality + gatekeeper | resolved | 2026-03-04 |
| CF-DEC-005 | Politica CORS CI | Worker/Pages requiere CORS resuelto en inventario | resolved | 2026-03-04 |
| CF-DEC-006 | Aprobación A1-A10 | Ajustes documentales y técnicos aprobados por usuario | resolved | 2026-03-04 |
| CF-DEC-007 | Retiro de INSTRUCCION_PRE_DESPLIEGUE | Eliminado tras validar paridad funcional con Gatekeeper | resolved | 2026-03-04 |
