# Reglas Globales —

> **Aplicación:** Estas reglas aplican a **todos los proyectos** y repositorios del usuario: `copilot-instructions.md` en `.github/`.

---

## G1 — Validación de ambigüedades
**Prioridad: Crítica | Primera regla a aplicar**

Si hay duda sobre nombres de recursos, endpoints, contratos entre servicios o cualquier valor que no esté documentado, **preguntar al usuario antes de generar código**.

**Asignación de Nombres:**
- No asignar nombres de recursos en Cloudflare (Workers, KV, D1, R2, Queues, etc.)
- Preguntar al usuario nombres para recursos en Cloudflare antes de crearlos
- Solo el usuario puede asginar nombres.

**Constatar:**
- No asumir URLs, IDs de cuenta, o configuraciones de entorno.
- No generar código que dependa de valores no verificados.
- Constatar su existencia en el archivo INVENTARIO.md o preguntando al usuario.

**Despliegues Cloudflare (AGTO + AGTE):**
- Para cualquier trabajo que implique `wrangler` (`worker`, `pages`, `infra`), ejecutar validación previa con el agente **PreDeploy Gatekeeper**.
- El gatekeeper se rige por `.github/predeploy_policy.yml` y usa `.github/inventario_recursos.md` como fuente de verdad operativa.
- Si la decisión del gatekeeper es `BLOCKED`, no desplegar y escalar al usuario.

**Ejemplos:**
```
❌ MAL: Asumir que el KV se llama "MI_KV" y generar código usándolo
✅ BIEN: Consultar INVENTARIO.md: "buscando nombre del KV namespace para el código en desarrollo?"

❌ MAL: Asumir account_id y ponerlo en wrangler.toml
✅ BIEN: Preguntar: "¿El account_id se resuelve vía login o debe configurarse?"
```

**Verificación:** Antes de generar código, confirmar que toda información necesaria está documentada o verificada.

---

## G2 — Cero hardcoding de valores sensibles o configuración
**Prioridad: Crítica | Depende de: G0**

No se deben codificar valores, datos, queries, literales de `account_id`, URLs de servicios propios, credenciales, IDs de base de datos o cualquier valor del tipo y medio que quede siendo parte del código o del entorno.

- Utilizar variables de entorno, bindings y/o KV para gestionar estos valores.
- En el frontend, usar variables `VITE_*` u otro prefijo apropiado y leerlas de forma segura.

**Ejemplos:**
```typescript
// ❌ MAL - Hardcoding
const accountId = "abc123xyz";
const API_URL = "https://api.miempresa.com";

// ✅ BIEN - Variables de entorno
const accountId = env.CF_ACCOUNT_ID;
const API_URL = env.API_URL;
```

**Verificación:** Antes de generar código, revisar que no haya valores hardcodeados.

---

## G3 — Gestión de secrets y credenciales
**Prioridad: Crítica | Depende de: G1**

Todas las claves, tokens, certificados (DKIM, OAuth, etc.) deben guardarse en un almacenamiento seguro como un KV namespace específico (`SECRETOS`, `SECRETS`, etc.).

- En CI/CD, usar secrets de GitHub, GitLab, etc., para inyectar valores en el entorno de build/despliegue.
- El contenido de estos namespaces **no se versiona** en el repositorio.

**Ejemplos:**
```
// ❌ MAL - Secrets en código
const API_KEY = "sk-live-abc123xyz";

// ✅ BIEN - Secrets desde entorno
const API_KEY = env.SECRETOS.get("API_KEY");
```

**Verificación:** Nunca generar archivos con secrets en texto plano.

---

## G4 — Idioma y estilo de código
**Prioridad: Alta**

El código (nombres de variables, funciones, tipos, comentarios explicativos) se escribe en **inglés** para facilitar la colaboración internacional.

- La documentación de diseño, issues y comentarios de alto nivel deben estar en el idioma principal: español (es-ES).
- Mensajes de error de APIs que devuelven al cliente deben usar el **idioma es-ES**.

**Ejemplos:**
```typescript
// ❌ MAL - Nombres en español
const obtenerUsuario = () => { ... }
const lista_de_productos = []

// ✅ BIEN - Nombres en inglés
const getUser = () => { ... }
const productList = []
```

**Verificación:** Revisar naming y comentarios antes de entregar código.

---

## G5 — Calidad de código antes de comprometer cambios
**Prioridad: Alta | Depende de: G3**

Ejecutar linters y typechecks; el proyecto debe compilarse sin errores.

- Resolver advertencias relevantes en el commit que introduce nuevos archivos o dependencias.
- **Incluir ejecución de tests** el proyecto tiene estrategia de pruebas activa.
- En cambios de despliegue Cloudflare, ejecutar `quality_baseline.yml` y `predeploy_gatekeeper.yml` antes de invocar `wrangler`.

