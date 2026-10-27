import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock } from 'lucide-react'
import UserBadge from '../components/ui/UserBadge'
import CompanyAvatar from '../components/company/CompanyAvatar'
import { companyService } from '../services/companyService'
import useCompanyStore from '../store/companyStore'
import { ALL_CURRENCIES, formatAmount, formatAmountOnly } from '../store/currencyStore'

const GUTTER = 'clamp(14px, 3vw, 28px)'
const PERIODS = [
  { value: 'day', label: "Aujourd'hui" },
  { value: 'month', label: 'Ce mois' },
  { value: 'year', label: 'Cette année' },
]

function Pill({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      border: active ? 'none' : '1px solid #e0e0e0', borderRadius: '50px', padding: '8px 18px',
      cursor: 'pointer', fontSize: '14px', fontWeight: '600',
      backgroundColor: active ? '#1E88E5' : '#fff', color: active ? '#fff' : '#555',
    }}>
      {children}
    </button>
  )
}

function Figure({ label, value, currency, tone }) {
  return (
    <div style={{ backgroundColor: tone, borderRadius: '24px', padding: '16px 20px', minWidth: 0 }}>
      <span style={{
        display: 'inline-block', border: '1px solid #1E88E5', borderRadius: '50px', color: '#1E88E5',
        padding: '2px 12px', fontSize: '13px', fontWeight: '600', backgroundColor: '#fff',
      }}>
        {label}
      </span>
      <p style={{ margin: '12px 0 0', fontSize: '28px', fontWeight: '700', color: '#111', letterSpacing: '-0.5px' }}>
        {formatAmountOnly(value, currency)}
      </p>
    </div>
  )
}

