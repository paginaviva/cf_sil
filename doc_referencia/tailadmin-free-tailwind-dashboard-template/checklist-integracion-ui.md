# Checklist de Integración UI — TailAdmin Free Dashboard Template

**Fecha:** 2026-03-04  
**Versión:** 1.0  
**Autor:** AGTO  
**Referencia:** [plan-integracion-ui.md](./plan-integracion-ui.md)  
**Reglas aplicadas:** G1, G2, G3, G4, G5, G6, G7, G8

> **Convención de estado:**  
> `[ ]` = Pendiente | `[x]` = Completado | `[~]` = En progreso | `[!]` = Bloqueado

---

## FASE 0 — Pre-condiciones y Validación de Ambigüedades (G1)

> Antes de ejecutar cualquier acción, confirmar con el usuario todos los puntos abiertos. No avanzar con valores no verificados.

- [ ] **[G1]** Confirmar con el usuario el nombre del directorio destino para la UI  
  _Propuesta: `ui/` en la raíz del proyecto `cf_sil`_

- [ ] **[G1]** Confirmar nombre del paquete para `package.json > name`  
  _Propuesta: `cf-sil-ui`_

- [ ] **[G1]** Confirmar qué páginas de demostración adicionales (si alguna) deben incluirse en esta integración  
  _Propuesta por defecto: ninguna adicional; añadir en sprints futuros según demanda_

- [ ] **[G1]** Confirmar versión de Node.js a usar para el build (relevante para Cloudflare Pages)

- [ ] **[G1]** Revisar `inventario_recursos.md` — verificar que CF-CORS-001 (`ALLOWED_ORIGINS`) no es bloqueante en esta fase  
  _Conclusión esperada: no bloqueante para integración local; bloqueante para despliegue CF Pages_

- [ ] **[G1]** Confirmar con el usuario si tiene un logo de proyecto que deba reemplazar el logo de TailAdmin en esta fase o en sprint posterior

---

## FASE 1 — Limpieza del Repositorio de Referencia (G7)

> **G7:** Eliminar `.git` y assets de demo antes de copiar al proyecto principal.

- [ ] **[G7]** Verificar existencia de `.git/` en el template de referencia  
  ```bash
  ls -la repos_referencia/tailadmin-free-tailwind-dashboard-template/ | grep .git
  ```

- [ ] **[G7]** Eliminar `.git/` del template de referencia para prevenir subrepositorio anidado  
  ```bash
  rm -rf repos_referencia/tailadmin-free-tailwind-dashboard-template/.git
  ```

- [ ] **[G7]** Verificar que no exista `.DS_Store` ni `.vscode/` que deban ser excluidos  
  ```bash
  ls -la repos_referencia/tailadmin-free-tailwind-dashboard-template/
  ```

- [ ] **[G7]** Confirmar que `banner.png` NO se copia (archivo de marketing del template, sin valor funcional)

---

## FASE 2 — Creación de la Estructura de Destino

- [ ] Crear directorio `ui/` en la raíz del proyecto  
  ```bash
  mkdir -p /workspaces/cf_sil/ui
  ```

- [ ] Crear subdirectorios necesarios dentro de `ui/src/`  
  ```bash
  mkdir -p ui/src/css ui/src/js ui/src/images ui/src/partials
  ```

---

## FASE 3 — Copia de Archivos (G7: selectivo)

### 3.1 Archivos de Configuración Raíz

- [ ] Copiar `package.json`
- [ ] Copiar `webpack.config.js`
- [ ] Copiar `postcss.config.js`
- [ ] Copiar `.prettierrc`
- [ ] Copiar `.browserslistrc`
- [ ] Crear nuevo `ui/.gitignore` con reglas apropiadas (`node_modules/`, `build/`, `.DS_Store`)  
  _No copiar directamente el `.gitignore` del template; crear uno adaptado al proyecto_

### 3.2 CSS