**Ejemplos:**
```bash
# ✅ Checklist antes de commit
npm run lint      # Sin errores
npm run typecheck # Sin errores
npm run test      # Si P6 está activo (todos pasan)
```

**Verificación:** El código generado debe pasar linting, typechecking y tests (si aplican) sin errores.

---

## G6 — CORS y seguridad de orígenes
**Prioridad: Media | Aplica a: APIs/Frontend**

Las aplicaciones que sirven a frontends deben respetar CORS; los orígenes permitidos se configuran vía variables de entorno.

- Los encabezados deben aplicarse globalmente y las preflight requests (OPTIONS) respondidas correctamente.

**Ejemplos:**
```typescript
// ✅ BIEN - CORS configurado vía entorno
const allowedOrigins = env.ALLOWED_ORIGINS.split(',');

return new Response(JSON.stringify(data), {
  headers: {
    'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
});
```

**Verificación:** Incluir headers CORS en todas las respuestas HTTP cuando aplique.

---

## G7 — Inclusión de plantillas y código externo
**Prioridad: Media**

Al incorporar repositorios o plantillas externas:

- Eliminar su carpeta `.git` antes de moverlos al proyecto.
- Limpiar cualquier contenido de demostración no necesario.
- Si se está integrando un repo de UI no incluir archivos o componentes que no sean necesarios para el proyecto. Es mejor no copiar y luego si se necesitan añadirlos.
- Asegurarse de que los archivos son tratados como nuevos (untracked) por Git.

**Ejemplos:**
```bash
# ✅ Pasos para integrar plantilla externa
git clone <repo-externo> temporal/
rm -rf temporal/.git
mv temporal/* ./proyecto/
rm -rf temporal/
git add .  # Archivos aparecen como nuevos (untracked)
```

**Verificación:** Validar limpieza antes de integrar código externo.

---

## G8 — Convenciones de commit
**Prioridad: Media | Último paso del flujo**

Cada commit debe tener un identificador (por ejemplo fecha/hora o número de ticket) especificado por el usuario.

- La descripción debe ser detallada y comprensible sin revisar el diff.
- Registrar quién solicitó el commit si es necesario (ej. nombre del cliente/usuario, desarrollo de código o referencia a issue).

**Ejemplos:**
```bash
# ❌ MAL - Muy genérico
git commit -m "fix bug"

# ✅ BIEN - Con identificador y descripción clara
git commit -m "[2025-01-15] Fix: Resolver error 500 en endpoint /api/users
- Causa: Null pointer en validación de email
- Solución: Agregar chequeo previo antes de procesar
- Solicitado por: Issue #142"
```

**Verificación:** Generar mensajes de commit siguiendo este formato.

---

## 📊 Jerarquía de Dependencia

```
G1 (No Asumir) — Primera validación
    │
    ▼
G2 (Hardcoding) ─────────────┐
    │                        ▼
G3 (Secrets) ◄───────────────┘
    │
    ▼
G4 (Idioma) ─────────────┐
    │                    ▼
G5 (Calidad + Tests) ◄───┘
    │
    ▼
G6 (CORS) ─────────────┐
    │                  ▼
G7 (Externos) ◄────────┘
    │
    ▼
G8 (Commits) — Último paso antes de push
```

---

## ✅ Checklist de Validación

| Regla | Verificación | Estado |
|-------|--------------|--------|
| G1 | ¿Se validaron ambigüedades antes de generar? | ☐ |
| G2 | ¿Sin valores hardcodeados? | ☐ |
| G3 | ¿Secrets en almacenamiento seguro? | ☐ |
| G4 | ¿Código en inglés, docs en español? | ☐ |
| G5 | ¿Lint, typecheck y tests sin errores? | ☐ |
| G6 | ¿CORS configurado correctamente? | ☐ |
| G7 | ¿Código externo limpio de .git? | ☐ |
| G8 | ¿Commit con identificador y descripción? | ☐ |

**Checklist adicional para despliegues Cloudflare:**
- ¿Se ejecutó `predeploy_gatekeeper.yml` y su decisión fue `APPROVED` o `APPROVED_WITH_EXCEPTION`?
- ¿La validación se basó en `.github/predeploy_policy.yml` y `.github/inventario_recursos.md`?

---

## ⚠️ Excepciones (Cuándo violar una regla)

| Regla | Excepción Permitida | Condición |
|-------|---------------------|-----------|
| G1 | Prototipos rápidos | Solo en branches `feature/*` con prefijo `[POC]` |
| G5 | Hotfix crítico | Solo si el downtime es mayor al riesgo técnico |
| G8 | Commits de merge | Mensajes automáticos de PR están permitidos |

---

> **Nota:** Este archivo debe mantenerse en la configuración global del repositorio/codespace. Las reglas específicas de proyecto se definen en archivo separado (`copilot-instructions.md`).

> **Última actualización:** 2026-03-04 
> **Versión:** 2.2 (Con integración del agente PreDeploy Gatekeeper)

---