/** Cumul de toutes les entreprises du compte, converti dans une seule devise. Lecture seule. */
export default function ConsolidatedPage() {
  const navigate = useNavigate()
  const companies = useCompanyStore((s) => s.companies)
  const [period, setPeriod] = useState('month')
  const [currency, setCurrency] = useState('')
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    companyService.consolidated({ period, ...(currency ? { currency } : {}) })
      .then(({ data: result }) => { if (!cancelled) { setData(result); setError('') } })
      .catch((err) => {
        if (cancelled) return
        if (err.response?.data?.code === 'single_company') navigate('/dashboard', { replace: true })
        else setError(err.response?.data?.message || 'Impossible de charger le cumul. Vérifiez votre connexion.')
      })
    return () => { cancelled = true }
  }, [period, currency, navigate, companies.length])

  const shown = data?.currency

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <style>{`
        .cons-totals { display: grid; grid-template-columns: 1.5fr 1fr 1fr 1fr; gap: 16px; }
        .cons-row { display: grid; grid-template-columns: minmax(220px, 1fr) 2fr; gap: 16px 24px; align-items: center; }
        .cons-figures { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px 24px; }
        @media (max-width: 1280px) {
          .cons-totals { grid-template-columns: repeat(3, minmax(0, 1fr)); }
          .cons-totals > :first-child { grid-column: 1 / -1; }
        }
        @media (max-width: 1100px) {
          .cons-row { grid-template-columns: 1fr; }
        }
        @media (max-width: 760px) {
          .cons-totals { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .cons-totals > :last-child { grid-column: 1 / -1; }
        }
        @media (max-width: 520px) {
          .cons-totals { grid-template-columns: 1fr; }
        }
        @media (max-width: 640px) {
          .cons-figures { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
      `}</style>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap',
        gap: 12, padding: `18px ${GUTTER}`,
      }}>
        <h1 style={{ fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: '700', color: '#111', margin: 0 }}>
          Toutes mes entreprises
        </h1>
        <UserBadge size={48} />
      </div>

      <div style={{ padding: `0 ${GUTTER} 32px`, display: 'flex', flexDirection: 'column', gap: 16, width: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {PERIODS.map((p) => (
            <Pill key={p.value} active={period === p.value} onClick={() => setPeriod(p.value)}>{p.label}</Pill>
          ))}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <label style={{ fontSize: '13px', color: '#808080' }}>Devise du cumul</label>
            <select
              value={shown || ''}
              onChange={(e) => setCurrency(e.target.value)}
              style={{ border: '1px solid #e0e0e0', borderRadius: '50px', padding: '8px 14px', fontSize: '14px', backgroundColor: '#fff', maxWidth: '100%' }}
            >
              {!shown && <option value="">…</option>}
              {ALL_CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.name} ({c.code})</option>)}
            </select>
          </div>
        </div>

        {error && (
          <div style={{ backgroundColor: '#f5f5f5', borderRadius: '20px', padding: '20px 24px', color: '#666', fontSize: '14px' }}>
            {error}
          </div>
        )}

        {data && (
          <>
            {!data.conversion_available && (
              <div style={{ backgroundColor: '#FFF3E0', border: '1px solid #FFCC80', borderRadius: '14px', padding: '12px 16px', fontSize: '14px', color: '#E65100' }}>
                Certains taux de change sont indisponibles : les totaux sont incomplets.
              </div>
            )}

            <div className="cons-totals">
              <div style={{ backgroundColor: '#1E88E5', borderRadius: '28px', padding: '20px', color: '#fff' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <span style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '20px', padding: '4px 14px', fontSize: '22px', fontWeight: '600' }}>
                    Caisse cumulée
                  </span>
                  <span style={{ fontSize: '22px', opacity: 0.85 }}>{shown}</span>
                </div>
                <div style={{ fontSize: '40px', fontWeight: '700', letterSpacing: '-1px' }}>
                  {formatAmountOnly(data.totals.profit, shown)}
                </div>
                <div style={{ fontSize: '13px', opacity: 0.8, marginTop: 4 }}>Recettes moins dépenses, toutes entreprises</div>
              </div>
              <Figure label="Recettes" value={data.totals.income} currency={shown} tone="#e3f2fd" />
              <Figure label="Dépenses" value={data.totals.expenses} currency={shown} tone="#f5f5f5" />
              <Figure label={`Impayés (${data.totals.unpaid_count})`} value={data.totals.unpaid_amount} currency={shown} tone="#FFF3E0" />
            </div>

            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#111', margin: '8px 0 0' }}>Détail par entreprise</h2>
            {data.companies.map((c) => (
              <div key={c.id} style={{ backgroundColor: '#fff', border: '1px solid #e8eaed', borderRadius: '20px', padding: '16px 20px' }}>
                <div className="cons-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
                    <CompanyAvatar company={c} size={44} />
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#111' }}>
                        {c.name}
                        {c.is_primary && (
                          <span style={{ marginLeft: 8, padding: '2px 8px', borderRadius: '50px', fontSize: '11px', backgroundColor: '#f5f5f5', color: '#616161' }}>Principale</span>
                        )}
                        {!c.editable && (
                          <span style={{ marginLeft: 8, display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 8px', borderRadius: '50px', fontSize: '11px', backgroundColor: '#FFF3E0', color: '#E65100' }}>
                            <Lock size={10} /> Lecture seule
                          </span>
                        )}
                      </p>
                      <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#808080' }}>Devise : {c.currency}</p>
                    </div>
                  </div>
                  <div className="cons-figures">
                    {[
                      ['Recettes', c.own.income, c.converted.income],
                      ['Dépenses', c.own.expenses, c.converted.expenses],
                      ['Solde', c.own.profit, c.converted.profit],
                      [`Impayés (${c.own.unpaid_count})`, c.own.unpaid_amount, c.converted.unpaid_amount],
                    ].map(([label, own, converted]) => (
                      <div key={label} style={{ minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: '12px', color: '#808080' }}>{label}</p>
                        <p style={{ margin: '2px 0 0', fontSize: '15px', fontWeight: '700', color: '#111' }}>{formatAmount(own, c.currency)}</p>
                        {c.currency !== shown && (
                          <p style={{ margin: 0, fontSize: '12px', color: '#808080' }}>≈ {formatAmount(converted, shown)}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            <p style={{ margin: 0, fontSize: '12px', color: '#808080' }}>
              Montants convertis en {shown} au taux du jour. Consultation uniquement : ouvrez une entreprise pour y travailler.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
