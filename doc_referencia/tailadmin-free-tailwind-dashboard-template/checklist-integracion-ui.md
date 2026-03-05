# Checklist de Integración UI — TailAdmin Free Dashboard Template

**Fecha:** 2026-03-04  
**Versión:** 1.1 (auditada 2026-03-04)  
**Autor:** AGTO  
**Referencia:** [plan-integracion-ui.md](./plan-integracion-ui.md)  
**Reglas aplicadas:** G1, G2, G3, G4, G5, G6, G7, G8

> **Convención de estado:**  
> `[ ]` = Pendiente | `[x]` = Completado | `[~]` = En progreso | `[!]` = Bloqueado

> **Nota de auditoría 2026-03-04:** La integración se realizó en `frontend/` (no `ui/`). El plan y checklist usaban `ui/` como propuesta pendiente de confirmación. El usuario confirmó `frontend/` como nombre real. Todos los ítems han sido auditados contra el estado real del repositorio en commit `b51b7a8`.

---

## FASE 0 — Pre-condiciones y Validación de Ambigüedades (G1)

- [x] **[G1]** Confirmar con el usuario el nombre del directorio destino para la UI  
  _Resultado: `frontend/` (no `ui/`). Confirmado y ejecutado._

- [~] **[G1]** Confirmar nombre del paquete para `package.json > name`  
  _Resultado: se usó `"frontend"` — no el propuesto `"cf-sil-ui"`. Sin confirmación explícita documentada._

- [x] **[G1]** Confirmar qué páginas de demostración adicionales deben incluirse  
  _Resultado: ninguna en esta fase. Confirmado en CF-DEC-010 (ahora archivado)._

- [x] **[G1]** Confirmar versión de Node.js para build  
  _Resultado: Node.js 22. Confirmado en `wrangler.toml` y workflows._

- [x] **[G1]** CF-CORS-001 no bloqueante en esta fase  
  _Resultado: resuelto durante el sprint. `wrangler.toml` y `_headers` creados con orígenes reales._

- [!] **[G1]** Confirmar logo de proyecto para reemplazar el de TailAdmin  
  _Estado: RESUELTO. Logo se inyecta vía `IMG_LOGO_SITE` (CF-FE-001) desde `wrangler.toml`. Procesado en `processNestedHtml` en webpack build. Build compilado y verificado — `https://srrhhmx.s-ul.eu/CRpEAFzD` presente en todos los HTML del build._

---

## FASE 1 — Limpieza del Repositorio de Referencia (G7)

- [x] **[G7]** Verificar existencia de `.git/` en el template de referencia  
  _`repos_referencia/tailadmin-free-tailwind-dashboard-template/.git` — no existe (eliminado)._

- [x] **[G7]** Eliminar `.git/` del template de referencia  
  _Evidencia: directorio no existe en el repositorio actual._

- [x] **[G7]** Verificar `.DS_Store` / `.vscode/`  
  _No presentes en `frontend/src/`._

- [x] **[G7]** `banner.png` NO copiado  
  _No existe en `frontend/`._

---

## FASE 2 — Creación de la Estructura de Destino

- [x] Crear directorio destino  
  _`frontend/` existe con estructura completa._

- [x] Crear subdirectorios  
  _`frontend/src/css`, `js`, `images`, `partials` todos presentes._

---

## FASE 3 — Copia de Archivos (G7: selectivo)

### 3.1 Archivos de Configuración Raíz

- [x] `package.json` — presente en `frontend/`
- [x] `webpack.config.js` — presente en `frontend/`
- [x] `postcss.config.js` — presente en `frontend/`
- [x] `.prettierrc` — presente en `frontend/`
- [x] `.browserslistrc` — presente en `frontend/`
- [x] `frontend/.gitignore` creado con `node_modules/`, `build/`, `.DS_Store`, `*.local`

### 3.2 CSS

- [x] `src/css/style.css` → `frontend/src/css/style.css`
- [x] `@import "tailwindcss"` presente
- [x] Google Fonts (Outfit) cargada desde CSS

