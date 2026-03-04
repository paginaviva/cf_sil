# Plan de Integración UI — TailAdmin Free Dashboard Template

**Fecha:** 2026-03-04  
**Versión:** 1.0  
**Autor:** AGTO  
**Estado:** Borrador — Pendiente aprobación de usuario  
**Reglas aplicadas:** G1, G2, G4, G5, G6, G7, G8

---

## 1. Resumen Ejecutivo

Este documento describe el plan para integrar el repositorio de referencia `tailadmin-free-tailwind-dashboard-template` (TailAdmin v2.0.1) al proyecto `cf_sil` como base de desarrollo de pantallas de interfaz de usuario, siguiendo las reglas globales G1–G8.

El template aporta un sistema de componentes UI basado en **TailwindCSS v4 + AlpineJS + Webpack**, sin framework de componentes JavaScript (React/Vue), lo que lo hace de bajo acoplamiento y fácil de extender. La integración apunta a crear un directorio `ui/` en la raíz del proyecto que contendrá esta capa frontend, lista para desplegarse como **Cloudflare Pages** en el futuro.

---

## 2. Análisis del Repositorio Fuente

### 2.1 Tecnologías Identificadas

| Categoría | Tecnología | Versión |
|---|---|---|
| Estilos | TailwindCSS | ^4.0.0 |
| CSS PostProcessing | PostCSS + @tailwindcss/postcss | ^8.4.39 / ^4.0.0 |
| Interactividad | AlpineJS | ^3.14.1 |
| Persistencia Alpine | @alpinejs/persist | ^3.14.1 |
| Build tool | Webpack | ^5.96.1 |
| Dev server | webpack-dev-server | ^5.0.4 |
| Transpilación | Babel + @babel/preset-env | ^7.24.x |
| Tipografía | Google Fonts (Outfit) | via CSS @import |
| Gráficos | ApexCharts | ^3.51.0 |
| Gráficos (lit) | Chart.js | ^4.4.6 |
| Mapa | jsvectormap | ^1.6.0 |
| Calendario | FullCalendar | ^6.1.15 |
| Datepicker | flatpickr | ^4.6.13 |
| Upload | Dropzone | ^6.0.0-beta.2 |
| Slider | Swiper | ^11.1.14 |

### 2.2 Estructura del Repositorio Fuente

```
tailadmin-free-tailwind-dashboard-template/
├── src/
│   ├── css/
│   │   └── style.css              ← TailwindCSS v4 + custom theme tokens
│   ├── images/
│   │   ├── brand/                 ← Logos de marcas de referencia (demos)
│   │   ├── country/               ← Banderas (demos)
│   │   ├── error/                 ← Ilustraciones de error
│   │   ├── grid-image/            ← Imágenes de galería (demos)
│   │   ├── icons/                 ← Iconos SVG
│   │   ├── logo/                  ← Logo del template TailAdmin
│   │   ├── product/               ← Imágenes de productos (demos)
│   │   ├── shape/                 ← Figuras decorativas
│   │   ├── user/                  ← Avatares de usuario (demos)
│   │   └── video-thumb/           ← Miniaturas de video (demos)
│   ├── js/
│   │   ├── index.js               ← Entry point principal
│   │   └── components/
│   │       ├── calendar-init.js
│   │       ├── image-resize.js
│   │       ├── map-01.js
│   │       └── charts/
│   │           ├── chart-01.js    ← Configuración ApexCharts (línea)
│   │           ├── chart-02.js    ← Configuración ApexCharts (barra)
│   │           └── chart-03.js    ← Configuración ApexCharts (área)
│   ├── partials/                  ← Fragmentos HTML reutilizables (include tags)
│   │   ├── header.html
│   │   ├── sidebar.html
│   │   ├── overlay.html
│   │   ├── preloader.html
│   │   ├── breadcrumb.html
│   │   ├── datepicker.html
│   │   ├── calendar-event-modal.html
│   │   ├── common-grid-shape.html
│   │   ├── common-social-links.html
│   │   ├── map-01.html
│   │   ├── media-card.html
│   │   ├── top-card-group.html
│   │   ├── upcoming-schedule.html
│   │   ├── watchlist.html
│   │   ├── alert/                 ← Componentes de alerta (error, info, success, warning)
│   │   ├── avatar/                ← Variantes de avatar (01–04)
│   │   ├── badge/                 ← Variantes de badge (01–06)
│   │   ├── buttons/               ← Variantes de botón (01–06)
│   │   ├── chart/                 ← Contenedores de gráficos (01–03)
│   │   ├── grid-image/            ← Grillas de imágenes (01–03)
│   │   ├── metric-group/          ← Tarjetas de métricas (01)
│   │   ├── profile/               ← Modales de perfil (address, info)
│   │   ├── table/                 ← Tablas (01, 06)
│   │   └── video/                 ← Tarjetas de video (01–04)
│   └── *.html                     ← Páginas de la aplicación
├── package.json
├── webpack.config.js
├── postcss.config.js
├── .prettierrc
├── .browserslistrc
├── .gitignore
├── .git/                          ← ⚠️ DEBE ELIMINARSE (regla G7)
├── banner.png                     ← ⚠️ Asset de demo — no copiar
├── .DS_Store                      ← ⚠️ Metadata macOS — no copiar
└── .vscode/                       ← Configuración de IDE — revisión opcional
```

