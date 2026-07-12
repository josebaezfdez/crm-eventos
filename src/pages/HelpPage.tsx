import { Card } from '../components/ui/Card'
import { Search, Book, Video, MessageCircle, FileText, Zap, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

const FAQS = [
  { q: "¿Cómo creo un presupuesto rápido?", a: "Usa el Asistente Guiado desde el Dashboard o ve a la pestaña Presupuestos y haz clic en 'Nuevo Presupuesto'." },
  { q: "¿Puedo añadir servicios que no están en los paquetes?", a: "Sí, dentro de la edición del presupuesto puedes usar 'Añadir ítem manual' para incluir conceptos personalizados." },
  { q: "¿Cómo se calcula la rentabilidad?", a: "El sistema suma el total ofertado y le resta el coste de los partners y paquetes asociados para mostrarte el margen limpio." }
]

export default function HelpPage() {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="text-center pt-8 pb-4">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">¿Cómo podemos ayudarte?</h1>
        <p className="mt-4 text-lg text-slate-600">Busca en nuestra base de conocimiento o revisa las guías rápidas.</p>
        
        <div className="mt-8 max-w-xl mx-auto relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Ej. 'cómo crear un presupuesto', 'rentabilidad'..."
            className="w-full rounded-2xl border-0 py-4 pl-12 pr-4 text-slate-900 shadow-[0_0_15px_rgba(0,0,0,0.05)] ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-brand-500 text-lg transition-shadow hover:shadow-[0_0_20px_rgba(0,0,0,0.08)]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card hover className="p-6 cursor-pointer group flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 group-hover:scale-110 transition-transform">
            <Book size={24} />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-slate-900">Guías de uso</h3>
          <p className="mt-2 text-sm text-slate-500">Aprende a usar todas las funciones del CRM paso a paso.</p>
        </Card>

        <Card hover className="p-6 cursor-pointer group flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-50 text-accent-600 group-hover:scale-110 transition-transform">
            <Video size={24} />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-slate-900">Videotutoriales</h3>
          <p className="mt-2 text-sm text-slate-500">Próximamente: vídeos cortos explicando cada módulo.</p>
        </Card>

        <Card hover className="p-6 cursor-pointer group flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 group-hover:scale-110 transition-transform">
            <MessageCircle size={24} />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-slate-900">Soporte Técnico</h3>
          <p className="mt-2 text-sm text-slate-500">Contacta con nosotros si has encontrado algún error.</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-4">
            <FileText className="text-brand-500" /> Preguntas Frecuentes
          </h2>
          <div className="space-y-4">
            {FAQS.map((faq, i) => (
              <details key={i} className="group rounded-xl bg-white p-4 ring-1 ring-slate-200 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer items-center justify-between font-medium text-slate-900">
                  {faq.q}
                  <span className="ml-1.5 flex-shrink-0 rounded-full bg-slate-50 p-1.5 text-slate-900 sm:p-2 group-open:-rotate-180 transition-transform">
                    <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </summary>
                <p className="mt-4 text-sm leading-relaxed text-slate-600">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-4">
            <Zap className="text-accent-500" /> Accesos Rápidos
          </h2>
          <Card className="p-0 overflow-hidden divide-y divide-slate-100">
            <Link to="/" className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group">
              <div>
                <p className="font-medium text-slate-900 group-hover:text-brand-600">Cuadro de mando</p>
                <p className="text-sm text-slate-500">Vuelve al inicio para ver tu resumen.</p>
              </div>
              <ChevronRight className="text-slate-400 group-hover:text-brand-500" size={20} />
            </Link>
            <Link to="/settings" className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group">
              <div>
                <p className="font-medium text-slate-900 group-hover:text-brand-600">Configuración (Partners y Paquetes)</p>
                <p className="text-sm text-slate-500">Gestiona tus proveedores y servicios base.</p>
              </div>
              <ChevronRight className="text-slate-400 group-hover:text-brand-500" size={20} />
            </Link>
          </Card>
        </div>
      </div>
    </div>
  )
}
