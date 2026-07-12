import { useState } from 'react'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input, Select, TextArea } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { Badge } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { useStore } from '../store/useStore'
import { formatCurrency } from '../utils/format'
import type { Partner, PartnerCategory, PartnerPricingType } from '../types'
import {
  Plus, Trash2, Handshake, Mail, Phone,
  MoreVertical, Edit3
} from 'lucide-react'

const CATEGORIES: PartnerCategory[] = ['DJ', 'Fotógrafo', 'Músico', 'Fotomatón', 'Camarero', 'Técnico sonido', 'Decoración', 'Otro']

const emptyForm = {
  name: '', category: 'DJ' as PartnerCategory, pricingType: 'fixed' as PartnerPricingType,
  hourlyRate: 0, fixedRate: 0, notes: '', phone: '', email: '',
}

export default function PartnersPage() {
  const partners = useStore((s) => s.partners)
  const addPartner = useStore((s) => s.addPartner)
  const updatePartner = useStore((s) => s.updatePartner)
  const deletePartner = useStore((s) => s.deletePartner)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)

  const openNew = () => { setForm(emptyForm); setEditingId(null); setModalOpen(true) }
  const openEdit = (p: Partner) => {
    setForm({
      name: p.name, category: p.category, pricingType: p.pricingType,
      hourlyRate: p.hourlyRate, fixedRate: p.fixedRate, notes: p.notes, phone: p.phone, email: p.email,
    })
    setEditingId(p.id)
    setMenuOpenId(null)
    setModalOpen(true)
  }
  const confirmDelete = (id: string) => {
    setDeleteId(id)
    setMenuOpenId(null)
  }

  const [isSaving, setIsSaving] = useState(false)
  const save = async () => {
    if (!form.name.trim()) return
    setIsSaving(true)
    try {
      if (editingId) await updatePartner(editingId, form)
      else await addPartner(form)
      setModalOpen(false)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Proveedores"
        description="Gestiona los proveedores externos y sus tarifas. Podrás añadirlos a tus presupuestos automáticamente."
        actions={<Button onClick={openNew} className="bg-brand-600 hover:bg-brand-700 text-white"><Plus size={16} className="mr-2" /> Nuevo partner</Button>}
      />

      {partners.length === 0 ? (
        <EmptyState title="Sin proveedores" description="Añade DJs, fotógrafos, camareros…" icon={<Handshake size={22} />} action={<Button size="sm" onClick={openNew}><Plus size={15} className="mr-2"/> Nuevo partner</Button>} />
      ) : (
        <Card padded={false} className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th scope="col" className="px-6 py-4 font-semibold">Proveedor</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Categoría</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Tarifa</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Contacto</th>
                  <th scope="col" className="px-6 py-4 text-right font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {partners.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{p.name}</div>
                      {p.notes && <div className="mt-0.5 text-xs text-slate-400 truncate max-w-[200px]">{p.notes}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <Badge color="slate">{p.category}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">
                        {p.pricingType === 'fixed' ? formatCurrency(p.fixedRate) : formatCurrency(p.hourlyRate)}
                      </div>
                      <div className="text-xs text-slate-500">
                        {p.pricingType === 'fixed' ? 'por evento' : 'por hora'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col space-y-1 text-xs">
                        {p.phone && <span className="flex items-center gap-1.5"><Phone size={12} className="text-slate-400"/>{p.phone}</span>}
                        {p.email && <span className="flex items-center gap-1.5"><Mail size={12} className="text-slate-400"/>{p.email}</span>}
                        {!p.phone && !p.email && <span className="text-slate-400 italic">Sin contacto</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right relative">
                      <div className="flex justify-end relative">
                         <button 
                            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors"
                            onClick={() => setMenuOpenId(menuOpenId === p.id ? null : p.id)}
                         >
                            <MoreVertical size={18} />
                         </button>

                         {menuOpenId === p.id && (
                           <>
                             <div className="fixed inset-0 z-10" onClick={() => setMenuOpenId(null)} />
                             <div className="absolute right-0 top-8 z-20 w-36 rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5">
                                <button
                                  className="group flex w-full items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-600"
                                  onClick={() => openEdit(p)}
                                >
                                  <Edit3 size={14} className="mr-2 text-slate-400 group-hover:text-brand-500" />
                                  Editar
                                </button>
                                <button
                                  className="group flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                  onClick={() => confirmDelete(p.id)}
                                >
                                  <Trash2 size={14} className="mr-2 text-red-500" />
                                  Eliminar
                                </button>
                             </div>
                           </>
                         )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Editar partner' : 'Nuevo partner'}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button size="sm" onClick={save} isLoading={isSaving} disabled={!form.name.trim() || isSaving}>Guardar</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Select label="Categoría" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as PartnerCategory })}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
          <Select label="Tipo de precio" value={form.pricingType} onChange={(e) => setForm({ ...form, pricingType: e.target.value as PartnerPricingType })}>
            <option value="fixed">Precio fijo por evento</option>
            <option value="hourly">Precio por hora</option>
          </Select>
          {form.pricingType === 'fixed' ? (
            <Input label="Precio por evento (€)" type="number" min={0} value={form.fixedRate} onChange={(e) => setForm({ ...form, fixedRate: Number(e.target.value) })} />
          ) : (
            <Input label="Precio por hora (€)" type="number" min={0} value={form.hourlyRate} onChange={(e) => setForm({ ...form, hourlyRate: Number(e.target.value) })} />
          )}
          <Input label="Teléfono" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <div className="sm:col-span-2">
            <TextArea label="Observaciones" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        title="Eliminar partner"
        message="¿Seguro que quieres eliminar este proveedor? Ya no estará disponible para nuevos presupuestos."
        confirmLabel="Eliminar"
        onConfirm={() => { if (deleteId) deletePartner(deleteId); setDeleteId(null) }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  )
}