### 2.3 Páginas HTML Disponibles

| Archivo | Tipo | Categoría |
|---|---|---|
| `index.html` | Dashboard principal | **Core** |
| `signin.html` | Autenticación | **Core** |
| `signup.html` | Registro | **Core** |
| `profile.html` | Perfil de usuario | **Core** |
| `404.html` | Error | **Core** |
| `blank.html` | Plantilla base | **Core** |
| `calendar.html` | Calendario | **Core** |
| `alerts.html` | Demo de alertas | Demo/Componente |
| `avatars.html` | Demo de avatares | Demo/Componente |
| `badge.html` | Demo de badges | Demo/Componente |
| `buttons.html` | Demo de botones | Demo/Componente |
| `bar-chart.html` | Demo de gráfico (barra) | Demo/Componente |
| `line-chart.html` | Demo de gráfico (línea) | Demo/Componente |
| `basic-tables.html` | Demo de tablas | Demo/Componente |
| `form-elements.html` | Demo de formularios | Demo/Componente |
| `images.html` | Demo de imágenes | Demo/Componente |
| `videos.html` | Demo de videos | Demo/Componente |
| `sidebar.html` | Sidebar aislada | Demo/Componente |

### 2.4 Patrón de Inclusión HTML

El template usa un sistema de inclusión personalizado de Webpack (`<include src="...">`) para componer páginas a partir de fragmentos. Este sistema es manejado por `webpack.config.js` a través del loader `html-loader` con una regex `INCLUDE_PATTERN`.

---

## 3. Estructura de Destino Propuesta

```
cf_sil/
├── .github/                       ← Sin cambios
├── doc_referencia/                ← Sin cambios
├── repos_referencia/              ← Solo referencia, no modificar
├── ui/                            ← ✅ NUEVO — Capa frontend
│   ├── src/
│   │   ├── css/
│   │   │   └── style.css
│   │   ├── images/
│   │   │   ├── icons/             ← Mantener (SVGs funcionales)
│   │   │   ├── logo/              ← Mantener (reemplazar con logo del proyecto)
│   │   │   ├── shape/             ← Mantener (decorativas)
│   │   │   └── error/             ← Mantener (ilustraciones de error)
│   │   ├── js/
│   │   │   ├── index.js
│   │   │   └── components/
│   │   │       ├── charts/
│   │   │       ├── calendar-init.js
│   │   │       ├── image-resize.js
│   │   │       └── map-01.js
│   │   ├── partials/              ← Todos los partiales funcionales
│   │   ├── index.html
│   │   ├── signin.html
│   │   ├── signup.html
│   │   ├── profile.html
│   │   ├── 404.html
│   │   ├── blank.html
│   │   └── calendar.html
│   ├── package.json               ← Adaptado para el proyecto cf_sil
│   ├── webpack.config.js          ← Sin cambios funcionales iniciales
│   ├── postcss.config.js          ← Sin cambios
│   ├── .prettierrc
│   ├── .browserslistrc
│   └── .gitignore                 ← Adaptado / fusionado
└── README.md
```

> **G7 aplicada:** Las páginas de demostración de componentes aislados (`alerts.html`, `avatars.html`, etc.) NO se copian inicialmente. Se añadirán según demanda en sprints futuros.
>
> **G7 aplicada:** Las imágenes de demo (`brand/`, `country/`, `grid-image/`, `product/`, `user/`, `video-thumb/`) NO se copian. Son datos de relleno sin valor funcional.

