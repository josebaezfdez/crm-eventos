interface BarChartProps {
  data: { label: string; income: number; cost: number }[]
}

/** Gráfico de barras ingresos vs costes hecho solo con Tailwind (sin librerías). */
export function IncomeCostChart({ data }: BarChartProps) {
  const max = Math.max(1, ...data.flatMap((d) => [d.income, d.cost]))
  return (
    <div className="w-full">
      <div className="flex h-44 items-end justify-between gap-3">
        {data.map((d) => {
          const incomeH = Math.round((d.income / max) * 100)
          const costH = Math.round((d.cost / max) * 100)
          return (
            <div key={d.label} className="group flex flex-1 flex-col items-center gap-2">
              <div className="relative flex h-36 w-full items-end justify-center gap-1.5">
                {/* tooltip flotante */}
                <div className="pointer-events-none absolute -top-9 z-10 hidden rounded-lg bg-slate-900 px-2.5 py-1.5 text-[11px] font-medium text-white shadow-lg group-hover:block">
                  <span className="text-brand-300">▲ {d.income.toFixed(0)}€</span>
                  <span className="mx-1 text-slate-500">·</span>
                  <span className="text-slate-300">▼ {d.cost.toFixed(0)}€</span>
                </div>
                <div
                  className="w-1/2 max-w-[20px] rounded-t-md bg-gradient-to-t from-brand-600 to-brand-400 transition-all duration-300 group-hover:from-brand-700 group-hover:to-brand-500"
                  style={{ height: `${incomeH}%` }}
                  title={`Ingresos: ${d.income.toFixed(0)} €`}
                />
                <div
                  className="w-1/2 max-w-[20px] rounded-t-md bg-slate-200 transition-all duration-300 group-hover:bg-slate-300"
                  style={{ height: `${costH}%` }}
                  title={`Costes: ${d.cost.toFixed(0)} €`}
                />
              </div>
              <span className="text-[11px] capitalize text-slate-400">{d.label}</span>
            </div>
          )
        })}
      </div>
      <div className="mt-4 flex items-center justify-center gap-5 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-gradient-to-t from-brand-600 to-brand-400" /> Ingresos
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-slate-200" /> Costes
        </span>
      </div>
    </div>
  )
}