### 3.3 JavaScript

- [x] `src/js/index.js` → `frontend/src/js/index.js`
- [x] `src/js/components/charts/chart-01.js`
- [x] `src/js/components/charts/chart-02.js`
- [x] `src/js/components/charts/chart-03.js`
- [x] `src/js/components/calendar-init.js`
- [x] `src/js/components/image-resize.js`
- [x] `src/js/components/map-01.js`

### 3.4 Imágenes

- [x] `src/images/icons/` — 6 SVGs presentes
- [x] `src/images/logo/` — presente (`logo.svg`, `logo-dark.svg`, `logo-icon.svg`, `auth-logo.svg`)
- [x] `src/images/shape/` — `grid-01.svg` presente
- [x] `src/images/error/` — `404.svg`, `404-dark.svg` presentes
- [!] **`src/images/country/`** — presente (`country-01.svg`, `country-02.svg`) — en uso por `map-01.html` (placeholder, pendiente asset real)
- [!] **`src/images/user/`** — presente (`owner.jpg`, `user-02..05.jpg`) — en uso por `header.html`, `profile.html`, `avatar/` partials (placeholder, pendiente assets reales)
- [!] **`src/images/product/`** — presente (`product-01..05.jpg`) — en uso por `table-01.html` (placeholder, pendiente assets reales)
- [x] `brand/` — absent ✓
- [x] `grid-image/` en `src/images/` — absent ✓
- [x] `video-thumb/` — absent ✓

### 3.5 Partials HTML

- [x] `header.html`, `sidebar.html`, `overlay.html`, `preloader.html`, `breadcrumb.html`
- [x] `datepicker.html`, `calendar-event-modal.html`, `common-grid-shape.html`
- [x] `common-social-links.html`, `map-01.html`, `media-card.html`
- [x] `top-card-group.html`, `upcoming-schedule.html`, `watchlist.html`
- [x] `alert/` — 4 variantes (error, info, success, warning)
- [x] `avatar/` — 4 variantes (01–04)
- [x] `badge/` — 6 variantes (01–06)
- [x] `buttons/` — 6 variantes (01–06)
- [x] `chart/` — 3 variantes (01–03)
- [x] `metric-group/` — `metric-group-01.html`
- [x] `profile/` — `profile-address-modal.html`, `profile-info-modal.html`
- [x] `table/` — `table-01.html`, `table-06.html`
- [x] `video/` — 4 variantes (01–04)
- [!] **`grid-image/`** — **ELIMINADO** (`partials/grid-image/` removido). No estaba incluido en ninguna página core y referenciaba imágenes inexistentes.

### 3.6 Páginas HTML Core

- [x] `index.html`
- [x] `signin.html`
- [x] `signup.html`
- [x] `profile.html`
- [x] `404.html`
- [x] `blank.html`
- [x] `calendar.html`

### 3.7 Páginas de Demo — NO copiadas ✓

- [x] `alerts.html` — absent
- [x] `avatars.html` — absent
- [x] `badge.html` — absent
- [x] `buttons.html` — absent
- [x] `bar-chart.html` — absent
- [x] `line-chart.html` — absent
- [x] `basic-tables.html` — absent
- [x] `form-elements.html` — absent
- [x] `images.html` — absent
- [x] `videos.html` — absent
- [x] `sidebar.html` (demo) — absent

---

## FASE 4 — Adaptaciones de Configuración

### 4.1 `frontend/package.json` (G4)

- [~] Campo `name` — valor: `"frontend"` (nombre genérico, no confirmado con usuario; propuesta era `"cf-sil-ui"`)
- [x] Campo `description` — `"C&B Consulting — Frontend UI layer based on TailAdmin Free (TailwindCSS v4 + AlpineJS + Webpack)"`
- [x] Campo `author` — vacío `""`

### 4.2 `frontend/src/js/index.js` — Corrección G2

