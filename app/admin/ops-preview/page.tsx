import AdminOpsClient, { type MovementRow } from "../(protected)/ops/AdminOpsClient";

const mockRows: MovementRow[] = [
  {
    id: "slip-preview-1",
    source: "deposit_slip",
    movementId: null,
    slipId: "slip-preview-1",
    slipStatus: "received",
    ocrStatus: "pending_manual",
    declaredAmountClp: "250000",
    parsedAmountClp: null,
    bankHint: "Banco de Chile",
    slipPath: "user/mock/deposit-slip-1700000000000.pdf",
    status: "PENDING",
    assetCode: "CLP",
    type: "deposit",
    amount: "250000",
    note: "Comprobante recibido",
    createdAt: "2026-02-03T12:10:00.000Z",
    createdByUserId: "user-preview-1",
    createdByEmail: "cliente@cava.cl",
    companyId: null,
    companyName: "Empresa Demo",
    attachmentUrl: "user/mock/deposit-slip-1700000000000.pdf",
    internalReason: null,
    internalState: null,
  },
  {
    id: "mov-preview-1",
    source: "movement",
    movementId: "mov-preview-1",
    slipId: "slip-preview-2",
    slipStatus: "received",
    ocrStatus: "received",
    declaredAmountClp: "120000",
    parsedAmountClp: "120000",
    bankHint: "Santander",
    slipPath: "user/mock/deposit-slip-1700000000001.pdf",
    status: "PENDING",
    assetCode: "CLP",
    type: "deposit",
    amount: "120000",
    note: "Depósito CLP con comprobante",
    createdAt: "2026-02-03T11:40:00.000Z",
    createdByUserId: "user-preview-2",
    createdByEmail: "ops@cava.cl",
    companyId: "company-preview-1",
    companyName: "Holding Demo",
    attachmentUrl: "user/mock/deposit-slip-1700000000001.pdf",
    internalReason: null,
    internalState: null,
  },
  {
    id: "mov-preview-2",
    source: "movement",
    movementId: "mov-preview-2",
    status: "PROCESSING",
    assetCode: "CLP",
    type: "withdraw",
    amount: "500000",
    note: "Retiro manual pendiente",
    createdAt: "2026-02-03T10:15:00.000Z",
    createdByUserId: "user-preview-3",
    createdByEmail: "tesoreria@cava.cl",
    companyId: "company-preview-2",
    companyName: "Operaciones SpA",
    attachmentUrl: null,
    internalReason: null,
    internalState: null,
  },
  {
    id: "mov-preview-3",
    source: "movement",
    movementId: "mov-preview-3",
    status: "PENDING",
    assetCode: "BTC",
    type: "deposit",
    amount: "0.18",
    note: "Compra BTC en espera",
    createdAt: "2026-02-03T09:05:00.000Z",
    createdByUserId: "user-preview-4",
    createdByEmail: "trading@cava.cl",
    companyId: "company-preview-3",
    companyName: "Crypto Desk",
    attachmentUrl: null,
    internalReason: "INSUFFICIENT_LIQUIDITY",
    internalState: "WAITING_LIQUIDITY",
  },
];

export default function AdminOpsPreviewPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="mx-auto max-w-6xl px-6 pt-6">
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          ADMIN OPS PREVIEW (NO AUTH)
        </div>
      </div>
      <AdminOpsClient initialRows={mockRows} disableAutoFetch initialStatusFilter="ALL" />
    </div>
  );
}
