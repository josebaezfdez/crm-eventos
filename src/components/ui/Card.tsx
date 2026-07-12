import { type HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padded?: boolean
  hover?: boolean
}

export function Card({ padded = true, hover = false, className = '', children, ...rest }: CardProps) {
  return (
    <div className={`card ${hover ? 'card-hover' : ''} ${padded ? 'p-4' : ''} ${className}`} {...rest}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <h3 className={`text-[15px] font-semibold tracking-tight text-slate-900 ${className}`}>{children}</h3>
}

export function CardSubtitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <p className={`text-[13px] text-slate-500 ${className}`}>{children}</p>
}
