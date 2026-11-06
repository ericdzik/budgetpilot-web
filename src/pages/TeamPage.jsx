import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Check, Hourglass, MoreHorizontal, X } from 'lucide-react'
import { toast } from 'react-hot-toast'
import UserBadge from '../components/ui/UserBadge'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { teamService } from '../services/teamService'
import { Avatar, BackButton, PillButton, RoleTag } from '../components/team/teamUi'
import { BLUE, GUTTER, ICON_BG, ICON_GREY, initials } from '../components/team/teamConstants'

const apiMessage = (error, fallback) => error.response?.data?.message || fallback

/** Équipe d'une entreprise : places, personnes, invitations en attente. */
export default function TeamPage() {
  const { id } = useParams()
  const companyId = Number(id)
  const navigate = useNavigate()
  const [team, setTeam] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [menuFor, setMenuFor] = useState(null)
  const [toRemove, setToRemove] = useState(null)
  const [toCancel, setToCancel] = useState(null)

  const [reloadKey, setReloadKey] = useState(0)
  const [now] = useState(() => Date.now())
  const load = () => setReloadKey((k) => k + 1)

  useEffect(() => {
    teamService.members(companyId)
      .then(({ data }) => { setTeam(data); setError(null) })
      .catch((e) => setError(apiMessage(e, "Impossible de charger l'équipe. Vérifiez votre connexion.")))
      .finally(() => setLoading(false))
  }, [companyId, reloadKey])

  const isOwner = team?.role === 'owner'
  const canInvite = team && (team.role === 'owner' || team.role === 'manager')
  const free = team ? team.seat_limit - team.seats_used : 0

  const invite = () => {
    if (team.roles_available.length === 0) {
      toast.error("Votre offre ne permet pas d'inviter. Passez à l'offre Basic ou Pro.")
    } else if (free <= 0) {
      toast.error(`Votre offre permet ${team.seat_limit} personne(s) par entreprise.`)
    } else {
      navigate(`/team/${companyId}/invite`)
    }
  }

  const manageable = (member) => isOwner || (team.role === 'manager' && member.role === 'employee')

  const changeRole = async (member) => {
    setMenuFor(null)
    try {
      await teamService.updateRole(companyId, member.id, member.role === 'manager' ? 'employee' : 'manager')
      load()
    } catch (e) {
      toast.error(apiMessage(e, 'Impossible de changer le profil.'))
    }
  }

  const removeMember = async () => {
    const member = toRemove
    setToRemove(null)
    try {
      await teamService.removeMember(companyId, member.id)
      toast.success(`${member.name} ne fait plus partie de l'équipe.`)
      load()
    } catch (e) {
      toast.error(apiMessage(e, 'Impossible de retirer cette personne.'))
    }
  }

  const cancelInvitation = async () => {
    const invitation = toCancel
    setToCancel(null)
    try {
      await teamService.cancelInvitation(companyId, invitation.id)
      load()
    } catch (e) {
      toast.error(apiMessage(e, "Impossible d'annuler l'invitation."))
    }
  }

  const daysLeft = (invitation) => Math.max(0, Math.ceil((new Date(invitation.expires_at) - now) / 86400000))

  const card = (key, { highlighted, leading, title, subtitle, trailing }) => (
    <div key={key} style={{
      display: 'flex', alignItems: 'center', gap: 16, padding: '30px 28px', borderRadius: 20,
      backgroundColor: highlighted ? '#EAF2FF' : '#fff',
      border: highlighted ? `1.6px solid ${BLUE}` : '1px solid #E5E7EB',
    }}>
      {leading}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 23, fontWeight: '600', color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</p>
        <p style={{ margin: '6px 0 0', fontSize: 18, color: '#757575', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{subtitle}</p>
      </div>
      {trailing}
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <style>{`.team-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 40px 28px; }
        @media (max-width: 640px) { .team-grid { grid-template-columns: 1fr; } }`}</style>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', padding: `18px ${GUTTER}` }}>
        <BackButton onClick={() => navigate('/companies')} />
        <h1 style={{ fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: '700', color: '#111', margin: 0, flex: 1 }}>Équipe</h1>
        {isOwner && (
          <button
            onClick={() => navigate(`/team/${companyId}/activity`)}
            title="Historique" aria-label="Historique"
            style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 8 }}
          >
            <Hourglass size={22} color={ICON_GREY} />
          </button>
        )}
        {canInvite && <PillButton onClick={invite}>Inviter une personne</PillButton>}
        <UserBadge size={48} />
      </div>

      <div style={{ flex: 1, padding: `8px ${GUTTER} 32px` }}>
        {loading && <p style={{ color: '#757575' }}>Chargement…</p>}

        {!loading && !team && (
          <div style={{ backgroundColor: '#f5f5f5', borderRadius: 20, padding: 24 }}>
            <p style={{ margin: '0 0 12px', fontSize: 15, color: '#333' }}>{error}</p>
            <PillButton onClick={() => { setLoading(true); load() }} style={{ padding: '10px 22px', fontSize: 14 }}>Réessayer</PillButton>
          </div>
        )}

        {team && (
          <>
            <p style={{ margin: 0, fontSize: 'clamp(32px, 4.6vw, 46px)', fontWeight: '700', color: '#111' }}>
              {team.seats_used} personne{team.seats_used > 1 ? 's' : ''} sur {team.seat_limit}
            </p>
            <p style={{ margin: '10px 0 22px', fontSize: 20, color: '#757575' }}>
              {free > 0
                ? `Invitez encore ${free} personne${free > 1 ? 's' : ''} pour compléter votre équipe.`
                : 'Toutes les places sont prises.'}
            </p>
            <div style={{ height: 8, borderRadius: 6, backgroundColor: '#E8EBF0', maxWidth: 420, overflow: 'hidden', marginBottom: 52 }}>
              <div style={{ height: '100%', width: `${team.seat_limit ? Math.min(100, (team.seats_used / team.seat_limit) * 100) : 0}%`, backgroundColor: BLUE }} />
            </div>

            <div className="team-grid">
              {card('owner', {
                highlighted: isOwner,
                leading: <Avatar text={initials(team.owner.name)} size={68} />,
                title: team.owner.name,
                subtitle: isOwner ? 'Dirigeant • Vous' : 'Dirigeant',
                trailing: isOwner && (
                  <span style={{ width: 42, height: 42, borderRadius: '50%', backgroundColor: BLUE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Check size={24} color="#fff" />
                  </span>
                ),
              })}

              {team.members.map((member) => card(`m${member.id}`, {
                leading: <Avatar size={68} text={initials(member.name || member.email)}
                  background={member.role === 'manager' ? '#D0E9FF' : '#E8F5E9'}
                  color={member.role === 'manager' ? '#1E88E5' : '#388E3C'} />,
                title: member.name,
                subtitle: member.email,
                trailing: (
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <RoleTag role={member.role} />
                    {manageable(member) && (
                      <>
                        <button
                          onClick={() => setMenuFor(menuFor === member.id ? null : member.id)}
                          aria-label="Actions" title="Actions"
                          style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 6 }}
                        >
                          <MoreHorizontal size={18} color={ICON_GREY} />
                        </button>
                        {menuFor === member.id && (
                          <div style={{
                            position: 'absolute', right: 0, top: 34, zIndex: 20, backgroundColor: '#fff', borderRadius: 14,
                            border: '1px solid #E5E7EB', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', padding: 6, minWidth: 250,
                          }}>
                            {isOwner && team.roles_available.length > 1 && (
                              <button onClick={() => changeRole(member)} style={menuItem}>
                                {member.role === 'manager' ? 'Passer en Employé' : 'Passer en Responsable'}
                              </button>
                            )}
                            <button onClick={() => { setMenuFor(null); setToRemove(member) }} style={{ ...menuItem, color: '#e53935' }}>
                              Retirer de l'équipe
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ),
              }))}

              {team.invitations.map((invitation) => {
                const days = daysLeft(invitation)
                return card(`i${invitation.id}`, {
                  leading: <Avatar size={68} icon={<Hourglass size={28} color="#9E9E9E" />} background={ICON_BG} />,
                  title: invitation.name || invitation.email,
                  subtitle: `En attente • ${days <= 1 ? "expire aujourd'hui" : `expire dans ${days} jours`}`,
                  trailing: (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <RoleTag role={invitation.role} />
                      <button
                        onClick={() => setToCancel(invitation)}
                        aria-label="Annuler l'invitation" title="Annuler l'invitation"
                        style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 6 }}
                      >
                        <X size={18} color="#9E9E9E" />
                      </button>
                    </div>
                  ),
                })
              })}
            </div>
          </>
        )}
      </div>

      <ConfirmDialog
        open={!!toRemove}
        icon="delete"
        title={toRemove ? `Retirer ${toRemove.name} ?` : ''}
        message="Cette personne n'aura plus accès à l'entreprise. Ses documents restent dans l'entreprise."
        confirmLabel="Retirer"
        confirmColor="#1E88E5"
        onConfirm={removeMember}
        onCancel={() => setToRemove(null)}
      />
      <ConfirmDialog
        open={!!toCancel}
        icon="warning"
        title="Annuler l'invitation ?"
        message={toCancel ? `Le code envoyé à ${toCancel.email} ne fonctionnera plus.` : ''}
        confirmLabel="Annuler l'invitation"
        cancelLabel="Garder"
        onConfirm={cancelInvitation}
        onCancel={() => setToCancel(null)}
      />
    </div>
  )
}

const menuItem = {
  display: 'block', width: '100%', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer',
  padding: '14px 16px', borderRadius: 10, fontSize: 18, color: '#222',
}

