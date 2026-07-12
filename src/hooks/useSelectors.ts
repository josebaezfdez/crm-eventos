// Hooks de selección / datos derivados para no repetir lógica en las páginas.

import { useMemo } from 'react'
import { useStore } from '../store/useStore'
import { currentMonthKey, monthKey } from '../utils/format'
import { averageMargin } from '../utils/marginCalculator'
import type { DashboardMetrics, Event, Budget } from '../types'

export function useClient(id?: string) {
  const clients = useStore((s) => s.clients)
  return useMemo(() => clients.find((c) => c.id === id), [clients, id])
}

export function useEvent(id?: string) {
  const events = useStore((s) => s.events)
  return useMemo(() => events.find((e) => e.id === id), [events, id])
}

export function useBudget(id?: string) {
  const budgets = useStore((s) => s.budgets)
  return useMemo(() => budgets.find((b) => b.id === id), [budgets, id])
}

export function useBudgetForEvent(eventId?: string) {
  const budgets = useStore((s) => s.budgets)
  return useMemo(
    () => (eventId ? budgets.find((b) => b.eventId === eventId) : undefined),
    [budgets, eventId],
  )
}

export function useEventsForClient(clientId?: string) {
  const events = useStore((s) => s.events)
  return useMemo(
    () => (clientId ? events.filter((e) => e.clientId === clientId) : []),
    [events, clientId],
  )
}

export function usePaymentsForEvent(eventId?: string) {
  const payments = useStore((s) => s.payments)
  return useMemo(
    () => (eventId ? payments.filter((p) => p.eventId === eventId) : []),
    [payments, eventId],
  )
}

export function usePostEventResult(eventId?: string) {
  const results = useStore((s) => s.postEventResults)
  return useMemo(
    () => (eventId ? results.find((r) => r.eventId === eventId) : undefined),
    [results, eventId],
  )
}

export function useEventWithBudget(eventId?: string): { event?: Event; budget?: Budget } {
  const event = useEvent(eventId)
  const budget = useBudget(event?.acceptedBudgetId ?? undefined)
  return { event, budget }
}

// Devuelve, para cada evento con presupuesto, una fila con margen y precio.
export function useEventMarginRows() {
  const events = useStore((s) => s.events)
  const budgets = useStore((s) => s.budgets)
  const clients = useStore((s) => s.clients)
  return useMemo(() => {
    return events.map((ev) => {
      const budget = budgets.find((b) => b.id === ev.acceptedBudgetId)
      const client = clients.find((c) => c.id === ev.clientId)
      return {
        event: ev,
        budget,
        client,
        offered: budget?.offeredPriceWithVAT ?? 0,
        totalCost: budget?.totalCost ?? 0,
        margin: budget?.expectedMarginPercentage ?? 0,
      }
    })
  }, [events, budgets, clients])
}

export function useDashboardMetrics(): DashboardMetrics & {
  mostProfitable: { eventId: string; name: string; margin: number; offered: number }[]
  leastProfitable: { eventId: string; name: string; margin: number; offered: number }[]
  upcoming: Event[]
  monthlySeries: { label: string; income: number; cost: number }[]
} {
  const events = useStore((s) => s.events)
  const budgets = useStore((s) => s.budgets)
  const payments = useStore((s) => s.payments)
  const clients = useStore((s) => s.clients)

  return useMemo(() => {
    const cm = currentMonthKey()
    const monthEvents = events.filter((e) => monthKey(e.date) === cm)
    const monthAccepted = monthEvents.filter(
      (e) => e.status === 'accepted' || e.status === 'completed',
    )

    const eventBudget = (ev: Event) => budgets.find((b) => b.id === ev.acceptedBudgetId)

    const estimatedBillingMonth = monthAccepted.reduce(
      (acc, e) => acc + (eventBudget(e)?.offeredPriceWithVAT ?? 0),
      0,
    )
    const estimatedProfitMonth = monthAccepted.reduce(
      (acc, e) => acc + (eventBudget(e)?.expectedProfit ?? 0),
      0,
    )

    const acceptedBudgets = budgets.filter((b) => b.status === 'accepted')
    const margins = acceptedBudgets.map((b) => b.expectedMarginPercentage)
    const avg = averageMargin(margins)

    const confirmedEvents = events.filter(
      (e) => e.status === 'accepted' || e.status === 'completed',
    ).length

    const pendingBudgets = budgets.filter((b) => b.status === 'sent' || b.status === 'draft').length
    const acceptedBudgetsCount = budgets.filter((b) => b.status === 'accepted').length
    const pendingMoney = payments
      .filter((p) => p.status === 'pending')
      .reduce((acc, p) => acc + p.amount, 0)

    const rows = events
      .map((e) => {
        const b = eventBudget(e)
        return {
          eventId: e.id,
          name: e.name,
          client: clients.find((c) => c.id === e.clientId)?.name ?? '—',
          margin: b?.expectedMarginPercentage ?? 0,
          offered: b?.offeredPriceWithVAT ?? 0,
        }
      })
      .filter((r) => r.offered > 0)

    const sortedDesc = [...rows].sort((a, b) => b.margin - a.margin)
    const mostProfitable = sortedDesc.slice(0, 3)
    const leastProfitable = [...sortedDesc].reverse().slice(0, 3)

    const today = new Date()
    const upcoming = events
      .filter((e) => new Date(e.date) >= today && e.status !== 'rejected')
      .sort((a, b) => +new Date(a.date) - +new Date(b.date))
      .slice(0, 5)

    // Serie de 6 meses: ingresos vs costes
    const monthlySeries: { label: string; income: number; cost: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const monthEvs = events.filter((e) => monthKey(e.date) === key)
      const accepted = monthEvs.filter((e) => e.status === 'accepted' || e.status === 'completed')
      const income = accepted.reduce((acc, e) => acc + (eventBudget(e)?.offeredPriceWithVAT ?? 0), 0)
      const cost = accepted.reduce((acc, e) => acc + (eventBudget(e)?.totalCost ?? 0), 0)
      monthlySeries.push({
        label: d.toLocaleDateString('es-ES', { month: 'short' }).replace('.', ''),
        income,
        cost,
      })
    }

    return {
      estimatedBillingMonth,
      estimatedProfitMonth,
      averageMargin: avg,
      confirmedEvents,
      pendingBudgets,
      acceptedBudgets: acceptedBudgetsCount,
      pendingMoney,
      mostProfitable,
      leastProfitable,
      upcoming,
      monthlySeries,
    }
  }, [events, budgets, payments, clients])
}
