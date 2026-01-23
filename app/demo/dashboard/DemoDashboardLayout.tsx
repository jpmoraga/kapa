"use client";


export default function DemoDashboardLayout({
  balances,
  movements,
  onboarding,
  isAdmin,
}: {
  balances: any;
  movements: any[];
  onboarding: any;
  isAdmin: boolean;
}) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* IZQUIERDA: ACCIÓN */}
      <section className="lg:col-span-2 space-y-6">
        {/* CLP — ACCIÓN PRINCIPAL */}
        <div className="k21-card p-6">
          <p className="text-sm text-neutral-400">Saldo en pesos</p>
          <div className="mt-2 text-3xl font-semibold">
            ${Number(balances.CLP).toLocaleString("es-CL")}
          </div>

          <p className="mt-1 text-xs text-neutral-500">
            Disponible para operar
          </p>

          <div className="mt-4 flex gap-3">
            <button className="k21-btn-primary">
              Depositar
            </button>
            <button className="rounded-xl border border-neutral-700 px-4 py-2 text-sm">
              Retirar
            </button>
          </div>
        </div>

        {/* BTC */}
        <div className="k21-card p-6">
          <p className="text-sm text-neutral-400">Bitcoin</p>
          <div className="mt-2 text-2xl font-semibold">
            {balances.BTC} BTC
          </div>

          <div className="mt-4 flex gap-3">
            <button className="k21-btn-primary">
              Comprar
            </button>
            <button className="k21-btn-secondary">
              Vender
            </button>
          </div>
        </div>

        {/* USD */}
        <div className="k21-card p-6">
          <p className="text-sm text-neutral-400">Dólares</p>
          <div className="mt-2 text-2xl font-semibold">
            ${balances.USD}
          </div>

          <div className="mt-4 flex gap-3">
            <button className="k21-btn-secondary">
              Comprar
            </button>
            <button className="k21-btn-secondary">
              Vender
            </button>
          </div>
        </div>
      </section>

      {/* DERECHA: CONTEXTO */}
      <aside className="space-y-6">
        {/* VALOR TOTAL */}
        <div className="k21-card p-6">
          <p className="text-sm text-neutral-400">Valor total</p>
          <div className="mt-2 text-3xl font-semibold">
            $14.500.000
          </div>

          <div className="mt-3 flex gap-2">
            <button className="k21-toggle">CLP</button>
            <button className="k21-toggle">USD</button>
            <button className="k21-toggle">BTC</button>
          </div>
        </div>

        {/* GRÁFICO BTC (placeholder) */}
        <div className="k21-card p-6 h-48 flex items-center justify-center text-neutral-500">
          Gráfico Bitcoin (demo)
        </div>

        {/* MOVIMIENTOS */}
        <div className="k21-card p-6">
          <p className="text-sm text-neutral-400 mb-3">
            Últimos movimientos
          </p>

          <ul className="space-y-2 text-sm">
            {movements.slice(0, 5).map((m) => (
              <li key={m.id} className="flex justify-between">
                <span>{m.note}</span>
                <span className="text-neutral-500">{m.amount}</span>
              </li>
            ))}
          </ul>

          <button className="mt-4 text-xs text-neutral-400 underline">
            Ver todos
          </button>
        </div>
      </aside>
    </div>
  );
}