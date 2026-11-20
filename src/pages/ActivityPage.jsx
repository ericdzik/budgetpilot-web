import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import UserBadge from '../components/ui/UserBadge'
import { teamService } from '../services/teamService'
import { Avatar, BackButton, RoleTag } from '../components/team/teamUi'
import { GUTTER, initials } from '../components/team/teamConstants'

const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']

function dayLabel(date) {
  const now = new Date()
  const startOf = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const diff = Math.round((startOf(now) - startOf(date)) / 86400000)
  if (diff === 0) return "Aujourd'hui"
  if (diff === 1) return 'Hier'
  return `${date.getDate()} ${MONTHS[date.getMonth()]}${date.getFullYear() !== now.getFullYear() ? ` ${date.getFullYear()}` : ''}`
}

const time = (date) => `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`

/** Historique des actions d'une entreprise : qui a fait quoi, quand, avec quel profil. */
export default function ActivityPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [entries, setEntries] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    teamService.activity(Number(id))
      .then(({ data }) => setEntries(data.entries))
      .catch((e) => setError(e.response?.data?.message || "Impossible de charger l'historique. Vérifiez votre connexion."))
  }, [id])

  // Regroupement par jour, du plus récent au plus ancien
  const groups = []
  for (const entry of entries ?? []) {
    const date = new Date(entry.at)
    const label = dayLabel(date)
    if (groups.at(-1)?.label !== label) groups.push({ label, items: [] })
    groups.at(-1).items.push({ ...entry, date })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: `18px ${GUTTER}` }}>
        <BackButton onClick={() => navigate(`/team/${id}`)} />
        <h1 style={{ fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: '700', color: '#111', margin: 0, flex: 1 }}>Historique</h1>
        <UserBadge size={48} />
      </div>

      <div style={{ padding: `8px ${GUTTER} 32px`, maxWidth: 760 }}>
        {error && <p style={{ color: '#757575' }}>{error}</p>}
        {!error && entries === null && <p style={{ color: '#757575' }}>Chargement…</p>}
        {entries?.length === 0 && <p style={{ color: '#757575' }}>Aucune action pour l'instant.</p>}

        {groups.map((group) => (
          <div key={group.label}>
            <p style={{ margin: '22px 0 6px', fontSize: 12.5, fontWeight: '600', color: '#757575' }}>{group.label}</p>
            {group.items.map((entry) => (
              <div key={entry.id} style={{ display: 'flex', gap: 14, padding: '14px 0', borderBottom: '1px solid #E5E7EB' }}>
                <Avatar text={initials(entry.actor)} size={38} />
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.45, color: '#111' }}>
                    <strong>{entry.actor}</strong> {entry.verb} {entry.subject}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                    {entry.role && <RoleTag role={entry.role} />}
                    <span style={{ fontSize: 12.5, color: '#757575' }}>{time(entry.date)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
