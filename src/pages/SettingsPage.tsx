import { useState, useEffect } from 'react'
import { PageHeader } from '../components/ui/PageHeader'
import { Card, CardTitle, CardSubtitle } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Save, Loader2 } from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'
import { ImageUpload } from '../components/ui/ImageUpload'
import { API_BASE_URL } from '../config'
import { useStore } from '../store/useStore'

const BASE_URL = API_BASE_URL

export default function SettingsPage() {
  const token = useAuthStore(s => s.token)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    taxId: '',
    address: '',
    email: '',
    phone: '',
    website: '',
    lightLogoUrl: '',
    darkLogoUrl: ''
  })

  useEffect(() => {
    fetch(BASE_URL + '/api/settings', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.name) {
          setFormData({
            name: data.name || '',
            taxId: data.taxId || '',
            address: data.address || '',
            email: data.email || '',
            phone: data.phone || '',
            website: data.website || '',
            lightLogoUrl: data.lightLogoUrl || '',
            darkLogoUrl: data.darkLogoUrl || ''
          })
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [token])
  
  const updateSettings = useStore((s: any) => s.updateSettings)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSuccess(false)
    try {
      await updateSettings(formData)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-brand-500" /></div>

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuración de Empresa"
        description="Gestiona los datos comerciales y visuales para la plataforma y tus presupuestos."
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        
        <Card>
          <div className="mb-5">
            <CardTitle>Identidad Visual</CardTitle>
            <CardSubtitle>Logotipos de la empresa para personalizar la aplicación y los documentos PDF.</CardSubtitle>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <ImageUpload 
              label="Logo Modo Claro" 
              description="Ideal para fondos oscuros (menú lateral)."
              value={formData.lightLogoUrl} 
              onChange={(url) => setFormData(f => ({ ...f, lightLogoUrl: url }))} 
              uploadUrl={BASE_URL + '/api/upload'}
              token={token!}
            />
            <ImageUpload 
              label="Logo Modo Oscuro" 
              description="Ideal para fondos claros (documentos PDF)."
              value={formData.darkLogoUrl} 
              onChange={(url) => setFormData(f => ({ ...f, darkLogoUrl: url }))} 
              uploadUrl={BASE_URL + '/api/upload'}
              token={token!}
            />
          </div>
        </Card>

        <Card>
          <div className="mb-5">
            <CardTitle>Datos Fiscales</CardTitle>
            <CardSubtitle>Esta información aparecerá obligatoriamente en la cabecera de tus presupuestos.</CardSubtitle>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <Input label="Nombre Comercial / Razón Social" value={formData.name} onChange={e => setFormData(f => ({ ...f, name: e.target.value }))} placeholder="Mi Empresa S.L." required />
            </div>
            <Input label="CIF / NIF" value={formData.taxId} onChange={e => setFormData(f => ({ ...f, taxId: e.target.value }))} placeholder="B12345678" />
            <Input label="Teléfono" value={formData.phone} onChange={e => setFormData(f => ({ ...f, phone: e.target.value }))} placeholder="+34 600 000 000" />
            <div className="sm:col-span-2">
              <Input label="Dirección Completa" value={formData.address} onChange={e => setFormData(f => ({ ...f, address: e.target.value }))} placeholder="Calle Mayor 1, 28001 Madrid" />
            </div>
            <Input label="Correo de Contacto" type="email" value={formData.email} onChange={e => setFormData(f => ({ ...f, email: e.target.value }))} placeholder="contacto@empresa.com" />
            <Input label="Sitio Web" value={formData.website} onChange={e => setFormData(f => ({ ...f, website: e.target.value }))} placeholder="https://www.empresa.com" />
          </div>
        </Card>

        <div className="flex justify-end items-center gap-4">
          {success && <span className="text-sm text-green-600 font-medium">¡Guardado con éxito!</span>}
          <Button type="submit" disabled={saving} className="bg-brand-600 hover:bg-brand-700 text-white">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Guardar Configuración
          </Button>
        </div>
      </form>

      {/* Miembros del Workspace (UI inicial) */}
      <Card className="mt-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <CardTitle>Miembros del Equipo</CardTitle>
            <CardSubtitle>Usuarios con acceso a este workspace.</CardSubtitle>
          </div>
          <Button variant="secondary" onClick={() => alert('Sistema de invitaciones en desarrollo')}>
            + Invitar Miembro
          </Button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50">
              <tr>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Rol</th>
                <th className="px-4 py-3 font-medium text-right">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="px-4 py-3 font-medium text-slate-900">{useAuthStore.getState().user?.name || 'Tú'}</td>
                <td className="px-4 py-3 text-slate-500">{useAuthStore.getState().user?.email || ''}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-brand-100 text-brand-700">
                    ADMIN
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                    Activo
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
