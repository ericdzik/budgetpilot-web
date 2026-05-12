import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Users, Trash2, Pencil, Phone, Mail } from 'lucide-react'
import { toast } from 'react-hot-toast'
import Header from '../components/layout/Header'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import EmptyState from '../components/ui/EmptyState'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { clientService } from '../services/clientService'

export default function ClientsPage() {
  const navigate = useNavigate()
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const loadClients = useCallback(async () => {
    setLoading(true)
    try {
      const res = await clientService.getAll(page)
      setClients(res.data.data || [])
      setMeta(res.data.meta || null)
    } catch {
      toast.error('Impossible de charger les clients')
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => { loadClients() }, [loadClients])

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await clientService.delete(deleteId)
      toast.success('Client supprimé')
      setDeleteId(null)
      loadClients()
    } catch {
      toast.error('Erreur lors de la suppression')
    } finally {
      setDeleting(false)
    }
  }

  const filtered = clients.filter((c) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      c.name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q)
    )
  })

  return (
    <div>
      <Header
        title="Clients"
        subtitle={`${meta?.total ?? clients.length} client(s)`}
        actions={
          <Button size="sm" onClick={() => navigate('/clients/new')}>
            <Plus className="w-4 h-4" />
            Nouveau client
          </Button>
        }
      />

      <div className="p-6 space-y-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="input pl-9"
            placeholder="Rechercher un client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <Spinner className="py-20" />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Aucun client"
            description="Ajoutez votre premier client"
            action={
              <Button size="sm" onClick={() => navigate('/clients/new')}>
                <Plus className="w-4 h-4" /> Ajouter un client
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((client) => (
              <div
                key={client.id}
                className="card hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/clients/${client.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-700 font-semibold text-sm">
                        {client.name?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{client.name}</p>
                      {client.company && (
                        <p className="text-xs text-gray-400">{client.company}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/clients/${client.id}/edit`) }}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteId(client.id) }}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-3 space-y-1">
                  {client.email && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Mail className="w-3.5 h-3.5" />
                      {client.email}
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Phone className="w-3.5 h-3.5" />
                      {client.phone}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {meta && meta.last_page > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Page {meta.current_page} sur {meta.last_page}
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                Précédent
              </Button>
              <Button variant="secondary" size="sm" disabled={page === meta.last_page} onClick={() => setPage((p) => p + 1)}>
                Suivant
              </Button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Supprimer le client"
        message="Cette action est irréversible."
        confirmLabel="Supprimer"
      />
    </div>
  )
}
