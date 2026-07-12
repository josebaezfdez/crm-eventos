import { Badge } from '../ui/Badge'
import type { BudgetStatus } from '../../types'

export function BudgetStatusBadge({ status }: { status: BudgetStatus }) {
  switch (status) {
    case 'draft':
      return <Badge color="slate">Borrador</Badge>
    case 'sent':
      return <Badge color="amber">Enviado</Badge>
    case 'accepted':
      return <Badge color="green">Aprobado</Badge>
    case 'rejected':
      return <Badge color="red">Rechazado</Badge>
    default:
      return <Badge color="slate">{status}</Badge>
  }
}