- [ ] Copiar `src/css/style.css` → `ui/src/css/style.css`
- [ ] Verificar que el `@import "tailwindcss"` está presente y es correcto
- [ ] Verificar que la fuente Outfit se carga desde Google Fonts (aceptable en fase inicial)

### 3.3 JavaScript

- [ ] Copiar `src/js/index.js` → `ui/src/js/index.js`
- [ ] Copiar `src/js/components/` completo → `ui/src/js/components/`
  - [ ] `charts/chart-01.js`
  - [ ] `charts/chart-02.js`
  - [ ] `charts/chart-03.js`
  - [ ] `calendar-init.js`
  - [ ] `image-resize.js`
  - [ ] `map-01.js`

### 3.4 Imágenes (Solo funcionales — G7)

- [ ] Copiar `src/images/icons/` → `ui/src/images/icons/`
- [ ] Copiar `src/images/logo/` → `ui/src/images/logo/` _(placeholder — reemplazar con logo del proyecto)_
- [ ] Copiar `src/images/shape/` → `ui/src/images/shape/`
- [ ] Copiar `src/images/error/` → `ui/src/images/error/`
- [ ] **NO copiar:** `brand/`, `country/`, `grid-image/`, `product/`, `user/`, `video-thumb/`

### 3.5 Partials HTML (Todos los funcionales)

- [ ] Copiar `src/partials/header.html`
- [ ] Copiar `src/partials/sidebar.html`
- [ ] Copiar `src/partials/overlay.html`
- [ ] Copiar `src/partials/preloader.html`
- [ ] Copiar `src/partials/breadcrumb.html`
- [ ] Copiar `src/partials/datepicker.html`
- [ ] Copiar `src/partials/calendar-event-modal.html`
- [ ] Copiar `src/partials/common-grid-shape.html`
- [ ] Copiar `src/partials/common-social-links.html`
- [ ] Copiar `src/partials/map-01.html`
- [ ] Copiar `src/partials/media-card.html`
- [ ] Copiar `src/partials/top-card-group.html`
- [ ] Copiar `src/partials/upcoming-schedule.html`
- [ ] Copiar `src/partials/watchlist.html`
- [ ] Copiar `src/partials/alert/` completo (4 variantes)
- [ ] Copiar `src/partials/avatar/` completo (4 variantes)
- [ ] Copiar `src/partials/badge/` completo (6 variantes)
- [ ] Copiar `src/partials/buttons/` completo (6 variantes)
- [ ] Copiar `src/partials/chart/` completo (3 variantes)
- [ ] Copiar `src/partials/metric-group/` completo
- [ ] Copiar `src/partials/profile/` completo (2 modales)
- [ ] Copiar `src/partials/table/` completo (table-01, table-06)
- [ ] Copiar `src/partials/video/` completo (4 variantes)
- [ ] **NO copiar:** `src/partials/grid-image/` si no hay imágenes de galería en el proyecto

### 3.6 Páginas HTML Core

- [ ] Copiar `src/index.html` → `ui/src/index.html`
- [ ] Copiar `src/signin.html` → `ui/src/signin.html`
- [ ] Copiar `src/signup.html` → `ui/src/signup.html`
- [ ] Copiar `src/profile.html` → `ui/src/profile.html`
- [ ] Copiar `src/404.html` → `ui/src/404.html`
- [ ] Copiar `src/blank.html` → `ui/src/blank.html`
- [ ] Copiar `src/calendar.html` → `ui/src/calendar.html`

### 3.7 Páginas de Demo (NO copiar en esta fase — G7)

> Añadir individualmente en sprints futuros según necesidad acordada con el usuario.

- [ ] **[DIFERIDO]** `alerts.html`
- [ ] **[DIFERIDO]** `avatars.html`
- [ ] **[DIFERIDO]** `badge.html`
- [ ] **[DIFERIDO]** `buttons.html`
- [ ] **[DIFERIDO]** `bar-chart.html`
- [ ] **[DIFERIDO]** `line-chart.html`
- [ ] **[DIFERIDO]** `basic-tables.html`
- [ ] **[DIFERIDO]** `form-elements.html`
- [ ] **[DIFERIDO]** `images.html`
- [ ] **[DIFERIDO]** `videos.html`
- [ ] **[DIFERIDO]** `sidebar.html`

