import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, TrendingUp, Trash2, Pencil } from 'lucide-react'
import { toast } from 'react-hot-toast'
import Header from '../components/layout/Header'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import EmptyState from '../components/ui/EmptyState'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { revenueService } from '../services/revenueService'
import { formatCurrency, formatDate } from '../utils/formatters'

export default function RevenuePage() {
  const navigate = useNavigate()
  const [revenues, setRevenues] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const loadRevenues = useCallback(async () => {
    setLoading(true)
    try {
      const res = await revenueService.getAll(page)
      setRevenues(res.data.data || [])
      setMeta(res.data.meta || null)
    } catch {
      toast.error('Impossible de charger les recettes')
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => { loadRevenues() }, [loadRevenues])

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await revenueService.delete(deleteId)
      toast.success('Recette supprimée')
      setDeleteId(null)
      loadRevenues()
    } catch {
      toast.error('Erreur lors de la suppression')
    } finally {
      setDeleting(false)
    }
  }

  const filtered = revenues.filter((r) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      r.description?.toLowerCase().includes(q) ||
      r.client_name?.toLowerCase().includes(q)
    )
  })

  return (
    <div>
      <Header
        title="Recettes"
        subtitle={`${meta?.total ?? revenues.length} recette(s)`}
        actions={
          <Button size="sm" onClick={() => navigate('/revenues/new')}>
            <Plus className="w-4 h-4" />
            Nouvelle recette
          </Button>
        }
      />

      <div className="p-6 space-y-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="input pl-9"
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <Spinner className="py-20" />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={TrendingUp}
            title="Aucune recette"
            description="Enregistrez votre première recette"
            action={
              <Button size="sm" onClick={() => navigate('/revenues/new')}>
                <Plus className="w-4 h-4" /> Ajouter une recette
              </Button>
            }
          />
        ) : (
          <div className="card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Description</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Client</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Méthode</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Date</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Montant</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((revenue) => (
                  <tr
                    key={revenue.id}
                    onClick={() => navigate(`/revenues/${revenue.id}/edit`)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {revenue.description || '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{revenue.client_name || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 capitalize">
                      {revenue.payment_method?.replace('_', ' ') || '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(revenue.date || revenue.created_at)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-green-600">
                      +{formatCurrency(revenue.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/revenues/${revenue.id}/edit`) }}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeleteId(revenue.id) }}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {meta && meta.last_page > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <p className="text-sm text-gray-500">Page {meta.current_page} sur {meta.last_page}</p>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Précédent</Button>
                  <Button variant="secondary" size="sm" disabled={page === meta.last_page} onClick={() => setPage((p) => p + 1)}>Suivant</Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Supprimer la recette"
        message="Cette action est irréversible."
        confirmLabel="Supprimer"
      />
    </div>
  )
}
