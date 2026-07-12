import { type InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, className = '', id, ...rest },
  ref,
) {
  const inputId = id || rest.name
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="label-base">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={`input-base ${error ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : ''} ${className}`}
        {...rest}
      />
      {hint && !error && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
})

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  hint?: string
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { label, hint, className = '', id, ...rest },
  ref,
) {
  const inputId = id || rest.name
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="label-base">
          {label}
        </label>
      )}
      <textarea ref={ref} id={inputId} className={`input-base ${className}`} rows={3} {...rest} />
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  )
})

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  hint?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, className = '', id, children, ...rest },
  ref,
) {
  const inputId = id || rest.name
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="label-base">
          {label}
        </label>
      )}
      <select ref={ref} id={inputId} className={`input-base ${className}`} {...rest}>
        {children}
      </select>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  )
})
