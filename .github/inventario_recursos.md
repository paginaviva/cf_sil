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
| CF-D1-001 | Cloudflare | D1 Database | `db_endes` | `DB_ENDES` | `database_id`: `a964b55b-6a50-47cc-87bf-42645b6cb0a3` | resolved | AGTO | 2026-03-04 | Creada via wrangler-action@v3; region WNAM; run #22669307529 |
| CF-BND-001 | App Contract | Binding Convencion | D1 principal | `DB_ENDES` | Binding estandar para D1 `db_endes` | resolved | AGTO | 2026-03-04 | Listo para usar en `wrangler.toml` cuando se implemente |
| CF-BND-002 | App Contract | Binding Convencion | KV cache | `CACHE` | Namespace KV: pendiente de nombre final | pending | AGTO | 2026-03-04 | Sin nombre de namespace confirmado (G1) |
| CF-BND-003 | App Contract | Binding Convencion | R2 storage | `BUCKET` | Bucket R2: pendiente de nombre final | pending | AGTO | 2026-03-04 | Sin nombre de bucket confirmado (G1) |
| CF-BND-004 | App Contract | Binding Convencion | Queue principal | `QUEUE` | Queue: pendiente de nombre final | pending | AGTO | 2026-03-04 | Sin nombre de queue confirmado (G1) |
| CF-CORS-001 | Seguridad | CORS Policy | Origenes permitidos | `ALLOWED_ORIGINS` | `https://cb-consulting.pages.dev` (produccion); `https://cb-consulting.pages.dev,http://localhost:3000` (preview). Sin dominio personalizado aun (CF-DEC-012) | resolved | AGTO | 2026-03-04 | Definido en `frontend/wrangler.toml` y `frontend/src/_headers`. Ampliar cuando se registre dominio personalizado |
| CF-CI-001 | CI/CD | Workflow Reusable | `cloudflare_reusable.yml` | `workflow_call` | Pipeline base Worker/Pages/Infra con `cloudflare/wrangler-action@v3` | blocked | AGTO | 2026-03-04 | Movido a `doc_referencia/Legado/workflows_reusables/`. Ya no existe en `.github/workflows/` |
| CF-CI-002 | CI/CD | Workflow Guard (Legacy) | `cloudflare_policy_guard.yml` | `workflow_call` | Guard anterior, reemplazado por Gatekeeper | blocked | AGTO | 2026-03-04 | Se conserva como legado, no debe ser gate primario |
| CF-CI-003 | CI/CD | Workflow Quality | `quality_baseline.yml` | `workflow_call` | Validación YAML + gobernanza + comandos opcionales | resolved | AGTO | 2026-03-04 | Base de cumplimiento G5 |
| CF-CI-004 | CI/CD | Wrapper Workflow | `deploy_worker.yml` | `workflow_call` | Wrapper para despliegue Worker | blocked | AGTO | 2026-03-04 | Movido a `doc_referencia/Legado/workflows_reusables/`. Ya no existe en `.github/workflows/` |
| CF-CI-005 | CI/CD | Wrapper Workflow | `deploy_pages.yml` | `workflow_call` | Wrapper para despliegue Pages | blocked | AGTO | 2026-03-04 | Movido a `doc_referencia/Legado/workflows_reusables/`. Ya no existe en `.github/workflows/` |
| CF-CI-006 | CI/CD | Wrapper Workflow | `infra_cloudflare.yml` | `workflow_call` | Wrapper para operaciones infra (D1 inicial) | blocked | AGTO | 2026-03-04 | Movido a `doc_referencia/Legado/workflows_reusables/`. Ya no existe en `.github/workflows/` |
| CF-CI-007 | CI/CD | Workflow Gatekeeper | `predeploy_gatekeeper.yml` | `workflow_call` | Evaluación predespliegue con política ejecutable | resolved | AGTO | 2026-03-04 | Reemplaza guard para bloqueo efectivo |
| CF-CI-008 | CI/CD | Política Ejecutable | `predeploy_policy.yml` | `policy` | Reglas A1-A10, estados, excepciones y trazabilidad | resolved | AGTO | 2026-03-04 | Sin dependencia runtime de INSTRUCCION_PRE_DESPLIEGUE |
| CF-CI-009 | CI/CD | Especificación de Agente | `.github/agents/predeploy-gatekeeper.md` | `agent-spec` | Contrato de agente especializado | resolved | AGTO | 2026-03-04 | Coordinado por AGTO |
| CF-CI-010 | CI/CD | Registro Auditoría | `doc_referencia/predeploy_audit_log.md` | `audit-log` | Registro de decisiones de gatekeeper | resolved | AGTO | 2026-03-04 | Activo para trazabilidad de validaciones |
| CF-CI-011 | CI/CD | Workflow Entry Point | `ci-deploy-frontend.yml` | `push:main` | Trigger real para despliegue CF Pages frontend. Cadena: quality_baseline (reusable) → predeploy_gatekeeper (reusable) → deploy (job plano, wrangler-action@v3 directo) | resolved | AGTO | 2026-03-04 | Activa en push a main cuando cambia `frontend/**`. Arquitectura plana desde commit deb24c8 |
| CF-FE-001 | Frontend | CF Pages Env Var | `IMG-LOGO-SITE` | `IMG_LOGO_SITE` | `https://srrhhmx.s-ul.eu/CRpEAFzD` | resolved | Usuario | 2026-03-04 | URL logo principal. Inyectado via webpack DefinePlugin en build. Fallback: logo SVG local |
| CF-FE-002 | Frontend | CF Pages Env Var | `IMG-FAVICON-SITE` | `IMG_FAVICON_SITE` | `https://srrhhmx.s-ul.eu/lFYRQHEz` | resolved | Usuario | 2026-03-04 | URL favicon. Inyectado via webpack DefinePlugin. Establecido en `<head>` por JS al cargar |
| CF-FE-003 | Frontend | CF Pages Env Var | `SITE-NAME` | `SITE_NAME` | `C&B Consulting` | resolved | Usuario | 2026-03-04 | Nombre del sitio. Inyectado via webpack DefinePlugin. Aplica a `document.title` |
| CF-FE-004 | Frontend | Directorio | `frontend/` | n/a | Capa UI del proyecto. TailAdmin Free v2.0.1 adaptado. Build: `npm run build` → `frontend/build/` | resolved | AGTO | 2026-03-04 | Node.js build env: ver CF-DEC-009 |
| CF-FE-005 | Frontend | Seguridad | `swiper` npm package | n/a | CVE: Prototype pollution en swiper ^11.1.14 (frontend only) | in_progress | AGTO | 2026-03-04 | Riesgo bajo en dashboard UI. Resolver al actualizar swiper cuando parche disponible |
| CF-FE-006 | Frontend | CF Pages Project | Nombre del proyecto CF Pages | `PAGES_PROJECT_NAME` | `cb-consulting` | resolved | Usuario | 2026-03-04 | Confirmado por usuario. Dominio: cb-consulting.pages.dev. Dominio personalizado: pendiente (CF-DEC-012) |

