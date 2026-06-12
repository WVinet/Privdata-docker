# BFF: Desajustes de Contrato (Microservicio ↔ BFF ↔ Frontend)

## El problema

El BFF reenvía peticiones a los microservicios usando **`Map<String, Object>`** en lugar de DTOs tipados (ver `AuthClient`, `ArcoClient`, etc.). Esto evita duplicar DTOs, pero significa que el contrato entre las 3 capas —

```
Frontend (api.ts)  →  BFF (Client)  →  Microservicio (Controller/DTO)
```

— **no lo valida el compilador**. Si una capa cambia un nombre de campo, una ruta, o el formato de la respuesta, y la otra capa no se actualiza, no hay error de compilación: el fallo aparece recién en runtime (404, 500, o un `success: undefined` que el frontend interpreta como error genérico).

---

## Bugs encontrados en esta sesión (Arco-service)

Al intentar enviar una "Solicitud de Acceso" desde el portal del titular, aparecía el toast genérico **"No se pudo enviar la solicitud. Intenta nuevamente."** aunque el `INSERT` se ejecutaba correctamente en la base de datos. Causas:

| # | Problema | Capas afectadas |
|---|---|---|
| 1 | `ArcoRequestController` devolvía el DTO "pelado" (`ArcoRequestResponseDTO`), no envuelto en `{success, message, data}` como el resto del proyecto. El frontend chequea `res.data?.success` → `undefined` → siempre falso. | Microservicio |
| 2 | Faltaba el endpoint `GET /api/arco-request/by-subject/{dataSubjectId}`. El BFF y el frontend (`arcoApi.findByDataSubject`) ya lo llamaban → `404 NoResourceFoundException`. | Microservicio |
| 3 | `ArcoRequestResponseDTO` exponía el campo como `dueAt`, pero el frontend (`types/arco.ts`) espera `dueDate` → cálculo de "días restantes" rompía. | Microservicio (este desajuste estaba documentado en `Arco-service/CAMBIOS_RESPONSE_DTO.md`, pero nunca se reflejó en el frontend) |
| 4 | El BFF (`ArcoClient.updateStatus`) llamaba `PATCH /api/arco-request/{id}/status` con body `{status, resolutionSummary}`, pero Arco-service expone `PATCH /api/arco-request/{id}/estado` con `{newStatus, changedByUserId, comment}` → 404 al cambiar estado desde el panel admin. | BFF ↔ Microservicio |

### Fixes aplicados

- `ArcoRequestController`: todos los métodos devuelven `ApiResponseDTO<T>`.
- Se agregó `GET /api/arco-request/by-subject/{dataSubjectId}`.
- `ArcoRequestResponseDTO.dueAt` → `dueDate`.
- `ArcoClient.updateStatus` ahora apunta a `/estado`, mapea `status→newStatus` y `resolutionSummary→comment`, y agrega `changedByUserId` extraído del JWT (`JwtUtil.extractUserId`, nuevo).
- `ArcoRequestService.cambiarEstado` ahora persiste `resolutionSummary` en la entidad cuando el estado pasa a `RESPONDIDA`/`RECHAZADA` (antes solo quedaba en el historial y el titular nunca veía la resolución).

---

## Por qué pasa esto

- El BFF usa `Map<String,Object>` para no duplicar DTOs de cada microservicio → ningún campo está tipado del lado del BFF.
- Los 3 contratos (microservicio, BFF, frontend) se mantienen **manualmente sincronizados**, sin un esquema compartido (no hay OpenAPI ni librería de tipos común).
- Cambios en un microservicio (renombrar un campo, mover una ruta) no generan ningún error visible hasta que se prueba el flujo end-to-end en el navegador.

---

## Criterio a futuro (acordado)

No se va a refactorizar todo el BFF de una vez (5 clients, ~30-40 endpoints, alto riesgo de romper flujos que ya funcionan para bajo beneficio inmediato).

En su lugar:

1. **Todo endpoint nuevo** que el BFF deba mapear (no sea pure passthrough) se implementa con **DTOs tipados** desde el inicio — ej. los flujos de `FLUJO ACCESO` / `FLUJO OPOSICIÓN`.
2. **Endpoints existentes de solo lectura (GET, passthrough)** se mantienen con `Map<String,Object>` — el BFF no los transforma, así que el riesgo de desajuste es menor.
3. Cuando se modifique un endpoint de **escritura** existente por otro motivo (bug o feature), se aprovecha para migrarlo a DTO tipado.

Esto evita que la migración consuma tiempo del proyecto sin agregar funcionalidad visible, mientras reduce gradualmente la superficie de `Map<String,Object>` en los puntos de mayor riesgo.