---

## 4. Inventario de Archivos: Copiar vs. Excluir

### 4.1 Archivos y Directorios a COPIAR

| Origen (relativo a `src/`) | Destino (`ui/src/`) | Motivo |
|---|---|---|
| `css/style.css` | `css/style.css` | Sistema de estilos base — necesario |
| `images/icons/` | `images/icons/` | SVGs funcionales del template |
| `images/logo/` | `images/logo/` | Placeholder — reemplazar con logo del proyecto |
| `images/shape/` | `images/shape/` | Decorativas — parte del layout |
| `images/error/` | `images/error/` | Ilustración 404 — funcional |
| `js/index.js` | `js/index.js` | Entry point — necesario |
| `js/components/` | `js/components/` | Lógica de charts, mapa, calendario |
| `partials/` | `partials/` | Todos los fragmentos HTML |
| `index.html` | `index.html` | Dashboard principal |
| `signin.html` | `signin.html` | Autenticación |
| `signup.html` | `signup.html` | Registro |
| `profile.html` | `profile.html` | Perfil |
| `404.html` | `404.html` | Error |
| `blank.html` | `blank.html` | Base para nuevas páginas |
| `calendar.html` | `calendar.html` | Funcional |

| Origen (raíz del template) | Destino (`ui/`) | Motivo |
|---|---|---|
| `package.json` | `package.json` | Dependencias — adaptar nombre y descripción |
| `webpack.config.js` | `webpack.config.js` | Build config |
| `postcss.config.js` | `postcss.config.js` | PostCSS config |
| `.prettierrc` | `.prettierrc` | Formato código |
| `.browserslistrc` | `.browserslistrc` | Compatibilidad navegadores |
| `.gitignore` | `.gitignore` | Adaptar para proyecto |

### 4.2 Archivos y Directorios a EXCLUIR (G7)

| Archivo/Directorio | Motivo de exclusión |
|---|---|
| `.git/` | **G7 crítico** — subrepositorio anidado |
| `banner.png` | Asset de marketing del template — no funcional |
| `.DS_Store` | Metadata macOS — no versionar |
| `.vscode/` | Configuración IDE local — no versionar |
| `README.md` | El proyecto tiene su propia documentación |
| `package-lock.json` | Se regenera al instalar dependencias |
| `src/images/brand/` | Logos demo de terceros |
| `src/images/country/` | Banderas demo |
| `src/images/grid-image/` | Imágenes de galería demo |
| `src/images/product/` | Imágenes de productos demo |
| `src/images/user/` | Avatares de usuario demo |
| `src/images/video-thumb/` | Miniaturas de video demo |
| `src/alerts.html` | Demo de componentes — añadir si se necesita |
| `src/avatars.html` | Demo de componentes — añadir si se necesita |
| `src/badge.html` | Demo de componentes — añadir si se necesita |
| `src/buttons.html` | Demo de componentes — añadir si se necesita |
| `src/bar-chart.html` | Demo de componentes — añadir si se necesita |
| `src/line-chart.html` | Demo de componentes — añadir si se necesita |
| `src/basic-tables.html` | Demo de componentes — añadir si se necesita |
| `src/form-elements.html` | Demo de componentes — añadir si se necesita |
| `src/images.html` | Demo de componentes — añadir si se necesita |
| `src/videos.html` | Demo de componentes — añadir si se necesita |
| `src/sidebar.html` | Demo de componentes — añadir si se necesita |

---

## 5. Adaptaciones Requeridas

### 5.1 `ui/package.json`

- Cambiar `"name"` a `"cf-sil-ui"` (o el nombre que designe el usuario).
- Cambiar `"description"` a descripción del proyecto.
- Mantener todas las dependencias y devDependencies intactas en primera instancia.
- Eliminar campo `"author"` con datos de TailAdmin o vaciar con datos del proyecto.

### 5.2 `ui/src/partials/sidebar.html`

- Las referencias a imágenes de logo (`./images/logo/logo.svg`) apuntan a assets del template. Reemplazar con el logo del proyecto cuando esté disponible.
- Textos del menú de navegación están en inglés (dashboard, forms, tables...) — ajustar según las páginas del proyecto en sprints futuros.

### 5.3 `ui/src/js/index.js` — Dropzone

