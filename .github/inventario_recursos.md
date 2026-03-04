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
| CF-SEC-001 | CI | GitHub Secret | `CF_ACCOUNT_ID` | `CLOUDFLARE_ACCOUNT_ID` | Secret de GitHub Actions (valor no versionado) | resolved | Usuario | 2026-03-04 | |
| CF-SEC-002 | CI | GitHub Secret | `CF_API_TOKEN` | `CLOUDFLARE_API_TOKEN` | Secret de GitHub Actions (valor no versionado) | resolved | Usuario | 2026-03-04 | Scopes minimos: Workers/Pages/D1/KV/R2/Queues segun recursos activos |
| CF-D1-001 | Cloudflare | D1 Database | `db_endes` | `DB_ENDES` | `database_id`: `a964b55b-6a50-47cc-87bf-42645b6cb0a3` | resolved | AGTO | 2026-03-04 | region: WNAM |
| CF-BND-001 | App Contract | Binding | D1 principal | `DB_ENDES` | `db_endes` | resolved | AGTO | 2026-03-04 | |
| CF-BND-002 | App Contract | Binding | KV cache | `CACHE` | pendiente | pending | AGTO | 2026-03-04 | |
| CF-BND-003 | App Contract | Binding | R2 storage | `BUCKET` | pendiente | pending | AGTO | 2026-03-04 | |
| CF-BND-004 | App Contract | Binding | Queue principal | `QUEUE` | pendiente | pending | AGTO | 2026-03-04 | |
| CF-CORS-001 | Seguridad | CORS | Origenes permitidos | `ALLOWED_ORIGINS` | `https://cb-consulting.pages.dev` (prod); `https://cb-consulting.pages.dev,http://localhost:3000` (preview) | resolved | AGTO | 2026-03-04 | Ampliar cuando se confirme dominio personalizado (CF-DEC-012) |
| CF-CI-003 | CI/CD | Workflow | `quality_baseline.yml` | `workflow_call` | Validación YAML + gobernanza + comandos opcionales | resolved | AGTO | 2026-03-04 | |
| CF-CI-007 | CI/CD | Workflow | `predeploy_gatekeeper.yml` | `workflow_call` | Evaluación predespliegue con política ejecutable | resolved | AGTO | 2026-03-04 | |
| CF-CI-008 | CI/CD | Política | `predeploy_policy.yml` | n/a | Reglas de gatekeeper | resolved | AGTO | 2026-03-04 | |
| CF-CI-011 | CI/CD | Workflow | `ci-deploy-frontend.yml` | `push:main` | Deploy CF Pages | resolved | AGTO | 2026-03-04 | |
| CF-FE-001 | Frontend | CF Pages Env Var | `IMG-LOGO-SITE` | `IMG_LOGO_SITE` | `https://srrhhmx.s-ul.eu/CRpEAFzD` | resolved | Usuario | 2026-03-04 | |
| CF-FE-002 | Frontend | CF Pages Env Var | `IMG-FAVICON-SITE` | `IMG_FAVICON_SITE` | `https://srrhhmx.s-ul.eu/lFYRQHEz` | resolved | Usuario | 2026-03-04 | |
| CF-FE-003 | Frontend | CF Pages Env Var | `SITE-NAME` | `SITE_NAME` | `C&B Consulting` | resolved | Usuario | 2026-03-04 | |
| CF-FE-004 | Frontend | CF Pages | `frontend/` build | n/a | `npm run build` → `frontend/build/` | resolved | AGTO | 2026-03-04 | TailAdmin Free v2.0.1 + TailwindCSS v4 + AlpineJS v3 + Webpack v5 |
| CF-FE-005 | Frontend | Seguridad | `swiper` npm package | n/a | CVE: Prototype pollution en swiper ^11.1.14 (frontend only) | in_progress | AGTO | 2026-03-04 | Riesgo bajo en dashboard UI. Resolver al actualizar swiper cuando parche disponible |
| CF-FE-006 | Frontend | CF Pages Project | `cb-consulting` | `PAGES_PROJECT_NAME` | `cb-consulting` | resolved | Usuario | 2026-03-04 | `cb-consulting.pages.dev`. Dominio personalizado pendiente (CF-DEC-012) |

## Decisiones operativas activas

| ID | Decision | Valor | Estado | Fecha |
|---|---|---|---|----|
| CF-DEC-001 | Triggers GitHub | `ci-deploy-frontend.yml`: push main + workflow_dispatch | resolved | 2026-03-04 |
| CF-DEC-012 | Dominio personalizado CF Pages | Sin confirmar. Ampliar ALLOWED_ORIGINS (CF-CORS-001) cuando se registre | pending | 2026-03-04 |