---

## FASE 4 — Adaptaciones de Configuración

### 4.1 `ui/package.json` (G4)

- [ ] Actualizar campo `name` con el valor confirmado por el usuario
- [ ] Actualizar campo `description` con descripción del proyecto
- [ ] Actualizar/vaciar campo `author` eliminando datos de TailAdmin
- [ ] Mantener todas las dependencias y scripts sin cambios en esta fase

### 4.2 `ui/src/js/index.js` — Corrección G2

- [ ] **[G2 crítico]** Identificar el hardcoding de URL en la configuración de Dropzone:
  ```javascript
  // Línea a corregir — url "/file/post" hardcodeada
  let myDropzone = new Dropzone("#demo-upload", { url: "/file/post" });
  ```
- [ ] Corregir para leer la URL desde atributo `data-*` en el elemento HTML  
  ```javascript
  // Corrección propuesta
  const uploadEl = document.querySelector("#demo-upload");
  if (uploadEl) {
    const uploadUrl = uploadEl.dataset.uploadUrl || "/file/post";
    let myDropzone = new Dropzone("#demo-upload", { url: uploadUrl });
  }
  ```
- [ ] En el HTML correspondiente, añadir el atributo:  
  ```html
  <div id="demo-upload" data-upload-url="/file/post">
  ```
  _Nota: la URL final `/file/post` será configurada vía variable de entorno o binding cuando se integre el Worker de backend._

### 4.3 `ui/.gitignore` (nuevo)

- [ ] Crear `ui/.gitignore` con el siguiente contenido mínimo:
  ```
  node_modules/
  build/
  .DS_Store
  *.local
  ```

### 4.4 `ui/src/partials/sidebar.html`

- [ ] Verificar que las rutas de imágenes del logo son relativas y correctas (`./images/logo/...`)
- [ ] Marcar con comentario TODO los textos de menú que deben adaptarse al proyecto:
  ```html
  <!-- TODO: Adaptar items de menú al proyecto cf_sil -->
  ```

---

## FASE 5 — Instalación de Dependencias y Validación de Build (G5)

- [ ] Navegar al directorio `ui/`:
  ```bash
  cd /workspaces/cf_sil/ui
  ```

- [ ] Instalar dependencias:
  ```bash
  npm install
  ```

- [ ] Verificar que `node_modules/` se creó correctamente (no hay errores en la instalación)

- [ ] Ejecutar build de producción:
  ```bash
  npm run build
  ```

- [ ] Verificar que se generó el directorio `build/` sin errores
- [ ] Verificar que `build/` contiene archivos HTML, CSS y JS correctos
- [ ] Ejecutar dev server y verificar interfaz visualmente:
  ```bash
  npm start
  # Esperado: abre navegador en localhost:3000
  ```

- [ ] Verificar en navegador:
  - [ ] `index.html` carga con dashboard completo
  - [ ] `signin.html` carga correctamente
  - [ ] `signup.html` carga correctamente
  - [ ] `profile.html` carga correctamente
  - [ ] `404.html` carga correctamente
  - [ ] `calendar.html` carga correctamente
  - [ ] Dark mode toggle funciona
  - [ ] Sidebar toggle funciona
  - [ ] Gráficos renderizan

- [ ] Ejecutar Prettier (linter de formato, G5):
  ```bash
  npm run sort
  ```

---

## FASE 6 — Verificación de Reglas Globales

### G1 — Sin ambigüedades

- [ ] No hay valores asumidos sin validar con el usuario
- [ ] `package.json > name` tiene el valor confirmado por el usuario
- [ ] No se creó `wrangler.toml` sin tener CF-CORS-001 resuelto

