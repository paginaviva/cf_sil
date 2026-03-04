# Evaluación de Arquitectura — Runtime Config Service for Cloudflare (RCSCF)

**Fecha de elaboración:** 2026-03-04  
**Elaborado por:** AGTO (Arquitecto Agente Orquestador)  
**Fuente analizada:** `doc_referencia/RCSCF Runtime Config Service for Cloudflare/`  
**Documentos revisados:** PRD · ADD · PdT  

---

## 1. Comprensión adquirida

### 1.1 Propósito del sistema

El RCSCF es una **capa de configuración dinámica en tiempo de ejecución** para aplicaciones desplegadas en Cloudflare. Resuelve un problema central: permitir que usuarios autorizados modifiquen valores funcionales de la aplicación **sin redeploy**, mientras los servicios consumen dichos valores en tiempo real desde Workers, Pages Functions y Workflows.

El sistema no reemplaza a `Environment Variables` ni a `Secrets`. Se posiciona en un espacio diferente: valores de negocio editables, no sensibles, que deben cambiar en operación sin tocar el ciclo de despliegue.

---

### 1.2 Documentos y su rol

| Documento | Tipo | Propósito |
|---|---|---|
| **PRD** | Product Requirements Document | Define el problema, los actores, los objetivos funcionales y no funcionales, las reglas de negocio y los criterios de aceptación del producto |
| **ADD** | Architecture Design Document | Traduce el PRD en una solución técnica concreta: componentes, modelo de datos, contratos de interfaz, flujos operativos, estrategia de caché y seguridad |
| **PdT** | Plan de Trabajo | Organiza la implementación en 13 fases (0–12), define hitos, dependencias, riesgos de ejecución y reparto de responsabilidades |

---

### 1.3 Separación de configuración en tres capas

El diseño establece explícitamente tres tipos de configuración con almacenamiento diferente:

| Capa | Almacén | Editable sin redeploy | Sensible | Interfaz admin |
|---|---|---|---|---|
| **Runtime editable config** | `Cloudflare D1` | ✅ | ❌ | ✅ |
| **Sensitive config** | `Secrets` / `Secrets Store` | ❌ | ✅ | ❌ |
| **Deployment config** | `wrangler.toml` / env vars | ❌ | No aplica | ❌ |

---

### 1.4 Actores del sistema

| Actor | Capacidades |
|---|---|
| **Technical Admin** | Estructura, migraciones, bindings, secretos |
| **Application Admin** | Edita claves permitidas, fuerza refresh, consulta auditoría |
| **Read-only Admin** | Solo consulta y auditoría |
| **Runtime Service** | Solo lectura; escritura prohibida salvo casos de sistema |
| **AI Agents** | Generan código, validan cumplimiento, no alteran requisitos sin aprobación humana |

---

### 1.5 Componentes principales (ADD)

```
┌─────────────────────────────────────────────────────────────┐
│                         Admin UI                            │
│                (Cloudflare Pages — interfaz web)            │
└────────────────────────────┬────────────────────────────────┘
                             │ Service Binding
┌────────────────────────────▼────────────────────────────────┐
│                      Config API Worker                       │
│  validación · autorización · auditoría · caché · versión    │
└─────────────┬──────────────────────────┬────────────────────┘
              │ D1 Binding               │ Service Bindings
┌─────────────▼────────────┐  ┌──────────▼──────────────────┐
│      Config Store (D1)   │  │    Runtime Consumers         │
│  config_entries          │  │  Workers · Pages Functions   │
│  config_namespaces       │  │  Workflows                   │
│  config_audit_log        │  └─────────────────────────────┘
│  config_runtime_state    │
└──────────────────────────┘
              │
┌─────────────▼────────────┐
│      Secrets Layer       │
│  Secrets / Secrets Store │
└──────────────────────────┘
```

---

### 1.6 Modelo de datos (4 tablas)

| Tabla | Función |
|---|---|
| `config_entries` | Catálogo de claves con valor, tipo, versión, estado y metadatos |
| `config_namespaces` | Agrupación funcional de claves; controla visibilidad y edición |
| `config_audit_log` | Registro inmutable de cada operación de escritura |
| `config_runtime_state` | Estado global para control de coherencia de caché (`global_config_version`, `cache_reset_token`) |

---

### 1.7 Estrategia de caché

La coherencia no se basa en tiempo, sino en **versión global**. Cada consumidor mantiene localmente:

- `localGlobalVersion`
- `localBootstrapVersion`
- `localCacheResetToken`

Antes de usar entradas cacheadas, compara con los valores globales en `D1`. Si difieren, invalida y recarga. La propagación es **pull on next check** — no hay señales push entre servicios.

Tres políticas definidas: `strict`, `balanced` (recomendada general), `aggressive` (solo para presentación visual no crítica).

---

### 1.8 Plan de trabajo (PdT) — resumen de fases

