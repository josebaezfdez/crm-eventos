import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PageHeader } from '../components/ui/PageHeader'
import { Card, CardTitle, CardSubtitle } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Save, Loader2, User, Handshake, Package } from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'
import { ImageUpload } from '../components/ui/ImageUpload'
import PartnersPage from './PartnersPage'
import PackagesPage from './PackagesPage'

const BASE_URL = import.meta.env.PROD ? 'https://eventmargin-api.josebaezfdez.workers.dev' : ''

export default function SettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const currentTab = searchParams.get('tab') || 'profile'

  const tabs = [
    { id: 'profile', name: 'Mi Perfil', icon: User },
    { id: 'partners', name: 'Partners', icon: Handshake },
    { id: 'packages', name: 'Paquetes', icon: Package },
  ]

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = currentTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setSearchParams({ tab: tab.id })}
                className={`
                  group inline-flex items-center border-b-2 py-4 px-1 text-sm font-medium
                  ${isActive 
                    ? 'border-brand-500 text-brand-600'
                    : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                  }
                `}
              >
                <Icon
                  className={`mr-2 h-4 w-4 ${isActive ? 'text-brand-500' : 'text-slate-400 group-hover:text-slate-500'}`}
                  aria-hidden="true"
                />
                {tab.name}
              </button>
            )
          })}
        </nav>
      </div>

      <div className="pt-2">
        {currentTab === 'profile' && <ProfileTab />}
        {currentTab === 'partners' && <PartnersPage />}
        {currentTab === 'packages' && <PackagesPage />}
      </div>
    </div>
  )
}

function ProfileTab() {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSuccess(false)
    try {
      await fetch(BASE_URL + '/api/settings', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(formData)
      })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
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
          <CardTitle className="mb-1">Identidad Visual</CardTitle>
          <CardSubtitle className="mb-5">Sube el logotipo de tu empresa. Usamos el claro para el menú lateral, y el oscuro para documentos de fondo blanco.</CardSubtitle>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <ImageUpload 
              label="Logo Modo Claro" 
              description="Ideal para fondos oscuros."
              value={formData.lightLogoUrl} 
              onChange={(url) => setFormData(f => ({ ...f, lightLogoUrl: url }))} 
              uploadUrl={BASE_URL + '/api/upload'}
              token={token!}
            />
            <ImageUpload 
              label="Logo Modo Oscuro" 
              description="Ideal para documentos (PDF)."
              value={formData.darkLogoUrl} 
              onChange={(url) => setFormData(f => ({ ...f, darkLogoUrl: url }))} 
              uploadUrl={BASE_URL + '/api/upload'}
              token={token!}
            />
          </div>
        </Card>

        <Card>
          <CardTitle className="mb-1">Datos Fiscales</CardTitle>
          <CardSubtitle className="mb-5">Esta información aparecerá obligatoriamente en la cabecera de tus facturas y presupuestos generados.</CardSubtitle>
          
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
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Guardar Configuración
          </Button>
        </div>
      </form>
    </div>
  )
}
