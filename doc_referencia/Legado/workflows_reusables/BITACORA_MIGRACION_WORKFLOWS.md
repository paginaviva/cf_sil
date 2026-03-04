# Bitácora: Migración de Workflows Reusables a Deploy Plano

**Fecha:** 2026-03-04  
**Autor:** AGTO (Arquitecto Agente Orquestador)  
**Refs:** CF-FE-006, CF-CI-011, CF-CORS-001

---

## Contexto y motivación

### Arquitectura original (reemplazada)

La cadena de despliegue de CF Pages tenía 4 niveles de `workflow_call`:

```
ci-deploy-frontend.yml
  → deploy_pages.yml
      → quality_baseline.yml
      → predeploy_gatekeeper.yml
      → cloudflare_reusable.yml
          → cloudflare/wrangler-action@v3
```

### Problemas encontrados

1. **"workflow file issue" en GitHub Actions** (runs 22686021080, 22686347675).  
   Causa confirmada: GitHub prohíbe declarar `GITHUB_TOKEN` por nombre en el bloque `secrets:` de un `workflow_call`. Los 4 reusables (`cloudflare_reusable.yml`, `deploy_pages.yml`, `deploy_worker.yml`, `infra_cloudflare.yml`) lo tenían declarado.  
   Fix aplicado: eliminación de `GITHUB_TOKEN` de las declaraciones y `secrets: inherit` en los call-sites.

2. **Validación `ALLOWED_ORIGINS` en `cloudflare_reusable.yml`** (run 22686615574).  
   `cloudflare_reusable.yml` leía `${{ vars.ALLOWED_ORIGINS }}` (GitHub repository variable), que no estaba configurada. Error: `Repository variable ALLOWED_ORIGINS is required for worker/pages deployments`.  
   Esta validación es propia del reusable, ajena al flujo de Pages.

3. **Proyecto `cb-consulting` no existía en Cloudflare Pages** (run 22687291858).  
   `wrangler pages deploy` requiere que el proyecto exista previamente.  
   Solución: creado vía `wrangler pages project create cb-consulting --production-branch=main` desde el codespace con las credenciales `CF_API_TOKEN` / `CF_ACCOUNT_ID` de los Codespaces secrets.

4. **Complejidad de cadena innecesaria para Pages**.  
   El patrón de `cloudflare_reusable.yml` fue diseñado para workers y operaciones de infra (D1, KV, etc.). Para un despliegue de assets estáticos a CF Pages no aporta valor frente a un job directo con `wrangler-action@v3`.

### Prueba de validación del modelo plano

Workflow `test-deploy-flat.yml` (commit `79e3a12`) ejecutado el 2026-03-04:
- Quality ✓, Node setup ✓, `npm ci` ✓, `npm run build` ✓
- `wrangler-action@v3` → falló solo por ausencia del proyecto CF Pages (no existía aún)
- Una vez creado el proyecto, deploy manual desde codespace: **28 archivos, 1.94 seg, `https://cb-consulting.pages.dev` ✓**

---

## Cambios realizados

### Archivos movidos aquí (de `.github/workflows/`)

| Archivo | Motivo |
|---|---|
| `cloudflare_reusable.yml` | Reemplazado por job plano en `ci-deploy-frontend.yml` |
| `deploy_pages.yml` | Wrapper intermedio eliminado; ya no hay cadena |
| `deploy_worker.yml` | Sin uso activo; se creará workflow plano cuando haya worker |
| `infra_cloudflare.yml` | Sin uso activo; operaciones infra se harán on-demand |
| `cloudflare_policy_guard.yml` | Duplicaba parte del gatekeeper; sin uso en ningún workflow activo |

### Archivos eliminados

| Archivo | Motivo |
|---|---|
| `.github/workflows/test-deploy-flat.yml` | Workflow de prueba temporal; cumplió su función |

### Archivos conservados en `.github/workflows/`

| Archivo | Motivo |
|---|---|
| `quality_baseline.yml` | Valida YAML de workflows y governance files — independiente del deploy |
| `predeploy_gatekeeper.yml` | Evalúa política del inventario — funcionó correctamente (bloqueó CF-DEC-001, aprobó tras resolución) |
| `create_d1_with_gatekeeper.yml` | One-off para crear D1; usa gatekeeper directamente con `cloudflare/wrangler-action@v3` inline |

### Nueva arquitectura `ci-deploy-frontend.yml`

```
Job 1: quality    → quality_baseline.yml (reusable, sin cambios)
Job 2: gatekeeper → predeploy_gatekeeper.yml (reusable, sin cambios)
Job 3: deploy     → steps directos:
                     checkout → setup-node@v4 → npm ci → npm run build
                     → cloudflare/wrangler-action@v3 (apiToken + accountId directo)
```

El job `deploy` es idéntico en estructura al `deploy-production.yml` de `paginaviva/repo_q`, que funciona en producción.

---

## Estado tras la migración

- Proyecto CF Pages `cb-consulting`: **creado y desplegado** ✓
- URL producción: `https://cb-consulting.pages.dev`
- Pipeline CI/CD: quality → gatekeeper → deploy plano
- Secrets usados: `CF_API_TOKEN`, `CF_ACCOUNT_ID` (GitHub Actions secrets, verificados en pantalla)
- Inventario: CF-FE-006 resuelto, CF-DEC-001 resuelto, CF-CORS-001 resuelto