| Fase | Nombre | Entregable clave |
|---|---|---|
| 0 | Prerequisitos | Entornos, cuentas, repositorios listos |
| 1 | Decisiones de diseño | Modelo de datos cerrado, contratos aprobados |
| 2 | Base de datos | Migraciones D1 aplicadas |
| 3 | Config API Worker | CRUD de configuración funcional |
| 4 | Bootstrap y lectura pública | Endpoint de bootstrap operativo |
| 5 | Caché y control de versión | Caché local + invalidación activa |
| 6 | Auditoría y observabilidad | Tabla `config_audit_log` activa |
| 7 | Admin UI | Interfaz de gestión completa |
| 8 | Integración consumidores | Workers, Pages, Workflows conectados |
| 9 | Seguridad y endurecimiento | Revisión de permisos, separación real de datos |
| 10 | Pruebas | Suite completa (unit, integración, seguridad, operativa) |
| 11 | Despliegue controlado | Producción con consumidores principales |
| 12 | Operación y evolución | Mantenimiento, rotación, backlog de mejoras |

**Orden de ejecución recomendado:** 0 → 1 → 2 → 3 → 4 → 5 → 6 → 10 (parcial) → 7 → 8 → 9 → 10 (completo) → 11 → 12

---

## 2. Tabla de pros y contras

### 2.1 Del sistema RCSCF como producto

| # | Aspecto | Pros | Contras |
|---|---|---|---|
| 1 | **Desacoplamiento del redeploy** | Permite cambios operativos en configuración sin tocar el pipeline de CI/CD | Introduce dependencia en tiempo de ejecución: si D1 tiene latencia o falla, los consumidores se ven afectados |
| 2 | **Centralización de escritura** | Una sola fuente de lógica SQL y de validación; evita duplicación entre servicios | El `Config API Worker` se convierte en punto único de fallo para escrituras |
| 3 | **Separación de capas** | Distinción clara entre datos editables, sensibles y de despliegue; reduce riesgo de mezcla | Requiere disciplina organizacional sostenida para no mezclar tipos de clave a lo largo del tiempo |
| 4 | **Service Bindings como canal interno** | Comunicación sin IP pública, bajo latencia, nativa en Cloudflare | Añade dependencia de binding entre proyectos; un cambio de nombre o configuración puede romper el contrato |
| 5 | **Caché por versión** | Control fino sin depender de TTL arbitrario; convergencia determinista | Requiere que cada consumidor implemente correctamente la comparación de versión; errores en este mecanismo generan inconsistencias silenciosas |
| 6 | **Auditoría integrada** | Trazabilidad completa de cambios, actor y resultado en tabla separada | Crece indefinidamente; requiere política de retención y limpieza |
| 7 | **Bootstrap público** | Permite hidratación inicial de la UI server-side sin peticiones adicionales del cliente | La lista de claves públicas debe gestionarse activamente; claves marcadas `is_public` por error exponen información interna |
| 8 | **D1 como fuente de verdad** | Base SQL gestionada por Cloudflare, con acceso nativo desde Workers y Pages | D1 tiene límites de escritura concurrente (serverless SQL); cargas de escritura alta o picos de invalidación podrían generar presión |

---

### 2.2 De los documentos como especificación

| Aspecto | Pros | Contras / Gaps |
|---|---|---|
| **Completitud del ADD** | Cubre componentes, contratos, flujos, caché, seguridad, modelo de datos, provisión, migraciones y criterios de aceptación en un solo documento | El ADD resuelve preguntas abiertas que el PRD dejó pendientes, pero algunas cuestiones (ej. edición masiva, distribución de caché) quedan deferidas a fases posteriores |
| **PRD bien delimitado** | Define claramente los no-objetivos, las restricciones técnicas y las decisiones ya fijadas | La sección de "cuestiones abiertas" (§20) lista 7 puntos sin cerrar, lo que puede generar ambigüedad al inicio de la implementación |
| **PdT estructurado** | Dependencias entre fases explícitas, orden recomendado justificado, riesgos de ejecución identificados | Sin estimaciones de esfuerzo ni duración por fase; no define métricas de progreso objetivas por hito |
| **Trazabilidad cruzada** | Los tres documentos son coherentes entre sí; el ADD responde explícitamente las preguntas abiertas del PRD | No hay una matriz de trazabilidad formal PRD → ADD → PdT que facilite verificar cobertura automáticamente |

---

## 3. Evaluación de la arquitectura propuesta

### 3.1 Solidez del diseño

**Resultado: Sólido con condicionantes de implementación.**

La arquitectura respeta los principios fundamentales de la plataforma Cloudflare:

- Usa D1 en su función natural (almacén SQL serverless enlazado a Workers).
- Usa Service Bindings como canal interno sin exposición pública.
- Usa Secrets para datos sensibles, sin mezclarlos con el almacén editable.
- Usa WorkerEntrypoint para exponer métodos RPC internos.
- Reconoce el modelo de idempotencia requerido por Workflows.

Cada decisión tiene respaldo en documentación oficial de Cloudflare (referencias incluidas en el ADD).

---

### 3.2 Evaluación por dimensión

#### Separación de responsabilidades
**Calificación: Alta**

La división Admin UI → Config API Worker → Config Store → Consumers es limpia. El repositorio (`ConfigRepository`) encapsula todo el SQL. El servicio (`ConfigService`) concentra reglas de negocio. Los consumidores no tienen visibilidad de la capa de datos.