### G2 — Sin hardcoding

- [ ] URL de Dropzone corregida (no hardcodeada)
- [ ] No hay `account_id`, URLs de servicios propios ni credenciales en el código

### G3 — Sin secrets en texto plano

- [ ] No se incluye ningún archivo con secrets, tokens o credenciales
- [ ] No hay referencias a valores de `CF_API_TOKEN` ni `CF_ACCOUNT_ID` en el código fuente

### G4 — Idioma incorrecto detectado

- [ ] Variables, funciones y comentarios técnicos en `js/` están en inglés
- [ ] Marcadores TODO/FIXME en inglés
- [ ] Textos visible al usuario en la UI: revisar idioma según requerimiento del proyecto (pendiente confirmar con usuario)

### G5 — Calidad de código

- [ ] `npm run build` pasa sin errores
- [ ] `npm run sort` (Prettier) ejecutado sin errores
- [ ] No hay `console.error` inesperados en la consola del navegador

### G6 — CORS

- [ ] CF-CORS-001 marcado como bloqueante para el sprint de despliegue en Cloudflare Pages
- [ ] No se configuró ningún header CORS hardcodeado

### G7 — Código externo limpio

- [ ] `.git/` eliminado del directorio de referencia
- [ ] `banner.png` no copiado
- [ ] `.DS_Store` no copiado
- [ ] Páginas de demo no incluidas
- [ ] Imágenes de demo no incluidas

### G8 — Commit

- [ ] Obtener identificador de commit del usuario (formato: `[YYYYMMDD HHMM]`)
- [ ] Redactar mensaje de commit descriptivo:
  ```
  [YYYYMMDD HHMM] feat: Integrar TailAdmin Free como base UI del proyecto
  
  - Crea directorio ui/ con template TailAdmin v2.0.1 adaptado
  - Incluye: TailwindCSS v4, AlpineJS, Webpack, ApexCharts, FullCalendar
  - Páginas core: index, signin, signup, profile, 404, blank, calendar
  - Excluye páginas de demo, imágenes de demo y repo .git (G7)
  - Corrige URL Dropzone hardcodeada (G2)
  - package.json adaptado con nombre del proyecto
  - Solicitado por: usuario (sprint de integración UI)
  ```

---

## FASE 7 — Preparación para Sprint de Despliegue CF Pages (Futuro)

> Esta fase NO se ejecuta ahora. Registrada como referencia para el próximo sprint.

- [ ] **[BLOQUEADO — CF-CORS-001 pending]** Resolver CF-CORS-001 en `inventario_recursos.md`
- [ ] **[BLOQUEADO]** Crear `ui/wrangler.toml` para Cloudflare Pages
- [ ] **[BLOQUEADO]** Ejecutar PreDeploy Gatekeeper antes del primer despliegue
- [ ] **[BLOQUEADO]** Verificar que `CF-SEC-001` y `CF-SEC-002` siguen en estado `resolved`
- [ ] **[BLOQUEADO]** Definir rama de despliegue (main / producción)

---

## Resumen de Estado

| Fase | Descripción | Estado |
|---|---|---|
| 0 | Pre-condiciones y validación G1 | `[ ]` Pendiente |
| 1 | Limpieza repositorio de referencia G7 | `[ ]` Pendiente |
| 2 | Creación estructura destino | `[ ]` Pendiente |
| 3 | Copia selectiva de archivos | `[ ]` Pendiente |
| 4 | Adaptaciones de configuración | `[ ]` Pendiente |
| 5 | Instalación de dependencias y build | `[ ]` Pendiente |
| 6 | Verificación de reglas G1–G8 | `[ ]` Pendiente |
| 7 | Sprint despliegue CF Pages | `[!]` Bloqueado (CF-CORS-001) |

---

*Checklist generado por AGTO — Reglas G1–G8 aplicadas. Revisión requerida antes de ejecutar Fases 0 y 1.*
