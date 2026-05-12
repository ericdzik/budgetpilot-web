import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, FileText, Download, Copy, Trash2, MoreVertical, Eye } from 'lucide-react'
import { toast } from 'react-hot-toast'
import Header from '../components/layout/Header'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Spinner from '../components/ui/Spinner'
import EmptyState from '../components/ui/EmptyState'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { documentService } from '../services/documentService'
import { formatCurrency, formatDate } from '../utils/formatters'

const STATUS_BADGE = {
  paid:           { variant: 'green',  label: 'Payée' },
  sent:           { variant: 'yellow', label: 'Envoyée' },
  draft:          { variant: 'gray',   label: 'Brouillon' },
  overdue:        { variant: 'red',    label: 'En retard' },
  partially_paid: { variant: 'yellow', label: 'Part. payée' },
}

export default function DocumentsPage() {
  const navigate = useNavigate()
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [openMenu, setOpenMenu] = useState(null)

  const loadDocuments = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page }
      if (typeFilter) params.type = typeFilter
      if (statusFilter) params.status = statusFilter
      const res = await documentService.getAll(params)
      setDocuments(res.data.data || [])
      setMeta(res.data.meta || null)
    } catch {
      toast.error('Impossible de charger les documents')
    } finally {
      setLoading(false)
    }
  }, [page, typeFilter, statusFilter])

  useEffect(() => { loadDocuments() }, [loadDocuments])

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await documentService.delete(deleteId)
      toast.success('Document supprimé')
      setDeleteId(null)
      loadDocuments()
    } catch {
      toast.error('Erreur lors de la suppression')
    } finally {
      setDeleting(false)
    }
  }

  const handleDownloadPdf = async (id, e) => {
    e.stopPropagation()
    try {
      const res = await documentService.downloadPdf(id)
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `document-${id}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Erreur lors du téléchargement')
    }
  }

  const handleDuplicate = async (id, e) => {
    e.stopPropagation()
    try {
      await documentService.duplicate(id)
      toast.success('Document dupliqué')
      loadDocuments()
    } catch {
      toast.error('Erreur lors de la duplication')
    }
  }

  const filtered = documents.filter((d) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      d.reference?.toLowerCase().includes(q) ||
      d.client_name?.toLowerCase().includes(q)
    )
  })

  return (
    <div>
      <Header
        title="Documents"
        subtitle="Factures et devis"
        actions={
          <Button size="sm" onClick={() => navigate('/documents/new')}>
            <Plus className="w-4 h-4" />
            Nouveau
          </Button>
        }
      />

      <div className="p-6 space-y-4">
        {/* Filtres */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="input pl-9"
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="input w-auto"
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1) }}
          >
            <option value="">Tous les types</option>
            <option value="invoice">Factures</option>
            <option value="quote">Devis</option>
          </select>
          <select
            className="input w-auto"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          >
            <option value="">Tous les statuts</option>
            <option value="draft">Brouillon</option>
            <option value="sent">Envoyée</option>
            <option value="paid">Payée</option>
            <option value="overdue">En retard</option>
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <Spinner className="py-20" />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Aucun document"
            description="Créez votre première facture ou devis"
            action={
              <Button size="sm" onClick={() => navigate('/documents/new')}>
                <Plus className="w-4 h-4" /> Créer un document
              </Button>
            }
          />
        ) : (
          <div className="card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Référence</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Client</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Date</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Montant</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Statut</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((doc) => {
                  const badge = STATUS_BADGE[doc.status] || { variant: 'gray', label: doc.status }
                  return (
                    <tr
                      key={doc.id}
                      onClick={() => navigate(`/documents/${doc.id}`)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {doc.reference || `#${doc.id}`}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{doc.client_name || '—'}</td>
                      <td className="px-4 py-3">
                        <Badge variant={doc.type === 'invoice' ? 'blue' : 'purple'}>
                          {doc.type === 'invoice' ? 'Facture' : 'Devis'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(doc.created_at)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">
                        {formatCurrency(doc.total)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="relative flex items-center justify-end gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/documents/${doc.id}`) }}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
                            title="Voir"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleDownloadPdf(doc.id, e)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
                            title="Télécharger PDF"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleDuplicate(doc.id, e)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
                            title="Dupliquer"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setDeleteId(doc.id) }}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* Pagination */}
            {meta && meta.last_page > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  Page {meta.current_page} sur {meta.last_page}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Précédent
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page === meta.last_page}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Suivant
                  </Button>
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
        title="Supprimer le document"
        message="Cette action est irréversible. Le document sera définitivement supprimé."
        confirmLabel="Supprimer"
      />
    </div>
  )
}
