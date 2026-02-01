# Runbook local: depósitos CLP + aprobaciones manuales

## Requisitos
- `.env.local` con variables de entorno (ver `.env.example`).
- `FEATURE_WHATSAPP_APPROVAL=true` si quieres aprobar por WhatsApp.
- `AUTO_APPROVE_DEPOSITS=false` (default recomendado).
- `AUTO_APPROVE_MAX_CLP=0` (default recomendado).
- `STRICT_SYSTEM_WALLET=true` (default recomendado).

## Setup
1) Migraciones:
```
npx prisma migrate dev
```

2) Levantar app:
```
npm run dev
```

## Twilio (sandbox local)
1) En WhatsApp, enviar `join <keyword>` al número sandbox de Twilio.
2) Configurar webhook:
   - Usa ngrok: `ngrok http 3000`
   - Configura Twilio webhook a:
     `https://<ngrok>.ngrok.io/api/webhooks/twilio/whatsapp`
3) Env en `.env.local`:
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_WHATSAPP_FROM` (sandbox)
   - `WHATSAPP_ADMIN_ALLOWLIST=+56...`
   - `FEATURE_WHATSAPP_APPROVAL=true`

## Flujo esperado (depósito CLP)
1) Crear depósito con comprobante.
2) Se crea `TreasuryMovement` en **PENDING** y **NO** se actualiza el balance CLP.
3) Llega WhatsApp “Depósito pendiente” con comando `aprobar <slipId>`.
4) Responder `aprobar <slipId> 2000`.
5) El movimiento pasa a **APPROVED** y el balance CLP aumenta.

## Admin endpoints (manual)
- Aprobar:
```
POST /api/admin/movements/<movementId>/approve
```
Body opcional:
```
{ "amountClp": 2000 }
```

- Rechazar:
```
POST /api/admin/movements/<movementId>/reject
```

## Verificación rápida
1) `TreasuryMovement` creado en PENDING.
2) `TreasuryAccount` CLP sin cambios antes de aprobar.
3) `TreasuryAccount` CLP incrementa luego de aprobar.
4) `TreasuryMovement` en APPROVED/REJECTED con `executedSource=manual-*`.