#### Escalabilidad
**Calificación: Media-Alta**

La caché local por versión reduce la presión sobre D1 de forma efectiva. La arquitectura no tiene estado compartido entre instancias de un mismo Worker. El modelo pull-on-next-check es simple y predecible. El riesgo es la acumulación de escrituras concurrentes en D1 en escenarios de alta actividad administrativa.

#### Seguridad
**Calificación: Alta (en diseño)**

Las 4 reglas de seguridad del ADD (§10.1) son correctas y completas:
- Ningún secreto en D1.
- Ningún secreto devuelto a la UI.
- Ninguna clave no editable modificable desde interfaz.
- Ninguna clave reservada alterable sin canal técnico.

El riesgo reside en la implementación: la correcta aplicación de roles y la separación `is_public` / `is_sensitive` requieren disciplina en siembra y alta de claves.

#### Observabilidad
**Calificación: Media**

La tabla `config_audit_log` cubre trazabilidad de escrituras. Sin embargo, el ADD no define un mecanismo de alertas activas ni integración con una plataforma de logging externa. La observabilidad es reactiva (consulta de tabla), no proactiva (alertas en tiempo real).

#### Mantenibilidad
**Calificación: Alta**

El modelo de migraciones mediante `wrangler d1 migrations` es el estándar de la plataforma. El versionado lógico de claves (`version >= 1`) permite evolución sin borrado físico. La arquitectura en fases del PdT facilita entregas incrementales verificables.

#### Consistencia eventual
**Calificación: Adecuada para el caso de uso**

El modelo pull-on-next-check es correcto para configuración de aplicación (no para datos transaccionales). La ventana de inconsistencia es finita y controlable mediante `cache_reset_token`. Es una decisión de diseño consciente y documentada, no una limitación ignorada.

---

### 3.3 Riesgos arquitectónicos no mitigados o con mitigación débil

| Riesgo | Severidad | Estado en documentación |
|---|---|---|
| Config API Worker como punto único de fallo para escrituras | Alta | Mencionado implícitamente; no hay estrategia de fallback documentada |
| Crecimiento sin límite de `config_audit_log` | Media | Mencionado como recomendación; sin política de retención definida |
| Correcta implementación de comparación de versión en cada consumidor | Media | Documentada la mecánica; no hay contrato de test obligatorio por consumidor |
| Exposición involuntaria de claves `is_public` | Media | Regla definida en PRD §14; sin mecanismo de revisión periódica automatizada |
| Latencia de D1 en lecturas sin caché en rutas de alto tráfico | Media | Mitigado con caché; sin SLA ni umbral de latencia definido |

---

### 3.4 Alineación con reglas globales del proyecto (G1–G8)

| Regla | Evaluación en RCSCF |
|---|---|
| **G1** — No asumir | ✅ ADD y PRD no asumen valores; definen bindings por nombre (`CONFIG_DB`, `DB_ENDES` como convención) pendientes de confirmación |
| **G2** — Cero hardcoding | ✅ Diseño explícitamente prohíbe hardcoding en §14.2 del ADD |
| **G3** — Secrets seguros | ✅ Separación D1 / Secrets es el principio central del sistema |
| **G4** — Idioma código / español docs | ✅ Contratos y modelos en inglés; documentación en español |
| **G5** — Calidad antes de commit | ⚠️ El PdT incluye Fase 10 de pruebas, pero no referencia explícitamente `quality_baseline.yml` ni el Gatekeeper del repositorio |
| **G6** — CORS | ⚠️ El ADD define CORS vía `ALLOWED_ORIGINS` pero `CF-CORS-001` sigue en estado `pending` en el inventario; debe resolverse antes de desplegar Admin UI o Config API |
| **G7** — Código externo | No aplica directamente a este diseño |
| **G8** — Commits con identificador | No evaluable desde documentos de diseño; aplica en ejecución |

---

### 3.5 Conclusión de evaluación

El RCSCF es una especificación arquitectónica **completa, coherente y bien fundamentada** para el contexto de Cloudflare. Las tres capas de configuración están claramente delimitadas, los contratos están definidos antes del código, y el plan de trabajo está ordenado para minimizar retrabajo.

**Fortaleza principal:** el diseño no inventa abstracciones propias; usa los primitivos de la plataforma (D1, Service Bindings, WorkerEntrypoint, Secrets) en las funciones para las que fueron diseñados.

**Condicionante principal de éxito:** la correcta implementación de la caché por versión en cada consumidor y la disciplina para no mezclar tipos de clave en D1. Ambos aspectos requieren validación activa en la Fase 9 (seguridad) y en la suite de pruebas de la Fase 10.

**Prerequisito antes de cualquier despliegue:** resolver `CF-CORS-001` (dominios `ALLOWED_ORIGINS`) en el inventario de recursos para que el Gatekeeper pueda emitir decisión `APPROVED` sobre despliegues de Worker y Pages.

---

*Informe generado como contexto fundamental para sprints de implementación del RCSCF. No modifica código ni recursos existentes.*
