# Onboarding Audit Checklist

## Objetivo
Repetir una auditoría rápida del onboarding sin depender de memoria ni de usuarios manuales.

## Preparación
1. Levanta la app:
```bash
npm start
```
2. Si necesitas rebuild:
```bash
npm run build
```

## Seed + matriz de casos
Ejecuta:
```bash
node scripts/audit-onboarding.mjs
```

Esto crea o resetea usuarios de auditoría y devuelve:
- email
- password
- estado esperado (`document`, `personal`, `bank`, `terms`, `complete`)
- flags persistidos (`hasIdDocument`, `hasProfile`, `hasBankAccount`, `termsAccepted`)

## Validación HTTP local
Con la app corriendo:
```bash
ONBOARDING_AUDIT_HTTP=1 node scripts/audit-onboarding.mjs
```

Esto además intenta validar:
- login
- `resolvedStep` de `/onboarding`
- bloqueo de `/dashboard` cuando el onboarding está incompleto
- bloqueo de `/treasury/new-movement` cuando el onboarding está incompleto

## Checklist manual corta
- Usuario nuevo: `/onboarding` debe resolver a `document`.
- Documento cargado sin teléfono: debe resolver a `personal`.
- Perfil completo sin banco: debe resolver a `bank`.
- Banco completo sin términos: debe resolver a `terms`.
- Completo: `/dashboard` debe cargar y `/onboarding` debe redirigir a dashboard.
- Incompleto: `/treasury/new-movement` debe redirigir a `/onboarding`.
- `/api/onboarding/profile` debe persistir `birthDate`, `nationality` y `documentSerial`.
- `/api/onboarding/personal` no debe romper por `create` duplicado ni saltarse auth.
- `/onboarding/profile` no debe mostrar la UI demo antigua.
- Las rutas `/onboarding/*` directas deben revisarse si siguen expuestas públicamente.
- `/api/onboarding/ocr` debe responder `410` y dejar claro que no es obligatorio.

## Dependencias externas a vigilar
- Postgres/Supabase: sin DB no hay guard ni estados.
- Supabase Storage bucket `kyc`: upload y signed URL.
- OCR server-side: hoy está deprecado; si vuelve, debe reintroducirse como capacidad opcional.
- Comprobantes de depósito: evitar pruebas que disparen WhatsApp real si no hay entorno aislado.