## Registro de decisiones operativas

| ID | Decision | Valor | Estado | Fecha |
|---|---|---|---|---|
| CF-DEC-001 | Triggers GitHub (ramas, `workflow_dispatch`, aprobacion manual infra) | `ci-deploy-frontend.yml`: push main + workflow_dispatch. Infra workflows: workflow_dispatch manual. | resolved | 2026-03-04 |
| CF-DEC-002 | Allowlist comandos infra CI | Se incorpora incrementalmente segun desarrollo | pending | 2026-03-04 |
| CF-DEC-003 | Formato identificador de commit (G8) | `20260304 1117: Incorporar wrangler al proyecto` | resolved | 2026-03-04 |
| CF-DEC-004 | Arquitectura pipelines | `quality_baseline.yml` (reusable) + `predeploy_gatekeeper.yml` (reusable) + deploy plano (job directo con wrangler-action@v3) | resolved | 2026-03-04 |
| CF-DEC-005 | Politica CORS CI | Worker/Pages requiere CORS resuelto en inventario | resolved | 2026-03-04 |
| CF-DEC-006 | Aprobación A1-A10 | Ajustes documentales y técnicos aprobados por usuario | resolved | 2026-03-04 |
| CF-DEC-007 | Retiro de INSTRUCCION_PRE_DESPLIEGUE | Eliminado tras validar paridad funcional con Gatekeeper | resolved | 2026-03-04 |
| CF-DEC-008 | Nombre directorio frontend | `frontend/`, package name `frontend` (package.json) | resolved | 2026-03-04 |
| CF-DEC-009 | Node.js version para build CF Pages | Node.js 22 LTS (recomendado). Entorno dev actual: v24.11.1 | resolved | 2026-03-04 |
| CF-DEC-010 | Páginas demo TailAdmin en sprint integración | No incluidas. Se añaden individualmente en sprints futuros por demanda | resolved | 2026-03-04 |
| CF-DEC-011 | CORS — delegación a AGTO | AGTO define `ALLOWED_ORIGINS` cuando se establezca dominio de CF Pages | resolved | 2026-03-04 |
| CF-DEC-012 | Dominio personalizado CF Pages | Sin confirmar por el momento. Ampliar ALLOWED_ORIGINS cuando el usuario registre dominio | pending | 2026-03-04 |
