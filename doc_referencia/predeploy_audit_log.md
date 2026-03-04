# PreDeploy Gatekeeper Audit Log

Registro auditable de validaciones predespliegue coordinadas por AGTO.

## Esquema de registro

| timestamp_utc | requested_by | target_type | command | decision | blocking_reasons | required_actions | evidence |
|---|---|---|---|---|---|---|---|

## Entradas

| timestamp_utc | requested_by | target_type | command | decision | blocking_reasons | required_actions | evidence |
|---|---|---|---|---|---|---|---|
| 2026-03-04T00:00:00Z | AGTO | worker/pages/infra | `N/A` | `APPROVED` | `[]` | `[]` | `["Implantacion inicial de politica y gatekeeper completada"]` |

## Validación de paridad funcional (A9)

Cobertura migrada desde la instrucción predespliegue previa:

| Regla previa | Cobertura actual |
|---|---|
| Revisar bloqueantes antes de desplegar | `predeploy_gatekeeper.yml` + `.github/predeploy_policy.yml` |
| Validar inventario como fuente de estado | `.github/predeploy_policy.yml` (`source_of_truth.inventory_file`) |
| Bloquear si hay pendientes críticos | `decision=BLOCKED` en gatekeeper |
| Requisitos por tipo de despliegue | `readiness_by_target` + `required_inventory_ids` |
| CORS antes de worker/pages | `value_rules.cors` |
| D1 real para `d1 migrations apply` | `value_rules.d1` + allowlist infra |
| Registro de trazabilidad | `predeploy_decision.json` + este audit log |

Resultado de paridad:
1. Paridad funcional validada.
2. Se habilita retiro de `INSTRUCCION_PRE_DESPLIEGUE.md` (A9).
| 2026-03-04T12:00:00Z | AGTO | infra | wrangler d1 create db_endes | APPROVED | [] | [] | ["Validación de inventario y política OK"] |
| 2026-03-04T12:25:00Z | AGTO | infra | d1 create db_endes | APPROVED_WITH_EXCEPTION | ["d1 create db_endes fuera de allowlist (corregido)", "CF-DEC-001 pending", "CF-D1-001 pending", "wrangler.toml ausente"] | ["Ampliar allowlist allowlist con d1 create db_endes", "Resolver CF-DEC-001 post-creacion", "Registrar database_id en inventario"] | ["Hotfix exception approved by user; expires 2026-03-05T11:00:00Z; Primera prueba Wrangler/D1; allowlist ampliado por AGTO"] |
| 2026-03-04T12:27:36Z | AGTO | infra | d1 create db_endes | APPROVED (resultado final) | [] | [] | ["D1 db_endes creada exitosamente; database_id=a964b55b-6a50-47cc-87bf-42645b6cb0a3; region=WNAM; run #22669307529; CF-D1-001 marcado resolved en inventario"] |
