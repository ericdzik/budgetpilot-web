import { useEffect, useState } from 'react'
import { trackingService } from '../../services/trackingService'
import useTrackingSettingsStore from '../../store/trackingSettingsStore'
import TrackingDateButton from '../../components/ui/TrackingDateButton'

const COLORS = { getdenis: '#E65100', client: '#1565C0' }

const FILTERS = [
  { key: 'all',      label: 'Tous' },
  { key: 'getdenis', label: 'Getdenis' },
  { key: 'client',   label: 'Interne' },
]

export default function TrackingHistoriquePage() {
  const { partnerLogoUrl, partnerName } = useTrackingSettingsStore()
  const [scans, setScans]         = useState([])
  const [total, setTotal]         = useState(0)
  const [loading, setLoading]     = useState(true)
  const [filter, setFilter]       = useState('all')
  const [links, setLinks]         = useState([])
  const [selectedCode, setSelectedCode] = useState(null)
  const [dateStart, setDateStart] = useState(null)
  const [dateEnd,   setDateEnd]   = useState(null)
  const [page, setPage]           = useState(1)
  const [lastPage, setLastPage]   = useState(1)

  const fmtDate = (d) =>
    `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`

  const load = async (p = 1, start = dateStart, end = dateEnd) => {
    setLoading(true)
    try {
      const params = { page: p, per_page: 20 }
      if (filter !== 'all') params.group = filter
      if (selectedCode)     params.code  = selectedCode
      if (start) params.from = fmtDate(start)
      if (end)   params.to   = fmtDate(end)

      const data = await trackingService.getScans(params)
      setScans(data.data || [])
      setTotal(data.total || 0)
      setLastPage(data.last_page || 1)
      setPage(p)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleDateChange = (start, end) => {
    setDateStart(start)
    setDateEnd(end)
    load(1, start, end)
  }

  const handleDateReset = () => {
    setDateStart(null)
    setDateEnd(null)
    load(1, null, null)
  }

  const loadLinks = async () => {
    try {
      const data = await trackingService.getLinks()
      setLinks(data)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => { loadLinks() }, [])
  useEffect(() => { load(1) }, [filter, selectedCode])

  // Filtres par commercial individuel (depuis les liens)
  const commerciaux = links.filter(l =>
    filter === 'all' || l.group === filter
  )

  return (
    <div style={{ padding: '32px', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        {/* Titre + date button côte à côte */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#111', margin: 0 }}>Historique</h1>
          <TrackingDateButton
            startDate={dateStart}
            endDate={dateEnd}
            onChange={handleDateChange}
            accentColor="#E65100"
          />
          {/* Bouton reset — visible seulement si un filtre est actif */}
          {dateStart && dateEnd && (
            <button
              onClick={handleDateReset}
              title="Voir toutes les données"
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '7px 14px', borderRadius: 20,
                border: '1.5px solid #E65100',
                backgroundColor: '#fff0ea', color: '#E65100',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              ✕ Tout
            </button>
          )}
        </div>
        {/* Logo partenaire à droite */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src={partnerLogoUrl} alt={partnerName} style={{ width: 36, height: 36, objectFit: 'contain', borderRadius: 8 }} />
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#222' }}>{partnerName}</span>
        </div>
      </div>

      {/* Filtres groupes */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {/* Filtres de base */}
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => { setFilter(f.key); setSelectedCode(null) }}
            style={{
              padding: '8px 18px',
              borderRadius: '20px',
              border: 'none',
              fontSize: '14px',
              fontWeight: filter === f.key && !selectedCode ? '600' : '400',
              backgroundColor: filter === f.key && !selectedCode ? '#E65100' : '#fff',
              color: filter === f.key && !selectedCode ? '#fff' : '#444',
              cursor: 'pointer',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
              transition: 'all 0.15s',
            }}
          >
            {f.label}
          </button>
        ))}

        {/* Filtres par commercial individuel */}
        {links.map(link => (
          <button
            key={link.code}
            onClick={() => setSelectedCode(selectedCode === link.code ? null : link.code)}
            style={{
              padding: '8px 18px',
              borderRadius: '20px',
              border: 'none',
              fontSize: '14px',
              fontWeight: selectedCode === link.code ? '600' : '400',
              backgroundColor: selectedCode === link.code
                ? (link.group === 'getdenis' ? COLORS.getdenis : COLORS.client)
                : '#fff',
              color: selectedCode === link.code ? '#fff' : '#444',
              cursor: 'pointer',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
              display: 'flex', alignItems: 'center', gap: '6px',
              transition: 'all 0.15s',
            }}
          >
            {link.name}
            {/* Badge count */}
            <span style={{
              backgroundColor: selectedCode === link.code
                ? 'rgba(255,255,255,0.3)'
                : (link.group === 'getdenis' ? '#fff0ea' : '#e8f0fe'),
              color: selectedCode === link.code
                ? '#fff'
                : (link.group === 'getdenis' ? COLORS.getdenis : COLORS.client),
              fontSize: '11px', fontWeight: '700',
              padding: '2px 7px', borderRadius: '10px',
            }}>
              {link.total_scans}
            </span>
          </button>
        ))}
      </div>

      {/* Tableau */}
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      }}>
        {/* Titre tableau */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid #f0f0f0',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '15px', fontWeight: '600', color: '#222' }}>
              Liste des scans
            </span>
            <span style={{
              fontSize: '12px', color: '#aaa',
              backgroundColor: '#f5f5f5',
              padding: '2px 8px', borderRadius: '10px',
            }}>
              {total} total
            </span>
          </div>
        </div>

        {/* En-tête table */}
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#111' }}>
              {['#', 'Commercial', 'Date', 'Heure', 'Etat'].map(h => (
                <th key={h} style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontSize: '13px',
                  color: '#fff',
                  fontWeight: '600',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#aaa' }}>
                  Chargement...
                </td>
              </tr>
            ) : scans.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#aaa', fontSize: '14px' }}>
                  Aucun scan pour le moment
                </td>
              </tr>
            ) : (
              scans.map((scan, i) => (
                <tr
                  key={scan.id}
                  style={{
                    backgroundColor: scan.group === 'getdenis'
                      ? (i % 2 === 0 ? '#fff8f5' : '#fff3ee')
                      : (i % 2 === 0 ? '#fff' : '#f5f8ff'),
                  }}
                >
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#aaa' }}>{scan.id}</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#222', fontWeight: '500' }}>
                    {scan.commercial}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#555' }}>{scan.date}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#555' }}>{scan.time}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      backgroundColor: scan.group === 'getdenis' ? COLORS.getdenis : COLORS.client,
                      color: '#fff',
                      fontSize: '11px',
                      fontWeight: '600',
                      padding: '4px 12px',
                      borderRadius: '20px',
                    }}>
                      scan
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {lastPage > 1 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '8px', padding: '16px',
            borderTop: '1px solid #f0f0f0',
          }}>
            <button
              onClick={() => load(page - 1)}
              disabled={page === 1}
              style={{
                padding: '6px 16px', borderRadius: '20px',
                border: '1px solid #e0e0e0',
                backgroundColor: '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer',
                color: page === 1 ? '#ccc' : '#444', fontSize: '13px',
              }}
            >
              Précédent
            </button>
            <span style={{ fontSize: '13px', color: '#666' }}>
              Page {page} / {lastPage}
            </span>
            <button
              onClick={() => load(page + 1)}
              disabled={page === lastPage}
              style={{
                padding: '6px 16px', borderRadius: '20px',
                border: '1px solid #e0e0e0',
                backgroundColor: page === lastPage ? '#f5f5f5' : '#E65100',
                cursor: page === lastPage ? 'not-allowed' : 'pointer',
                color: page === lastPage ? '#ccc' : '#fff', fontSize: '13px',
              }}
            >
              Suivant
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
