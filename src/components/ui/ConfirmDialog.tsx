import { Button } from './Button'
import { AlertTriangle, X } from 'lucide-react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onCancel} aria-hidden />
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-slate-200/70 bg-white p-5 shadow-2xl animate-fade-up">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 ring-1 ring-inset ring-red-100">
            <AlertTriangle size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-slate-900">{title}</h3>
            <p className="mt-1.5 text-sm text-slate-600">{message}</p>
          </div>
          <button onClick={onCancel} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"><X size={16} /></button>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onCancel}>{cancelLabel}</Button>
          <Button variant="danger" size="sm" onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  )
}
