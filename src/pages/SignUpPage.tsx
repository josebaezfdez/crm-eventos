import { useState } from 'react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useAuthStore } from '../store/useAuthStore'
import { Building2, Mail, Lock, User, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function SignUpPage() {
  const register = useAuthStore(s => s.register)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await register({ name, email, password, companyName })
      navigate('/')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FDFCF8] flex flex-col md:flex-row">
      {/* Branding Side */}
      <div className="hidden md:flex flex-1 bg-zinc-900 p-12 flex-col justify-between text-white relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 font-semibold text-xl tracking-tight mb-16">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
              <span className="text-zinc-900 text-lg font-bold">EM</span>
            </div>
            EventMargin
          </div>
          <h1 className="text-5xl font-medium leading-[1.1] tracking-tight mb-6 max-w-lg text-zinc-100">
            Control total sobre el margen de tus eventos.
          </h1>
          <p className="text-lg text-zinc-400 max-w-md">
            La plataforma definitiva para gestionar presupuestos, partners y rentabilidad en agencias de eventos.
          </p>
        </div>
        
        {/* Abstract shapes / gradients for premium feel */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-500/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4" />
        
        <div className="relative z-10 text-sm text-zinc-500">
          © {new Date().getFullYear()} EventMargin. Todos los derechos reservados.
        </div>
      </div>

      {/* Form Side */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">
          <div className="text-center md:text-left mb-8">
            <h2 className="text-3xl font-semibold text-zinc-900 mb-2">Crear cuenta</h2>
            <p className="text-zinc-500">Comienza a gestionar tus eventos en minutos</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Nombre completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <Input 
                    type="text" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    className="pl-10" 
                    placeholder="Ana García"
                    required 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Email de trabajo</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <Input 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    className="pl-10" 
                    placeholder="ana@tuagencia.com"
                    required 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Nombre de tu Agencia/Empresa</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <Input 
                    type="text" 
                    value={companyName} 
                    onChange={e => setCompanyName(e.target.value)} 
                    className="pl-10" 
                    placeholder="Acme Events"
                    required 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <Input 
                    type="password" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    className="pl-10" 
                    placeholder="Mínimo 6 caracteres"
                    minLength={6}
                    required 
                  />
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full h-11 text-base font-medium" disabled={loading}>
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Crear cuenta'}
            </Button>

            <p className="text-center text-sm text-zinc-500 mt-6">
              ¿Ya tienes cuenta? <a href="/login" className="text-brand-600 font-medium hover:underline">Inicia sesión</a>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
