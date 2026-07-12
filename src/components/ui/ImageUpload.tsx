import { useState, useRef } from 'react'
import { Upload, X, Loader2 } from 'lucide-react'

interface ImageUploadProps {
  label: string
  description?: string
  value: string
  onChange: (url: string) => void
  uploadUrl: string
  token: string
}

export function ImageUpload({ label, description, value, onChange, uploadUrl, token }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Solo se permiten imágenes (PNG/JPG)')
      return
    }
    setError('')
    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (!res.ok) throw new Error('Error al subir la imagen')
      
      const data = await res.json()
      if (data.url) {
        // La API devuelve la ruta relativa /api/assets/key
        // Necesitamos la URL completa en PROD, así que usamos la misma base
        const baseUrl = new URL(uploadUrl).origin
        onChange(baseUrl + data.url)
      }
    } catch (err: any) {
      setError(err.message || 'Error desconocido al subir')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleUpload(file)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleUpload(file)
  }

  return (
    <div className="flex flex-col">
      <label className="block text-[13px] font-medium text-slate-700 mb-1">{label}</label>
      {description && <p className="text-xs text-slate-500 mb-3">{description}</p>}
      
      {error && <p className="text-xs font-medium text-red-600 mb-2">{error}</p>}

      {value ? (
        <div className="relative w-full rounded-lg border border-slate-200 bg-slate-50 p-2 group flex justify-center items-center h-24">
          <img src={value} alt="Logo" className="w-full h-full object-contain max-h-20 rounded" />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-white shadow-sm opacity-0 transition-opacity group-hover:opacity-100"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 text-center cursor-pointer transition-colors h-24 ${
            isDragging ? 'border-brand-500 bg-brand-50' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
          }`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2 text-brand-600">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-[11px] font-medium">Subiendo...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5 text-slate-500">
              <Upload size={18} className="text-slate-400" />
              <div>
                <span className="text-xs font-medium text-slate-700 block">Subir imagen</span>
                <span className="text-[10px] block">PNG o JPG (máx. 2MB)</span>
              </div>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      )}
    </div>
  )
}
