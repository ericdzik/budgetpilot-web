import { useMemo, useState } from 'react'
import { toast } from 'react-hot-toast'
import { Download } from 'lucide-react'
import { adminService } from '../../services/adminService'

// Espace « Rapport Excel » du compte dev : choisir une période et télécharger
// le rapport d'activité (synthèse, abonnements, QR codes, activité, géographie).

const BLUE = '#1E88E5'
const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']

const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const fr = (s) => s.split('-').reverse().join('/')

// Périodes « du 7 au 6 » (cycle des rapports) : la plus récente est celle qui vient de se terminer.
function billingPeriods(count = 6) {
  const now = new Date()
  let end = new Date(now.getFullYear(), now.getMonth(), 6)
  if (now.getDate() < 7) end = new Date(now.getFullYear(), now.getMonth() - 1, 6)
  const list = []
  for (let i = 0; i < count; i++) {
    const e = new Date(end.getFullYear(), end.getMonth() - i, 6)
    const s = new Date(e.getFullYear(), e.getMonth() - 1, 7)
    list.push({ key: iso(s), start: iso(s), end: iso(e), label: `${s.getDate()} ${MONTHS[s.getMonth()]} au ${e.getDate()} ${MONTHS[e.getMonth()]} ${e.getFullYear()}` })
  }
  return list
}

const card = { backgroundColor: '#fff', borderRadius: 16, border: '1px solid #ebebeb', padding: 20 }
const label = { display: 'block', fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 6 }
const input = {
  boxSizing: 'border-box', padding: '10px 12px', fontSize: 14, borderRadius: 10,
  border: '1px solid #dcdcdc', outline: 'none', fontFamily: 'inherit',
}

const CONTENT = [
  ['Synthèse', 'Inscrits, abonnements, factures, dépenses, recettes, parrainages'],
  ['Abonnements payants', 'Qui a payé quoi, source et date'],
  ['Suivi QR codes', 'Scans, installations et conversion par commercial'],
  ['Activité utilisateurs', 'Factures, devis, dépenses, recettes et encaissé par utilisateur'],
  ['Géographie', 'Pays par indicatif, par profil et par scan'],
]

export default function AdminReportPage() {
  const periods = useMemo(() => billingPeriods(), [])
  const [start, setStart] = useState(periods[0].start)
  const [end, setEnd] = useState(periods[0].end)
  const [loading, setLoading] = useState(false)

  const valid = start && end && start <= end
  const preset = periods.find((p) => p.start === start && p.end === end)

  const download = async () => {
    setLoading(true)
    try {
      const r = await adminService.getMonthlyReport({ start, end })
      const blob = new Blob([r.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `rapport_${start}_au_${end}.xlsx`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      toast.success('Rapport téléchargé')
    } catch (e) {
      // Avec responseType blob, le message d'erreur arrive aussi sous forme de blob
      let msg = 'Impossible de générer le rapport.'
      try {
        const data = JSON.parse(await e.response.data.text())
        msg = data.message || msg
      } catch (_) { /* garde le message par défaut */ }
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 720 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>Rapport Excel</h1>
      <p style={{ color: '#666', fontSize: 14, margin: '0 0 20px' }}>
        Générez le rapport d'activité sur la période de votre choix. Le fichier s'ouvre dans Excel.
      </p>

      <div style={{ ...card, marginBottom: 16 }}>
        <span style={label}>Période</span>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {periods.map((p) => {
            const active = preset?.key === p.key
            return (
              <button key={p.key} type="button" onClick={() => { setStart(p.start); setEnd(p.end) }} style={{
                padding: '7px 14px', borderRadius: 50, fontSize: 13, cursor: 'pointer',
                border: `1px solid ${active ? BLUE : '#dcdcdc'}`, backgroundColor: active ? '#E3F2FD' : '#fff',
                color: active ? BLUE : '#444', fontWeight: active ? 600 : 400,
              }}>{p.label}</button>
            )
          })}
        </div>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <label style={label} htmlFor="rep-start">Du</label>
            <input id="rep-start" type="date" value={start} max={end || undefined} onChange={(e) => setStart(e.target.value)} style={input} />
          </div>
          <div>
            <label style={label} htmlFor="rep-end">Au</label>
            <input id="rep-end" type="date" value={end} min={start || undefined} onChange={(e) => setEnd(e.target.value)} style={input} />
          </div>
        </div>
        {!valid && <p style={{ color: '#C62828', fontSize: 13, margin: '12px 0 0' }}>La date de fin doit être après la date de début.</p>}

        <button type="button" onClick={download} disabled={!valid || loading} style={{
          marginTop: 20, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 20px', fontSize: 14,
          fontWeight: 600, borderRadius: 10, border: 'none', color: '#fff', cursor: !valid || loading ? 'not-allowed' : 'pointer',
          backgroundColor: !valid || loading ? '#9bbfe3' : BLUE,
        }}>
          <Download size={16} />
          {loading ? 'Génération en cours…' : 'Télécharger le rapport'}
        </button>
        {valid && <p style={{ color: '#888', fontSize: 12, margin: '10px 0 0' }}>Période : du {fr(start)} au {fr(end)} inclus.</p>}
      </div>

      <div style={card}>
        <span style={label}>Contenu du fichier</span>
        <ul style={{ margin: 0, paddingLeft: 18, color: '#444', fontSize: 14, lineHeight: 1.7 }}>
          {CONTENT.map(([t, d]) => <li key={t}><strong>{t}</strong> : {d}</li>)}
        </ul>
      </div>
    </div>
  )
}
