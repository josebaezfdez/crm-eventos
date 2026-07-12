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
  Plus, Pencil, Trash2, Handshake, Mail, Phone, Music, Camera, Mic,
  Image, User, HardHat, Palette, Box, Euro,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const CATEGORIES: PartnerCategory[] = ['DJ', 'Fotógrafo', 'Músico', 'Fotomatón', 'Camarero', 'Técnico sonido', 'Decoración', 'Otro']

const categoryIcon: Record<PartnerCategory, LucideIcon> = {
  'DJ': Music,
  'Fotógrafo': Camera,
  'Músico': Mic,
  'Fotomatón': Image,
  'Camarero': User,
  'Técnico sonido': HardHat,
  'Decoración': Palette,
  'Otro': Box,
}

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

  const openNew = () => { setForm(emptyForm); setEditingId(null); setModalOpen(true) }
  const openEdit = (p: Partner) => {
    setForm({
      name: p.name, category: p.category, pricingType: p.pricingType,
      hourlyRate: p.hourlyRate, fixedRate: p.fixedRate, notes: p.notes, phone: p.phone, email: p.email,
    })
    setEditingId(p.id); setModalOpen(true)
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
        eyebrow="Proveedores"
        title="Partners"
        description="Proveedores externos que subcontractas. Sus precios entran automáticamente en los presupuestos."
        actions={<Button onClick={openNew}><Plus size={16} /> Nuevo partner</Button>}
      />

      {partners.length === 0 ? (
        <EmptyState title="Sin partners" description="Añade DJs, fotógrafos, camareros…" icon={<Handshake size={22} />} action={<Button size="sm" onClick={openNew}><Plus size={15} /> Nuevo partner</Button>} />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {partners.map((p) => {
            const Icon = categoryIcon[p.category]
            return (
              <Card key={p.id} hover>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="icon-chip-brand shrink-0"><Icon size={18} /></div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">{p.name}</p>
                      <Badge color="brand" className="mt-1">{p.category}</Badge>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => openEdit(p)}><Pencil size={14} /></Button>
                </div>

                <div className="mt-4 rounded-xl bg-gradient-to-br from-brand-50/70 to-accent-50/40 p-3.5 text-center ring-1 ring-inset ring-slate-100">
                  <p className="flex items-center justify-center gap-1.5 text-xs text-slate-400"><Euro size={12} /> Precio</p>
                  <p className="tnum mt-0.5 text-xl font-bold text-slate-900">
                    {p.pricingType === 'fixed' ? formatCurrency(p.fixedRate) : formatCurrency(p.hourlyRate)}
                    <span className="text-sm font-normal text-slate-400"> / {p.pricingType === 'fixed' ? 'evento' : 'hora'}</span>
                  </p>
                </div>

                <dl className="mt-3 space-y-1.5 text-sm text-slate-600">
                  <div className="flex items-center gap-2"><Phone size={13} className="text-slate-400" /> {p.phone || '—'}</div>
                  <div className="flex items-center gap-2"><Mail size={13} className="text-slate-400" /> <span className="truncate">{p.email || '—'}</span></div>
                </dl>
                {p.notes && <p className="mt-2 text-xs text-slate-400">{p.notes}</p>}

                <div className="mt-4 flex justify-end">
                  <Button variant="danger" size="sm" onClick={() => setDeleteId(p.id)}><Trash2 size={14} /> Eliminar</Button>
                </div>
              </Card>
            )
          })}
        </div>
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
        message="¿Seguro que quieres eliminar este partner?"
        confirmLabel="Eliminar"
        onConfirm={() => { if (deleteId) deletePartner(deleteId); setDeleteId(null) }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  )
}