- [x] URL Dropzone lee de `dataset.uploadUrl` (línea 94: `dropzoneArea[0].dataset.uploadUrl`)
- [x] **`data-upload-url` añadido en `profile.html`**: elemento `#demo-upload` con `class="dropzone"` y `data-upload-url="/api/upload"`. Sección "Upload Documents" añadida al final de main content. – AGTO decidió colocarlo en profile.html.

### 4.3 `frontend/.gitignore`

- [x] Presente con `node_modules/`, `build/`, `.DS_Store`, `*.local`

### 4.4 `frontend/src/partials/sidebar.html`

- [x] Rutas de logo relativas (`./images/logo/...`) — REEMPLAZADAS por `<%= IMG_LOGO_SITE %>` (inyectado en build via `processNestedHtml` en webpack)
- [x] **Comentario TODO añadido**: `<!-- TODO: Adaptar items de menú al proyecto cf_sil -->` presente en `sidebar.html`
- [x] **Logo resuelto**: `IMG_LOGO_SITE` (CF-FE-001, `https://srrhhmx.s-ul.eu/CRpEAFzD`) inyectado en build. Favicon `IMG_FAVICON_SITE` (CF-FE-002) inyectado en todas las páginas.

### 4.5 Extras implementados (fuera del plan original)

- [x] `frontend/wrangler.toml` — creado con `name="cb-consulting"`, vars por entorno (SITE_NAME, IMG_LOGO_SITE, IMG_FAVICON_SITE, ALLOWED_ORIGINS)
- [x] `frontend/src/_headers` — CORS + security headers para CF Pages
- [x] `frontend/src/index.html` — `<img alt="C&B Consulting">` en sidebar (alt text del proyecto)
- [x] **webpack inject logo/favicon**: `processNestedHtml` sustituye `<%= IMG_LOGO_SITE %>` y `<%= IMG_FAVICON_SITE %>` desde `wrangler.toml` en build time
- [x] **Favicon añadido**: `<link rel="icon" href="...">` en los 7 HTML pages
- [x] **Swiper eliminado**: dependencia phantom con CVE crítico (GHSA-hmx5-qpq5-p643) removida de `package.json`. `npm audit`: 0 vulnerabilidades.

---

## FASE 5 — Instalación de Dependencias y Validación de Build (G5)

- [x] `npm install` ejecutado (`node_modules/` presente)
- [x] `npm run build` ejecutado (`frontend/build/` presente con 7 HTML + `bundle.js` + `style.css` + `_headers`)
- [ ] Dev server verificado visualmente (no auditado en este sprint)
- [ ] Verificación en navegador de páginas individuales (no auditada)
- [ ] Dark mode toggle verificado
- [ ] Sidebar toggle verificado
- [ ] Gráficos renderizados verificados
- [ ] `npm run sort` (Prettier) ejecutado

---

## FASE 6 — Verificación Reglas Globales

### G1
- [x] No hay valores asumidos sin validar
- [~] `package.json > name` = `"frontend"` (no el valor propuesto; sin confirmación explícita)
- [x] `wrangler.toml` no creado hasta tener CF-CORS-001 resuelto

### G2
- [x] URL Dropzone corregida en JS y HTML (`data-upload-url` en `#demo-upload` de `profile.html`)
- [x] No hay `account_id`, URLs propias ni credenciales en código fuente
- [x] Logo inyectado desde `wrangler.toml` via `processNestedHtml` — cero hardcoding en HTML source

### G3
- [x] Sin secrets en texto plano
- [x] `CF_API_TOKEN` / `CF_ACCOUNT_ID` solo en GitHub Actions Secrets

### G4
- [x] Variables y funciones en inglés
- [x] Sin mezcla de idiomas en código

### G5
- [x] `npm run build` sin errores (28 archivos desplegados a CF Pages)
- [x] `npm audit`: 0 vulnerabilidades (swiper eliminado)
- [ ] `npm run sort` no verificado

### G6
- [x] CF-CORS-001 resuelto; `_headers` y `wrangler.toml` con `ALLOWED_ORIGINS` correctos
- [x] Sin CORS headers hardcodeados en código