- La URL de upload está hardcodeada como `"/file/post"`:

```javascript
// ❌ Actualmente hardcodeado (viola G2)
let myDropzone = new Dropzone("#demo-upload", { url: "/file/post" });
```

- **Acción requerida:** Mover esta URL a una variable de entorno o leerla de un atributo `data-*` en el HTML para cumplir G2.

### 5.4 `ui/src/css/style.css` — Google Fonts

- El `@import` de Google Fonts usa una URL externa. Para entornos sin acceso a internet o para control total de la tipografía, considerar auto-hospedar la fuente Outfit. No es bloqueante en primera fase.

### 5.5 `.gitignore` (nuevo en `ui/`)

Asegurar que contiene al menos:
```
node_modules/
build/
.DS_Store
```

---

## 6. Dependencias a Añadir al Proyecto

Todas las dependencias ya están declaradas en `package.json` del template. Al integrarse en `ui/` con `npm install` se instalarán automáticamente. No hay dependencias a añadir al `package.json` raíz del proyecto `cf_sil` (el proyecto principal no tiene `package.json` en raíz aún).

### 6.1 Dependencias de Producción Clave

| Paquete | Versión | Uso |
|---|---|---|
| `alpinejs` | ^3.14.1 | Reactividad UI (sidebar, dark mode, modales) |
| `@alpinejs/persist` | ^3.14.1 | Persistencia de estado en localStorage |
| `apexcharts` | ^3.51.0 | Gráficos del dashboard |
| `flatpickr` | ^4.6.13 | Selector de fechas |
| `fullcalendar` (+plugins) | ^6.1.15 | Módulo de calendario |
| `jsvectormap` | ^1.6.0 | Mapa vectorial interactivo |
| `dropzone` | ^6.0.0-beta.2 | Upload de archivos drag-and-drop |
| `swiper` | ^11.1.14 | Carruseles/sliders |
| `chart.js` | ^4.4.6 | Gráficos alternativos |

### 6.2 DevDependencies Clave

| Paquete | Versión | Uso |
|---|---|---|
| `tailwindcss` | ^4.0.0 | Framework CSS |
| `@tailwindcss/postcss` | ^4.0.0 | Integración PostCSS |
| `webpack` | ^5.96.1 | Bundler |
| `html-webpack-plugin` | ^5.6.0 | Procesamiento HTML con includes |
| `babel-loader` + `@babel/core` | ^9.x / ^7.x | Transpilación JS |
| `mini-css-extract-plugin` | ^2.9.0 | Extracción CSS |

---

## 7. Posibles Conflictos

| Área | Conflicto Potencial | Resolución |
|---|---|---|
| G1 — `.git` anidado | `repos_referencia/tailadmin-free-tailwind-dashboard-template/.git/` debe eliminarse | Ejecutar `rm -rf .git` antes de copiar (G7) |
| G2 — URL Dropzone | `"/file/post"` hardcodeado en `index.js` | Leer desde `data-upload-url` en HTML |
| G1 — Logo del proyecto | `logo.svg` es el logo de TailAdmin | Reemplazar en sprint posterior cuando el usuario defina el logo |
| G1 — CORS (CF-CORS-001) | `ALLOWED_ORIGINS` está en estado `pending` en inventario | **No se puede desplegar en Cloudflare Pages hasta que CF-CORS-001 pase a `resolved`** |
| G6 — CORS header | El Worker/Pages API que consuma el frontend debe tener CORS configurado | Verificar al implementar el Worker de backend |
| G7 — `.DS_Store` | Acumulado en el repo de referencia | No copiar |
| Webpack paths | `webpack.config.js` genera output en `./build` — verificar que coincide con la configuración de Cloudflare Pages | Confirmar en sprint de despliegue |

---

## 8. Pasos de Implementación (Sprint de Integración)

### Paso 0 — Pre-condiciones (G1 + Gatekeeper)
> Esta fase NO implica despliegue CF, por lo que no activa el PreDeploy Gatekeeper. El gatekeeper se activa en el sprint de despliegue.

- [ ] Confirmar con el usuario el nombre del directorio destino (propuesto: `ui/`)
- [ ] Confirmar nombre para `package.json > name` (propuesto: `cf-sil-ui`)
- [ ] Eliminar `.git` del template de referencia para cumplir G7

### Paso 1 — Preparación

