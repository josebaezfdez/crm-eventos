import { useState } from 'react'
import { Card, CardTitle, CardSubtitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useAuthStore } from '../store/useAuthStore'
import { Lock, Mail, Loader2 } from 'lucide-react'
import { API_BASE_URL } from '../config'

const BASE_URL = API_BASE_URL

export function LoginPage() {
  const login = useAuthStore(s => s.login)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch(BASE_URL + '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!res.ok) {
        throw new Error('Credenciales incorrectas')
      }

      const data = await res.json()
      login(data.token, data.user, data.memberships)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 shadow-xl shadow-amber-900/5">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mb-4">
            <Lock className="text-white w-8 h-8" />
          </div>
          <CardTitle className="text-2xl mb-2">EventMargin</CardTitle>
          <CardSubtitle>Acceso a tu cuenta</CardSubtitle>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <Input 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  className="pl-10" 
                  placeholder="tu@email.com"
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
                  placeholder="••••••••"
                  required 
                />
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full h-11" disabled={loading}>
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Entrar'}
          </Button>

          <p className="text-center text-sm text-zinc-500 mt-4">
            ¿No tienes cuenta? <a href="/register" className="text-brand-600 font-medium hover:underline">Regístrate</a>
          </p>
        </form>
      </Card>
    </div>
  )
}
