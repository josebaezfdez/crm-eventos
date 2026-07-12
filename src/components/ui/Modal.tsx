import { type ReactNode, useEffect } from 'react'
import { Button } from './Button'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

const sizeClass = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: ModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        className={`relative z-10 w-full ${sizeClass[size]} max-h-[90vh] overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-xl animate-fade-up`}
      >
        {(title || description) && (
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-4">
            <div>
              {title && <h3 className="text-base font-semibold tracking-tight text-slate-900">{title}</h3>}
              {description && <p className="mt-1 text-xs text-slate-500">{description}</p>}
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} aria-label="Cerrar">
              <X size={16} />
            </Button>
          </div>
        )}
        <div className="p-4">{children}</div>
        {footer && (
          <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/90 px-4 py-3 backdrop-blur">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