```bash
# Crear directorio destino
mkdir -p /workspaces/cf_sil/ui

# Eliminar .git del template de referencia (G7)
rm -rf /workspaces/cf_sil/repos_referencia/tailadmin-free-tailwind-dashboard-template/.git
```

### Paso 2 — Copia de Archivos (G7: solo lo necesario)

```bash
TEMPLATE=/workspaces/cf_sil/repos_referencia/tailadmin-free-tailwind-dashboard-template
UI=/workspaces/cf_sil/ui

# Archivos de configuración raíz
cp $TEMPLATE/package.json $UI/
cp $TEMPLATE/webpack.config.js $UI/
cp $TEMPLATE/postcss.config.js $UI/
cp $TEMPLATE/.prettierrc $UI/
cp $TEMPLATE/.browserslistrc $UI/

# Directorio src/ (selectivo)
mkdir -p $UI/src

# CSS
cp -r $TEMPLATE/src/css $UI/src/

# JS completo
cp -r $TEMPLATE/src/js $UI/src/

# Partials completos (reutilizables)
cp -r $TEMPLATE/src/partials $UI/src/

# Imágenes funcionales únicamente (no demos)
mkdir -p $UI/src/images
cp -r $TEMPLATE/src/images/icons $UI/src/images/
cp -r $TEMPLATE/src/images/logo $UI/src/images/
cp -r $TEMPLATE/src/images/shape $UI/src/images/
cp -r $TEMPLATE/src/images/error $UI/src/images/

# Páginas core
cp $TEMPLATE/src/index.html $UI/src/
cp $TEMPLATE/src/signin.html $UI/src/
cp $TEMPLATE/src/signup.html $UI/src/
cp $TEMPLATE/src/profile.html $UI/src/
cp $TEMPLATE/src/404.html $UI/src/
cp $TEMPLATE/src/blank.html $UI/src/
cp $TEMPLATE/src/calendar.html $UI/src/
```

### Paso 3 — Adaptaciones

1. Editar `ui/package.json`: actualizar `name` y `description`.
2. Crear `ui/.gitignore` con `node_modules/`, `build/`, `.DS_Store`.
3. Corregir URL Dropzone en `ui/src/js/index.js` para cumplir G2.

### Paso 4 — Instalación de Dependencias

```bash
cd /workspaces/cf_sil/ui
npm install
```

### Paso 5 — Validación de Build (G5)

```bash
cd /workspaces/cf_sil/ui
npm run build     # Verificar que genera ./build sin errores
npm start         # Iniciar dev server en localhost:3000
```

### Paso 6 — Preparación para Cloudflare Pages (Futuro Sprint)

> **Bloqueante G1:** CF-CORS-001 debe pasar a `resolved` antes de crear el `wrangler.toml` para Pages.

Cuando CF-CORS-001 esté resuelto:
- Crear `ui/wrangler.toml` con la configuración de Cloudflare Pages.
- Definir `build.command = "npm run build"` y `build.output_dir = "build"`.
- Ejecutar PreDeploy Gatekeeper antes del primer despliegue.

---

## 9. Consideraciones de Despliegue Cloudflare Pages

| Parámetro | Valor | Estado |
|---|---|---|
| Build command | `npm run build` | Listo |
| Output directory | `build/` | Listo |
| Node.js version | Definir en `wrangler.toml` | Pendiente |
| CORS origins | `env.ALLOWED_ORIGINS` | **CF-CORS-001 pending** — bloqueante |
| Wrangler config | `ui/wrangler.toml` | No creado aún — esperar CF-CORS-001 |

---

## 10. Pendientes Abiertos (G1)

| ID | Pendiente | Responsable |
|---|---|---|
| UI-PND-001 | Confirmar nombre del directorio destino (propuesto: `ui/`) | Usuario |
| UI-PND-002 | Confirmar `name` en `package.json` (propuesto: `cf-sil-ui`) | Usuario |
| UI-PND-003 | Resolver CF-CORS-001 (origenes CORS) antes de desplegar CF Pages | Usuario + AGTO |
| UI-PND-004 | Definir logo del proyecto para reemplazar el de TailAdmin | Usuario |
| UI-PND-005 | Decidir qué páginas de demostración integrar en sprints futuros | Usuario |
| UI-PND-006 | Definir versión de Node.js para build en Cloudflare Pages | Usuario |

---

*Documento generado por AGTO — Reglas G1–G8 aplicadas.*