### G7
- [x] `.git/` eliminado del template de referencia
- [x] `banner.png` no copiado
- [~] `country/`, `user/`, `product/` presentes — en uso por componentes activos (map-01, header, table-01). Pendiente reemplazo con assets reales del proyecto.
- [x] `partials/grid-image/` **ELIMINADO** — no estaba en uso y referenciaba imágenes inexistentes.

### G8
- [x] Commits con identificador y descripción (formato `[YYYYMMDD-HHMM]`)

---

## FASE 7 — Preparación para Sprint de Despliegue CF Pages

- [x] CF-CORS-001 resuelto
- [x] `frontend/wrangler.toml` creado
- [x] PreDeploy Gatekeeper ejecutado y aprobado
- [x] CF-SEC-001 y CF-SEC-002 en `resolved`
- [x] Rama de despliegue: `main` — CF Pages configurado

---

## Pendientes abiertos POST-INTEGRACIÓN

| ID | Pendiente | Prioridad | Regla | Estado |
|---|---|---|---|---|
| UI-PND-001 | **Logo del proyecto**: inyectado via `IMG_LOGO_SITE` (CF-FE-001) en build. URLs externas permanentes hasta que el usuario provea SVG final | RESUELTO | G1 | [x] |
| UI-PND-002 | **`data-upload-url` en HTML**: añadido en `profile.html` `#demo-upload` con `data-upload-url="/api/upload"`. URL final pend. de Worker backend | RESUELTO | G2 | [x] |
| UI-PND-003 | **Imágenes demo `country/`, `user/`, `product/`**: en uso por componentes activos (map-01, header, table-01, avatars). Reemplazar con assets reales cuando estén disponibles | ABIERTO | G7 | [~] |
| UI-PND-004 | **`partials/grid-image/`**: ELIMINADO (no estaba incluido en ninguna página core) | RESUELTO | G7 | [x] |
| UI-PND-005 | **`package.json > name`**: `"frontend"` confirmado por usuario | RESUELTO | G1 | [x] |
| UI-PND-006 | **TODO en sidebar**: `<!-- TODO: Adaptar items de menú al proyecto cf_sil -->` añadido | RESUELTO | — | [x] |
| UI-PND-007 | **`npm run sort`**: Prettier aún no verificado | ABIERTO | G5 | [ ] |
| UI-PND-008 | **Verificación visual**: dev server y 7 páginas en navegador pendiente | ABIERTO | G5 | [ ] |
| UI-PND-009 | **Swiper CVE**: Eliminado como dependencia phantom. `npm audit`: 0 vulnerabilidades | RESUELTO | SEC | [x] |
| UI-PND-010 | **Imágenes demo pendientes**: `user-01.jpg`, `user-17..33.jpg` referenciados en partials pero inexistentes en `src/images/user/`. Partials muestran broken images. | ABIERTO | G7 | [~] |

---

## Resumen de Estado

| Fase | Descripción | Estado |
|---|---|---|
| 0 | Pre-condiciones y validación G1 | `[x]` Completado (logo via CF-FE-001, favicon via CF-FE-002) |
| 1 | Limpieza repositorio de referencia G7 | `[x]` Completado |
| 2 | Creación estructura destino | `[x]` Completado (en `frontend/`, no `ui/`) |
| 3 | Copia selectiva de archivos | `[~]` Imágenes demo en uso como placeholders; `grid-image/` eliminado |
| 4 | Adaptaciones de configuración | `[x]` Completado (Dropzone, logo, favicon, TODO sidebar) |
| 5 | Instalación de dependencias y build | `[~]` Build OK + 0 CVEs; verificación visual pendiente |
| 6 | Verificación de reglas G1–8 | `[~]` G2 completo; G7 placeholder assets pendientes de reemplazo |
| 7 | Sprint despliegue CF Pages | `[x]` Completado (`cb-consulting.pages.dev` live) |
