import { Badge } from './Badge'
import { Circle, Check, X, Clock, FileText } from 'lucide-react'
import type { EventStatus, BudgetStatus, PaymentStatus } from '../../types'

const eventStatusMap: Record<EventStatus, { label: string; color: 'slate' | 'brand' | 'green' | 'red' | 'blue'; icon: React.ReactNode }> = {
  draft: { label: 'Borrador', color: 'slate', icon: <Circle size={11} /> },
  quoted: { label: 'Presupuestado', color: 'brand', icon: <FileText size={11} /> },
  accepted: { label: 'Aceptado', color: 'green', icon: <Check size={11} /> },
  rejected: { label: 'Rechazado', color: 'red', icon: <X size={11} /> },
  completed: { label: 'Completado', color: 'blue', icon: <Check size={11} /> },
}

export function EventStatusBadge({ status }: { status: EventStatus }) {
  const s = eventStatusMap[status]
  return <Badge color={s.color}>{s.icon}{s.label}</Badge>
}

const budgetStatusMap: Record<BudgetStatus, { label: string; color: 'slate' | 'brand' | 'green' | 'red'; icon: React.ReactNode }> = {
  draft: { label: 'Borrador', color: 'slate', icon: <Circle size={11} /> },
  sent: { label: 'Enviado', color: 'brand', icon: <FileText size={11} /> },
  accepted: { label: 'Aceptado', color: 'green', icon: <Check size={11} /> },
  rejected: { label: 'Rechazado', color: 'red', icon: <X size={11} /> },
}

export function BudgetStatusBadge({ status }: { status: BudgetStatus }) {
  const s = budgetStatusMap[status]
  return <Badge color={s.color}>{s.icon}{s.label}</Badge>
}

const paymentStatusMap: Record<PaymentStatus, { label: string; color: 'amber' | 'green'; icon: React.ReactNode }> = {
  pending: { label: 'Pendiente', color: 'amber', icon: <Clock size={11} /> },
  paid: { label: 'Pagado', color: 'green', icon: <Check size={11} /> },
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const s = paymentStatusMap[status]
  return <Badge color={s.color}>{s.icon}{s.label}</Badge>
}
