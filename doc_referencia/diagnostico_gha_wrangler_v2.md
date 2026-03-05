# Diagnóstico Técnico Exhaustivo — GitHub Actions / Wrangler Deploy v2

> **Fecha del diagnóstico**: 2026-03-05  
> **Repositorio**: paginaviva/cf_sil  
> **Branch analizado**: main  
> **Método**: logs reales de GHA + artefactos predeploy-decision.json + código fuente del repo (excluyendo `doc_referencia/` y `repos_referencia/`)

---

## ÍNDICE

1. [Interpretación corregida y plan de diagnóstico](#interpretación-corregida-y-plan-de-diagnóstico)
2. [Resumen ejecutivo](#resumen-ejecutivo)
3. [Stack real del proyecto](#stack-real-del-proyecto)
4. [Tabla de runs analizados](#tabla-de-runs-analizados)
5. [Tabla comparativa éxito vs fallo](#tabla-comparativa-éxito-vs-fallo)
6. [Causas raíz confirmadas](#causas-raíz-confirmadas)
7. [Hipótesis descartadas](#hipótesis-descartadas)
8. [Acciones correctivas](#acciones-correctivas)
9. [NO VERIFICABLE EN LOGS/CÓDIGO](#no-verificable-en-logscódigo)

---

## Interpretación corregida y plan de diagnóstico

**1. Entendimiento del problema**

El pipeline sigue el orden: `quality` → `gatekeeper` → `deploy`. Los tests de build (npm ci + webpack) pasan. El fallo ocurre en el job `gatekeeper` (PreDeploy Gatekeeper), que bloquea el deploy antes de que llegue al step de Wrangler.

**2. Evidencias a utilizar**

- Logs completos de GitHub Actions extraídos con `gh run view <ID> --repo paginaviva/cf_sil --log`.
- Artefactos `predeploy-decision.json` descargados con `gh run download <ID> --name predeploy-decision`.
- Código fuente de los workflows en `.github/workflows/`.
- Diff de commits en `.github/inventario_recursos.md` vía `git diff <commitA> <commitB>`.

**3. Runs a revisar**

- Mínimo 1 exitoso: run 22689333239 (éxito confirmado), 22689706062 (éxito), 22688502932 (éxito + deploy real).
- Mínimo 3 fallidos: runs 22706490192 (más reciente), 22689932901, 22687291858.
- Adicionalmente: runs legacy 22686346910 et al. (2026-03-04T19:47) para identificar un tercer patrón.

**4. Señales buscadas**

- Auth/permisos: presencia/ausencia de `apiToken` y `accountId` en logs.
- Output del gatekeeper: contenido del artefacto `predeploy_decision.json` (decision, blocking_reasons, evidence).
- Versiones: Node.js, wrangler instalado en runner, npm.
- Condición por rama: todos los runs analizados son en `main` vía `push`.
- Diferencias de inventario entre commits exitosos y fallidos.

**5. Qué NO se hará**

- No se inventarán lenguajes, scripts o archivos que no existan en el repo.
- No se atribuirán causas sin evidencia literal en logs o código.
- No se usará ningún diagnóstico previo como fuente.

**6. Cómo evitar repetir el error anterior**

Antes de mencionar cualquier tecnología, se verifica: (a) su extensión de archivo o comando ejecutado en logs, y (b) su ruta exacta en el repo. En este proyecto, Ruby existe **exclusivamente como código inline** dentro de bloques `ruby -e '...'` y `ruby <<'RUBY'` en dos workflows YAML. No existe ningún archivo `.rb` externo.

---

## Resumen ejecutivo

**El pipeline de CI no alcanza el step de Wrangler porque el gatekeeper emite decisión `BLOCKED` en todos los runs recientes desde el commit `b51b7a8` (2026-03-04T21:22).**

Causa raíz confirmada: la función `resource_status` del script Ruby inline en `.github/workflows/predeploy_gatekeeper.yml` usa el heurístico `row.length >= 10 ? row[6] : row[3]` para determinar la columna "Estado" del inventario. Cuando la celda "Notas" está vacía (`| |`), `parse_table_line` elimina ese campo vacío con `.reject(&:empty?)`, dejando 9 elementos en lugar de 10. El heurístico cae al índice 3 (columna "Nombre recurso/clave") en lugar del índice 6 (columna "Estado"), lo que genera estados inválidos (`\`CF_ACCOUNT_ID\``, `D1 principal`, etc.) y bloquea el deploy.

La corrección mínima verificada consiste en ajustar el umbral del heurístico de `>= 10` a `>= 9`.

---

## Stack real del proyecto

**Evidencia**: archivos verificados en el repo (excluyendo `doc_referencia/` y `repos_referencia/`).

| Componente | Detalle | Archivo fuente |
|---|---|---|
| Lenguaje principal | JavaScript/Node.js | `frontend/package.json` |
| Build tool | Webpack 5 (`webpack --config webpack.config.js`) | `frontend/webpack.config.js`, `frontend/package.json` → `scripts.build` |
| UI framework | TailAdmin Free v2.0.1 + TailwindCSS v4 + AlpineJS v3 | `frontend/package.json` (devDependencies + dependencies) |
| Plataforma de deploy | Cloudflare Pages (proyecto `cb-consulting`) | `frontend/wrangler.toml` → `name = "cb-consulting"` |
| Action de deploy | `cloudflare/wrangler-action@v3` | `.github/workflows/ci-deploy-frontend.yml` |
| Node.js (CI) | 22 (actions/setup-node@v4) | `.github/workflows/ci-deploy-frontend.yml` |
| Wrangler (CI) | 3.90.0 (instalado por wrangler-action@v3 durante runs) | Log run 22688502932, línea `npm i wrangler@3.90.0` |
| Runtime Ruby | Ruby preinstalado en `ubuntu-24.04` runner | Logs run 22706490192: `ruby -e '...'` en quality; `ruby <<'RUBY'` en gatekeeper |
| Ruby source | Código **inline** en dos workflows YAML (NO archivos .rb externos) | `.github/workflows/quality_baseline.yml` + `.github/workflows/predeploy_gatekeeper.yml` |

### Estructura CI/CD relevante

```
.github/
├── workflows/
│   ├── ci-deploy-frontend.yml     # Entry point: push main → quality → gatekeeper → deploy
│   ├── quality_baseline.yml       # Reusable: YAML lint (Ruby inline) + governance check + npm ci/build
│   └── predeploy_gatekeeper.yml   # Reusable: evalúa predeploy_policy.yml vs inventario (Ruby inline)
├── predeploy_policy.yml           # Política: ids requeridos, vocabulario de estados, allowlist infra
└── inventario_recursos.md         # Fuente de verdad: tabla Markdown 10 columnas

frontend/
├── package.json                   # npm scripts: build = "webpack && cp src/_headers build/_headers"
├── wrangler.toml                  # CF Pages config: name="cb-consulting", pages_build_output_dir="build"
└── build/                         # Artefacto de build (output de webpack)
```

---

## Tabla de runs analizados

| ID | Fecha UTC | Workflow | Evento | Branch | Commit message | Resultado | Patrón de fallo |
|---|---|---|---|---|---|---|---|
| 22706490192 | 2026-03-05T07:06:22Z | CI - Deploy Frontend (CF Pages) | push | main | [20260305-0756] feat: 2ª parte integración frontend TailAdmin | **FAILURE** | P1: Gatekeeper BLOCKED |
| 22689932901 | 2026-03-04T21:22:21Z | CI - Deploy Frontend (CF Pages) | push | main | [20260304-2230] Limpieza: eliminar todos los datos muertos de .github/ | **FAILURE** | P1: Gatekeeper BLOCKED |
| 22689706062 | 2026-03-04T21:16:22Z | CI - Deploy Frontend (CF Pages) | push | main | [20260304-2215] Limpieza: eliminar datos muertos de inventario y policy | **SUCCESS** | — |
| 22689333239 | 2026-03-04T21:06:54Z | CI - Deploy Frontend (CF Pages) | push | main | [20260304-2200] Limpieza: corregir obsoletos en .github/ post-refactor | **SUCCESS** | — |
| 22688502932 | 2026-03-04T20:45:25Z | CI - Deploy Frontend (CF Pages) | push | main | [20260304-2130] Refactor: deploy plano wrangler-action | **SUCCESS** | — (deploy real completado) |
| 22687617583 | 2026-03-04T20:22:05Z | Create CF Pages Project (one-time) | push | main | [20260304-2121] Util: trigger push para crear proyecto CF Pages | **SUCCESS** | — |
| 22687291858 | 2026-03-04T20:13:29Z | TEST - Deploy Frontend Flat | push | main | [20260304-2115] Test: workflow plano directo para CF Pages | **FAILURE** | P2: CF Pages project no existe |
| 22686347675 | 2026-03-04T19:47:58Z | CI - Deploy Frontend (CF Pages) | push | main | [20260304-2050] Fix: ci-deploy-frontend.yml | **FAILURE** | P3: workflow file issue |
| 22686346910 | 2026-03-04T19:47:58Z | Deploy Worker (Reusable Wrapper) | push | main | [20260304-2050] Fix: ci-deploy-frontend.yml | **FAILURE** | P3: workflow file issue |
| 22686346689 | 2026-03-04T19:47:57Z | Deploy Pages (Reusable Wrapper) | push | main | [20260304-2050] Fix: ci-deploy-frontend.yml | **FAILURE** | P3: workflow file issue |

---

## Tabla comparativa éxito vs fallo

| Dimensión | Run exitoso (22688502932) | Run exitoso (22689706062) | Run fallido (22706490192) | Run fallido (22689932901) |
|---|---|---|---|---|
| Workflow | `ci-deploy-frontend.yml` @ main | `ci-deploy-frontend.yml` @ main | `ci-deploy-frontend.yml` @ main | `ci-deploy-frontend.yml` @ main |
| Commit SHA | (ver commit [20260304-2130]) | abd297f | b9553f3 | b51b7a8 |
| Job quality | PASS | PASS | PASS | PASS |
| Job gatekeeper | APPROVED | APPROVED | **BLOCKED** | **BLOCKED** |
| Job deploy | EJECUTADO | EJECUTADO | NO EJECUTADO | NO EJECUTADO |
| Wrangler invocado | Sí — `npx wrangler pages deploy build/ --project-name=cb-consulting --branch=main --commit-dirty=true` | Sí | No | No |
| Resultado deploy | `✨ Deployment complete! Take a peek over at https://489ceedc.cb-consulting.pages.dev` | (URL diferente) | — | — |
| CF-SEC-001 en evidence | `status=resolved` ✓ | `status=resolved` ✓ | `status=\`CF_ACCOUNT_ID\`` ✗ | `status=\`CF_ACCOUNT_ID\`` ✗ |
| CF-SEC-002 en evidence | `status=resolved` ✓ | `status=resolved` ✓ | `status=resolved` ✓ | `status=resolved` ✓ |
| Número de blocking_reasons | 0 | 0 | **13** | **13** |
| Versión wrangler instalada | 3.90.0 | 3.90.0 | No llega al step | No llega al step |
| Node.js runner | 22.22.0 | 22.22.0 | 22.xx.x | 22.xx.x |
| Imagen runner | ubuntu-24.04 v20260302.42.1 | ubuntu-24.04 | ubuntu-24.04 v20260302.42.1 | ubuntu-24.04 |
| CF-SEC-001 Notas (inventario en ese commit) | "Metodo de resolucion: secret explicito" (no vacía) | No vacía | Vacía `\| \|` | Vacía `\| \|` |

---

## Causas raíz confirmadas

### P1 — Bug de parsing en `resource_status`: columna "Estado" misidentificada cuando "Notas" está vacía

**Tipo**: Determinista  
**Estado**: Activo y recurrente desde commit `b51b7a8` (2026-03-04T21:22)  
**Impacto**: El job `deploy` nunca se ejecuta; el site no se actualiza en CF Pages.

#### Trazabilidad completa

| Campo | Valor |
|---|---|
| Run fallido 1 | 22706490192 (2026-03-05T07:06:22Z) |
| Run fallido 2 | 22689932901 (2026-03-04T21:22:21Z) |
| Workflow | `.github/workflows/ci-deploy-frontend.yml` → llama a `.github/workflows/predeploy_gatekeeper.yml` |
| Job | `gatekeeper / Evaluate PreDeploy Policy` |
| Step que falla | `Run echo "::error::PreDeploy Gatekeeper blocked deployment. Review predeploy_decision.json."` |
| Comando | `echo "::error::PreDeploy Gatekeeper blocked deployment. Review predeploy_decision.json." && exit 1` |
| Exit code | 1 |
| Artefacto evidencia | `predeploy-decision.json` (Artifact ID 5774490116 en run 22706490192) |

#### Fragmento de log (run 22706490192, job gatekeeper)

```
2026-03-05T07:07:05.1661306Z ##[error]PreDeploy Gatekeeper blocked deployment. Review predeploy_decision.json.
2026-03-05T07:07:05.1670022Z ##[error]Process completed with exit code 1.
```

#### Contenido del artefacto `predeploy_decision.json` (run 22706490192)

```json
{
  "timestamp_utc": "2026-03-05T07:07:04Z",
  "decision": "BLOCKED",
  "blocking_reasons": [
    "Estado '`CF_ACCOUNT_ID`' fuera de vocabulario permitido",
    "Estado 'D1 principal' fuera de vocabulario permitido",
    "Estado 'KV cache' fuera de vocabulario permitido",
    "Estado 'R2 storage' fuera de vocabulario permitido",
    "Estado 'Queue principal' fuera de vocabulario permitido",
    "Estado '`quality_baseline.yml`' fuera de vocabulario permitido",
    "Estado '`predeploy_gatekeeper.yml`' fuera de vocabulario permitido",
    "Estado '`predeploy_policy.yml`' fuera de vocabulario permitido",
    "Estado '`ci-deploy-frontend.yml`' fuera de vocabulario permitido",
    "Estado '`IMG-LOGO-SITE`' fuera de vocabulario permitido",
    "Estado '`IMG-FAVICON-SITE`' fuera de vocabulario permitido",
    "Estado '`SITE-NAME`' fuera de vocabulario permitido",
    "CF-SEC-001 no resuelto (status=`CF_ACCOUNT_ID`)"
  ],
  "evidence": [
    "CF-SEC-001: status=`CF_ACCOUNT_ID`",
    "CF-SEC-002: status=resolved",
    "CF-DEC-001: status=resolved",
    "CF-CORS-001: status=resolved; value=`https://cb-consulting.pages.dev` ..."
  ]
}
```

#### Mecanismo del bug (código fuente verificado)

**Archivo**: `.github/workflows/predeploy_gatekeeper.yml`, bloque Ruby inline.

```ruby
# Función 1: parse_table_line — divide la fila y elimina campos vacíos
def parse_table_line(line)
  line.split("|").map(&:strip).reject(&:empty?)   # ← BUG AQUÍ
end

# Función 2: resource_status — elige el índice conociendo la longitud del array
def resource_status(row)
  return nil unless row
  row.length >= 10 ? row[6] : row[3]              # ← HEURÍSTICO ROTO
end
```

**Traza de ejecución para CF-SEC-001 (run 22706490192)**:

Fila en inventario (commit b9553f3, Notas vacía):
```
| CF-SEC-001 | CI | GitHub Secret | `CF_ACCOUNT_ID` | `CLOUDFLARE_ACCOUNT_ID` | Secret de GitHub Actions (valor no versionado) | resolved | Usuario | 2026-03-04 | |
```

1. `split("|")` → 12 partes (incluye `""` al inicio, al final, y el campo Notas vacío `" "`)  
2. `.map(&:strip)` → convierte el Notas-vacío a `""`  
3. `.reject(&:empty?)` → **elimina** el `""` del campo Notas, dejando **9 elementos**  
4. `resource_status([...9 elements...])` → `row.length >= 10` es **FALSE** → devuelve `row[3]`  
5. `row[3]` = `` `CF_ACCOUNT_ID` `` (columna "Nombre recurso/clave", no "Estado")  
6. `` `CF_ACCOUNT_ID` `` ∉ `[pending, in_progress, resolved, blocked]` → primer bloqueador  
7. CF-SEC-001 es `required_inventory_ids.global`, y `status != "resolved"` → segundo bloqueador  

**Traza de ejecución para CF-SEC-002 (correcta, Notas no vacía)**:

Fila en inventario (Notas: "Scopes minimos: Workers/Pages/D1/KV/R2/Queues segun recursos activos"):
1. `.reject(&:empty?)` → **conserva** el campo Notas → **10 elementos**  
2. `row.length >= 10` es **TRUE** → devuelve `row[6]` = `"resolved"` ✓

#### Commit que activó el bug

| Campo | Valor |
|---|---|
| SHA | `b51b7a8` |
| Mensaje | [20260304-2230] Limpieza: eliminar todos los datos muertos de .github/ |
| Fecha | 2026-03-04T21:22 |

Cambios críticos en `.github/inventario_recursos.md` (verificado con `git diff abd297f b51b7a8`):

| Fila | Notas antes del commit | Notas después del commit | Efecto |
|---|---|---|---|
| CF-SEC-001 | `Metodo de resolucion: secret explicito` | *(vacía)* | parser devuelve index[3] → `` `CF_ACCOUNT_ID` `` |
| CF-BND-001 | `Listo para usar en wrangler.toml cuando se implemente` | *(vacía)* | parser devuelve index[3] → `D1 principal` |
| CF-BND-002 | `Sin nombre de namespace confirmado (G1)` | *(vacía)* | parser devuelve index[3] → `KV cache` |
| CF-BND-003 | `Sin nombre de bucket confirmado (G1)` | *(vacía)* | parser devuelve index[3] → `R2 storage` |
| CF-BND-004 | `Sin nombre de queue confirmado (G1)` | *(vacía)* | parser devuelve index[3] → `Queue principal` |
| CF-CI-003 | `Base de cumplimiento G5` | *(vacía)* | parser devuelve index[3] → `` `quality_baseline.yml` `` |
| CF-CI-007 | `Reemplaza guard para bloqueo efectivo` | *(vacía)* | parser devuelve index[3] → `` `predeploy_gatekeeper.yml` `` |
| CF-CI-008 | `Sin dependencia runtime de INSTRUCCION_PRE_DESPLIEGUE` | *(vacía)* | parser devuelve index[3] → `` `predeploy_policy.yml` `` |
| CF-CI-011 | `Activa en push a main cuando cambia frontend/**` | *(vacía)* | parser devuelve index[3] → `` `ci-deploy-frontend.yml` `` |
| CF-FE-001 | `URL logo principal. Inyectado via webpack DefinePlugin...` | *(vacía)* | parser devuelve index[3] → `` `IMG-LOGO-SITE` `` |
| CF-FE-002 | `URL favicon. Inyectado via webpack DefinePlugin...` | *(vacía)* | parser devuelve index[3] → `` `IMG-FAVICON-SITE` `` |
| CF-FE-003 | `Nombre del sitio. Inyectado via webpack DefinePlugin...` | *(vacía)* | parser devuelve index[3] → `` `SITE-NAME` `` |

Filas que **no** se ven afectadas (Notas no vacía después del commit):

| Fila | Notas conservadas | Resultado de parsing |
|---|---|---|
| CF-SEC-002 | `Scopes minimos: Workers/Pages/D1/KV/R2/Queues segun recursos activos` | `status=resolved` ✓ |
| CF-D1-001 | `region: WNAM` | `status=resolved` ✓ |
| CF-CORS-001 | `Ampliar cuando se confirme dominio personalizado (CF-DEC-012)` | `status=resolved` ✓ |
| CF-FE-004 | `TailAdmin Free v2.0.1 + TailwindCSS v4 + AlpineJS v3 + Webpack v5` | ✓ |
| CF-FE-005 | `Riesgo bajo en dashboard UI...` | ✓ |
| CF-FE-006 | `` `cb-consulting.pages.dev`. Dominio personalizado pendiente... `` | ✓ |

#### ¿Por qué pasan los tests pero falla el deploy?

- El job `quality` ejecuta `npm ci && npm run build` (webpack). Webpack compila el frontend correctamente (evidencia: log run 22706490192, la quality gate completa sin error y el job `gatekeeper` se lanza inmediatamente después).
- El fallo ocurre en el job `gatekeeper`, que evalúa `inventario_recursos.md` contra `predeploy_policy.yml` mediante código Ruby inline. Esta evaluación es independiente del código JavaScript del frontend.
- El job `deploy` tiene `needs: gatekeeper` y nunca se ejecuta cuando el gatekeeper emite `BLOCKED`.

---

### P2 — CF Pages project inexistente al ejecutar wrangler (histórico, resuelto)

**Tipo**: Determinista  
**Estado**: Histórico. Resuelto antes del 2026-03-04T20:22.

#### Trazabilidad

| Campo | Valor |
|---|---|
| Run | 22687291858 (2026-03-04T20:13:29Z) |
| Workflow | `TEST - Deploy Frontend Flat` (ya no existe en `.github/workflows/`) |
| Job | `deploy` |
| Step | `Deploy to Cloudflare Pages` |
| Comando | `npx wrangler pages deploy build/ --project-name=cb-consulting --branch=main` |
| Exit code | 1 |

#### Fragmento de log

```
2026-03-04T20:13:59.0177984Z ✘ [ERROR] A request to the Cloudflare API (/accounts/***/pages/projects/cb-consulting) failed.
2026-03-04T20:13:59.0179831Z   Project not found. The specified project name does not match any of your existing projects. [code: 8000007]
2026-03-04T20:13:59.0472790Z ##[error]The process '/opt/hostedtoolcache/node/22.22.0/x64/bin/npx' failed with exit code 1
2026-03-04T20:13:59.0484021Z ##[error]🚨 Action failed
```

**Causa**: El proyecto `cb-consulting` en CF Pages no existía todavía cuando este run se ejecutó. La Cloudflare API rechazó el deploy con code `8000007`.  
**Resolución**: El run 22687617583 ("Create CF Pages Project (one-time)", 2026-03-04T20:22) creó el proyecto exitosamente.  
**Estado actual**: RESUELTO. Los runs exitosos posteriores confirman que el proyecto existe (run 22688502932: `✨ Deployment complete! Take a peek over at https://489ceedc.cb-consulting.pages.dev`).

---

### P3 — Workflows legacy con errores de configuración (histórico, resuelto)

**Tipo**: Determinista (configuración)  
**Estado**: Histórico. Resuelto al mover los workflows a `doc_referencia/Legado/`.

#### Trazabilidad

| Runs afectados | Workflows | Fecha |
|---|---|---|
| 22686346689, 22686346910, 22686347171, 22686347675, 22686019807-22686021080 | `cloudflare_reusable.yml`, `deploy_worker.yml`, `deploy_pages.yml`, `infra_cloudflare.yml` | 2026-03-04T19:39-19:47 |

**Error registrado por GHA**: `This run likely failed because of a workflow file issue.`  
**Causa**: Los workflows `cloudflare_reusable.yml`, `deploy_worker.yml`, `deploy_pages.yml`, `infra_cloudflare.yml` tenían triggers activos en `push:main` pero su contenido era inválido o referenciaba rutas inexistentes.  
**Logs disponibles**: No disponibles (expirados — `gh run view ... --log` devuelve `failed to get run log: log not found`).  
**Resolución**: Los workflows fueron eliminados de `.github/workflows/` y movidos a `doc_referencia/Legado/workflows_reusables/`.  
**Estado actual**: RESUELTO. `.github/workflows/` solo contiene los 3 workflows operativos.

---

## Hipótesis descartadas

| Hipótesis | Razón del descarte | Evidencia |
|---|---|---|
| El fallo es de autenticación (CF_API_TOKEN / CF_ACCOUNT_ID inválidos o ausentes) | Los runs exitosos 22688502932, 22689333239, 22689706062 usan los mismos secrets y el deploy llega a completarse. En los runs fallidos, el deploy step nunca se ejecuta — el error ocurre antes, en el gatekeeper. | Artifacts predeploy_decision.json de runs exitosos: `"decision": "APPROVED"`; log run 22688502932: `✨ Deployment complete!` |
| El fallo es causado por un error de webpack/build | El job `quality` completa con éxito en todos los runs del workflow `CI - Deploy Frontend`, incluyendo los fallidos. El gatekeeper se lanza como evidencia de que quality pasó (`needs: quality`). | Log run 22706490192: quality job completa sin `##[error]`. Gatekeeper se inicia a T07:06:51. |
| El fallo es intermitente o dependiente del entorno runner | El fallo es **determinista**: se reproduce en todos los runs desde commit `b51b7a8`. Los dos runs fallidos (22706490192 y 22689932901) muestran exactamente los mismos 13 blocking_reasons. La única variable que cambió fue el contenido del inventario. | git diff abd297f b51b7a8 muestra la vaciación de Notas; artifacts predeploy_decision.json de ambos fallos son idénticos. |
| El fallo se debe a que los secrets CF_API_TOKEN / CF_ACCOUNT_ID no están configurados en GitHub | La evidencia run 22706490192 muestra que el job `quality` accede correctamente al repo con token (checkout func.). Además, en el run exitoso 22688502932, `apiToken: ***` y `accountId: ***` aparecen en los logs del step wrangler-action (redactados por GHA como `***`), confirmando que los secrets existen y se pasan. | Log run 22688502932 línea 159-160: `apiToken: ***`, `accountId: ***` |

---

## Acciones correctivas

### AC-1 — Corrección del heurístico en `predeploy_gatekeeper.yml` [CRÍTICA - BLOQUEANTE]

**Vinculada a**: Causa P1  
**Archivo**: `.github/workflows/predeploy_gatekeeper.yml`  
**Cambio mínimo verificado**:

Cambiar el umbral de comparación en `resource_status` de `>= 10` a `>= 9`:

```ruby
# ANTES (código actual — falla cuando Notas está vacío)
def resource_status(row)
  return nil unless row
  row.length >= 10 ? row[6] : row[3]
end

# DESPUÉS (corrección mínima)
def resource_status(row)
  return nil unless row
  row.length >= 9 ? row[6] : row[3]
end
```

**Por qué funciona**:
- Fila de tabla principal con Notas vacía → 9 elementos → `>= 9` TRUE → `row[6]` = "Estado" ✓  
- Fila de tabla secundaria (5 columnas, ej. "Decisiones operativas") → 5 elementos → `>= 9` FALSE → `row[3]` = "Estado" ✓  

**Alternativa robusta (opcional)**: Reescribir `parse_table_line` para no eliminar campos vacíos interiores:

```ruby
def parse_table_line(line)
  # Preserva campos vacíos interiores; solo elimina el primer y último campo vacío
  parts = line.split("|")
  parts = parts.drop(1).take(parts.length - 2) if parts.length >= 2
  parts.map(&:strip)
end
```

Con esto `resource_status` puede usar `row[6]` directamente para la tabla principal sin heurístico.

---

### AC-2 — Restaurar (o no vaciear) los campos "Notas" críticos en el inventario [INMEDIATA]

**Vinculada a**: Causa P1 (workaround mientras se aplica AC-1, o medida de corto plazo alternativa)  
**Archivo**: `.github/inventario_recursos.md`  
**Acción**: Añadir cualquier texto no vacío en la columna "Notas" de las 12 filas afectadas (al menos CF-SEC-001, que es `required_inventory_ids.global`). El texto puede ser mínimo (ej. `—`) pero debe ser no vacío.

**Advertencia**: Esta acción es un workaround. Si en el futuro se vuelve a vaciar la columna Notas, el bug se reactiva. La solución permanente es AC-1.

---

### AC-3 — Añadir test unitario/smoke del parser de inventario [PREVENTIVO]

**Vinculada a**: Causa P1 (prevención de regresiones)  
**Acción**: Añadir un step en `quality_baseline.yml` o en `predeploy_gatekeeper.yml` que valide, antes de evaluar la política, que el parser de inventario lee correctamente al menos una fila conocida (ej. CF-SEC-001) con el estado esperado. Esto detectaría el bug antes de que se convierta en BLOCKED.

---

## NO VERIFICABLE EN LOGS/CÓDIGO

Los siguientes puntos no pudieron verificarse por limitaciones de disponibilidad de datos:

1. **Logs de los runs P3 (legacy workflows)**: Los logs de los runs 22686346689, 22686346910, 22686347171, 22686347675, 22686019807-22686021080 no están disponibles (`log not found`). El error exacto en los workflow files legacy es `POSIBLE (NO VERIFICABLE EN LOGS/CÓDIGO)`: se infiere de la mensajería de GHA "This run likely failed because of a workflow file issue", pero el error específico dentro del YAML no puede citarse literalmente.

2. **Versión de wrangler instalada en los runs fallidos P1**: En los runs 22706490192 y 22689932901, el job `deploy` nunca se lanzó, por lo que no existe log de instalación de wrangler. La versión que se habría instalado es `POSIBLE (NO VERIFICABLE EN LOGS/CÓDIGO)` — se asume la misma usada en runs exitosos del mismo periodo (3.90.0), pero no puede afirmarse con certeza.

3. **URL de deploy para los runs exitosos 22689706062 y 22689333239**: Estos runs completaron el deploy, pero no se extrajeron sus URLs de deployment. Las URLs de CF Pages son `POSIBLE (NO VERIFICABLE EN LOGS/CÓDIGO)` para estos runs específicos (se conoce la URL del run 22688502932: `https://489ceedc.cb-consulting.pages.dev`).

4. **Causa interna de los runs 22686019807-22686021080 (commit "20260304 2045")**: Los logs no están disponibles. Se asume el mismo patrón P3 que los runs del commit [20260304-2050], pero es `POSIBLE (NO VERIFICABLE EN LOGS/CÓDIGO)`.

---

*Fin del diagnóstico. Documento generado el 2026-03-05 con trazabilidad completa sobre logs reales de GHA y código fuente verificado del repositorio.*

---

## Corrección aplicada y validación esperada

**Fecha de corrección**: 2026-03-05  
**Archivo modificado**: `.github/workflows/predeploy_gatekeeper.yml`

### Problema identificado

La función `parse_table_line` del script Ruby inline en `.github/workflows/predeploy_gatekeeper.yml` usaba `.reject(&:empty?)` para construir el array de columnas:

```ruby
def parse_table_line(line)
  line.split("|").map(&:strip).reject(&:empty?)
end
```

Cuando la columna "Notas" (última columna de la tabla principal de 10 columnas) estaba vacía (`| |`), el campo se convertía en `""` tras el strip y era eliminado por `reject(&:empty?)`. Esto dejaba el array con **9 elementos** en lugar de 10.

La función `resource_status` usaba el heurístico `row.length >= 10 ? row[6] : row[3]` para decidir el índice de la columna "Estado". Con 9 elementos, la condición era `false` y devolvía `row[3]` (columna "Nombre recurso/clave") en lugar de `row[6]` (columna "Estado"). Los valores resultantes (`` `CF_ACCOUNT_ID` ``, `D1 principal`, etc.) no pertenecen al vocabulario de estados permitidos, lo que generaba 13 bloqueadores y una decisión `BLOCKED`.

### Cambio realizado

**Función 1 — `parse_table_line`** (reescrita):

```ruby
# ANTES
def parse_table_line(line)
  line.split("|").map(&:strip).reject(&:empty?)
end

# DESPUÉS
def parse_table_line(line)
  # Preserve interior empty fields; only strip leading/trailing pipe delimiters
  parts = line.split("|")
  return [] if parts.length < 2
  parts[1..-2].map(&:strip)
end
```

La nueva implementación elimina únicamente los delimitadores extremos (`|` inicial y final) y preserva todos los campos interiores, incluidos los vacíos. Esto garantiza que la longitud del array refleja siempre el número real de columnas de la fila.

**Funciones 2 y 3 — `resource_status` / `resource_value`** (umbral ajustado):

```ruby
# ANTES
row.length >= 10 ? row[6] : row[3]   # resource_status
row.length >= 10 ? row[5] : row[2]   # resource_value

# DESPUÉS
row.length >= 9 ? row[6] : row[3]   # resource_status
row.length >= 9 ? row[5] : row[2]   # resource_value
```

El umbral `>= 9` cubre la tabla principal con campo "Notas" vacío (9 columnas tras el drop de extremos si el campo Notas contiene solo espacios, aunque con la nueva `parse_table_line` ese caso ya no puede ocurrir). Es corrección defensiva adicional respecto al heurístico anterior.

### Por qué este cambio resuelve el problema

Con la nueva `parse_table_line`, la fila:

```
| CF-SEC-001 | CI | GitHub Secret | `CF_ACCOUNT_ID` | `CLOUDFLARE_ACCOUNT_ID` | Secret de GitHub Actions | resolved | Usuario | 2026-03-04 | |
```

produce un array de **10 elementos** independientemente de si la celda "Notas" está vacía o no. `resource_status` recibe `row.length = 10`, `>= 9` es `true`, y devuelve `row[6]` = `"resolved"`.

**Validación local ejecutada** (2026-03-05, antes del commit):

```
CF-SEC-001: length=10, status="resolved"
CF-SEC-002: length=10, status="resolved"
CF-D1-001:  length=10, status="resolved"
CF-BND-001: length=10, status="resolved"
CF-BND-002: length=10, status="pending"
CF-BND-003: length=10, status="pending"
CF-BND-004: length=10, status="pending"
CF-CORS-001: length=10, status="resolved"
CF-CI-003:  length=10, status="resolved"
CF-CI-007:  length=10, status="resolved"
CF-CI-008:  length=10, status="resolved"
CF-CI-011:  length=10, status="resolved"
CF-FE-001:  length=10, status="resolved"
CF-FE-002:  length=10, status="resolved"
CF-FE-003:  length=10, status="resolved"
CF-FE-004:  length=10, status="resolved"
CF-FE-005:  length=10, status="resolved"
CF-FE-006:  length=10, status="resolved"
CF-DEC-001: length=5,  status="resolved"
CF-DEC-012: length=5,  status="pending"
```

Todos los estados se leen correctamente. Las tablas secundarias (5 columnas) también funcionan.

### Parte del pipeline afectada

| Elemento | Detalle |
|---|---|
| Workflow | `.github/workflows/ci-deploy-frontend.yml` |
| Job afectado | `gatekeeper` (llama a `.github/workflows/predeploy_gatekeeper.yml`) |
| Step afectado | `Evaluate policy` (bloque Ruby inline, step `id: eval`) |
| Job bloqueado por el bug | `deploy` (`needs: gatekeeper`) — nunca se ejecutaba |
| Efecto tras la corrección esperado | El gatekeeper emite `APPROVED` → el job `deploy` se ejecuta → `wrangler pages deploy` se invoca → deploy a CF Pages `cb-consulting` |

### Impacto esperado en el pipeline de despliegue

1. El job `gatekeeper` evalúa `inventario_recursos.md` con el parser corregido.
2. CF-SEC-001 devuelve `status=resolved` → sin bloqueadores por parsing erróneo.
3. La decisión del gatekeeper pasa de `BLOCKED` a `APPROVED`.
4. El job `deploy` se ejecuta: `npm ci` → `npm run build` → `wrangler pages deploy build/ --project-name=cb-consulting --branch=main --commit-dirty=true`.
5. El deploy concluye con `✨ Deployment complete!` en CF Pages.
