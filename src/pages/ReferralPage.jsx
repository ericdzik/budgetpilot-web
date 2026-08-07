import { useState, useEffect, useRef } from 'react'
import { toast } from 'react-hot-toast'
import { ClipboardCopy, Send, QrCode, Gift, Download } from 'lucide-react'
import QRCode from 'qrcode'
import { jsPDF } from 'jspdf'
import { referralService } from '../services/referralService'
import UserBadge from '../components/ui/UserBadge'
import useAuthStore from '../store/authStore'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(amount) {
  if (!amount && amount !== 0) return '0'
  return Number(amount).toLocaleString('fr-FR').replace(/\s/g, '.')
}

function fmtDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ─── Sous-composants ──────────────────────────────────────────────────────────

/** Carte KPI — layout horizontal : icône | label + devise/montant à droite */
function KpiCard({ icon: Icon, imgSrc, iconColor, bgColor, label, value }) {
  const parts = value.split(' ')
  const amount = parts.slice(0, -1).join(' ')
  const currencyCode = parts[parts.length - 1]

  return (
    <div style={{
      background: '#fff',
      borderRadius: '20px',
      padding: '40px 32px',
      minHeight: '150px',
      display: 'flex',
      alignItems: 'center',
      gap: '24px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      width: '100%',
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: '50%',
        background: bgColor, display: 'flex', alignItems: 'center',
        justifyContent: 'center', flexShrink: 0,
      }}>
        {imgSrc ? (
          <img src={imgSrc} alt="" width={28} height={28} style={{ display: 'block' }} />
        ) : (
          <Icon size={28} color={iconColor} />
        )}
      </div>
      <div style={{ fontWeight: '900', fontSize: '22px', color: '#111', flex: 1 }}>
        {label}
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: '16px', color: '#888', fontWeight: '800', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>
          {currencyCode}
        </div>
        <div style={{ fontSize: '44px', fontWeight: '900', color: '#111', lineHeight: 1 }}>
          {amount}
        </div>
      </div>
    </div>
  )
}

/** Icônes SVG des marques */
const BrandIcons = {
  whatsapp: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="#25D366">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  ),
  telegram: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="#0088CC">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
    </svg>
  ),
  email: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#FF9800" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <polyline points="2,4 12,13 22,4"/>
    </svg>
  ),
  copy: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
  ),
  sms: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#1E88E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  ),
}

/** Bouton de partage avec vrai logo de marque */
function ShareBtn({ label, color, bgColor, brandIcon, onClick }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
        background: hovered ? bgColor : `${bgColor}99`,
        border: 'none', borderRadius: '12px', padding: '14px 16px',
        cursor: 'pointer', transition: 'all 0.15s', flex: 1,
      }}
    >
      {brandIcon}
      <span style={{ fontSize: '13px', color, fontWeight: '600' }}>{label}</span>
    </button>
  )
}

/** Ligne d'un filleul dans l'historique */
function FilleulRow({ filleul, currency, isLast }) {
  const isPending = !filleul.commission_status || filleul.commission_status === 'pending'
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '18px',
      padding: '22px 24px',
      borderBottom: isLast ? 'none' : '1px solid #f5f5f5',
    }}>
      {/* Avatar initiale */}
      <div style={{
        width: 50, height: 50, borderRadius: '50%', background: '#f0f0f0',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '20px', fontWeight: '900', color: '#888', flexShrink: 0,
      }}>
        {filleul.name?.[0]?.toUpperCase() || '?'}
      </div>
      {/* Nom + date */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '18px', fontWeight: '900', color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {filleul.name}
        </div>
        <div style={{ fontSize: '14px', fontWeight: '600', color: '#aaa', marginTop: '4px' }}>{fmtDate(filleul.joined_at)}</div>
      </div>
      {/* Montant + statut */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: '20px', fontWeight: '900', color: '#111' }}>
          +{fmt(filleul.commission_amount)} {filleul.commission_currency || currency}
        </div>
        <div style={{
          fontSize: '16px', fontWeight: '700', marginTop: '5px',
          color: isPending ? '#FF9800' : '#4CAF50',
          display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end',
        }}>
          <span>{isPending ? '●' : '✓'}</span>
          <span>{isPending ? 'En attente' : 'Versée'}</span>
        </div>
      </div>
    </div>
  )
}

/** Ligne d'un top filleul */
function TopFilleulRow({ filleul, rank, currency, isFirst }) {
  // Couleurs podium custom — plus d'emojis
  const rankStyles = [
    { bg: '#FFD700', color: '#7A5800', label: '1' }, // Or
    { bg: '#C0C0C0', color: '#555',    label: '2' }, // Argent
    { bg: '#CD7F32', color: '#fff',    label: '3' }, // Bronze
  ]
  const badge = rankStyles[rank] ?? { bg: '#e0e0e0', color: '#888', label: `${rank + 1}` }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '18px',
      padding: '22px 24px',
      background: isFirst ? '#1E88E5' : '#fff',
      borderRadius: isFirst ? '12px 12px 0 0' : '0',
      borderBottom: isFirst ? 'none' : '1px solid #f5f5f5',
    }}>
      {/* Badge rang CSS */}
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        background: badge.bg, color: badge.color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '16px', fontWeight: '900', flexShrink: 0,
        boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
      }}>
        {badge.label}
      </div>
      {/* Avatar initiale */}
      <div style={{
        width: 46, height: 46, borderRadius: '50%',
        background: isFirst ? 'rgba(255,255,255,0.25)' : '#f0f0f0',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '18px', fontWeight: '900',
        color: isFirst ? '#fff' : '#888', flexShrink: 0,
      }}>
        {filleul.name?.[0]?.toUpperCase() || '?'}
      </div>
      {/* Nom */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '18px', fontWeight: '900',
          color: isFirst ? '#fff' : '#111',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {filleul.name}
        </div>
      </div>
      <div style={{ fontSize: '22px', fontWeight: '900', color: isFirst ? '#fff' : '#111', flexShrink: 0 }}>
        +{fmt(filleul.commission_amount)} {filleul.commission_currency || currency}
      </div>
    </div>
  )
}

// ─── Modal QR Code ────────────────────────────────────────────────────────────

function QrModal({ referralLink, referralCode, onClose }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (canvasRef.current && referralLink) {
      QRCode.toCanvas(canvasRef.current, referralLink, { width: 200, margin: 2 })
    }
  }, [referralLink])

  const getQrDataUrl = () => {
    const canvas = canvasRef.current
    if (!canvas) return null
    return canvas.toDataURL('image/png')
  }

  const handleDownloadPng = () => {
    const dataUrl = getQrDataUrl()
    if (!dataUrl) return
    const link = document.createElement('a')
    link.download = `qr-parrainage-${referralCode}.png`
    link.href = dataUrl
    link.click()
    toast.success('QR Code PNG téléchargé')
  }

  const handleDownloadPdf = () => {
    const dataUrl = getQrDataUrl()
    if (!dataUrl) return

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pageW = doc.internal.pageSize.getWidth()

    // Titre
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(22)
    doc.setTextColor(30, 136, 229)
    doc.text('Budget Pilot', pageW / 2, 28, { align: 'center' })

    // Sous-titre
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(13)
    doc.setTextColor(80, 80, 80)
    doc.text('Mon code de parrainage', pageW / 2, 38, { align: 'center' })

    // QR Code centré (60×60mm)
    const qrSize = 60
    const qrX = (pageW - qrSize) / 2
    doc.addImage(dataUrl, 'PNG', qrX, 50, qrSize, qrSize)

    // Cadre autour du QR
    doc.setDrawColor(200, 200, 200)
    doc.setLineWidth(0.5)
    doc.roundedRect(qrX - 4, 46, qrSize + 8, qrSize + 8, 4, 4)

    // Code alphanumérique
    doc.setFont('courier', 'bold')
    doc.setFontSize(20)
    doc.setTextColor(17, 17, 17)
    doc.text(referralCode, pageW / 2, 122, { align: 'center', charSpace: 4 })

    // Lien de parrainage
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(130, 130, 130)
    doc.text(referralLink, pageW / 2, 132, { align: 'center' })

    // Ligne séparatrice
    doc.setDrawColor(230, 230, 230)
    doc.setLineWidth(0.3)
    doc.line(20, 140, pageW - 20, 140)

    // Message d'invitation
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    doc.setTextColor(80, 80, 80)
    doc.text(
      `Scannez ce QR Code pour rejoindre Budget Pilot\net bénéficier d'un mois Pro offert !`,
      pageW / 2, 150, { align: 'center' }
    )

    // Footer
    doc.setFontSize(8)
    doc.setTextColor(160, 160, 160)
    doc.text('www.getbudgetpilot.com', pageW / 2, 275, { align: 'center' })

    doc.save(`qr-parrainage-${referralCode}.pdf`)
    toast.success('QR Code PDF téléchargé')
  }

  const handleShare = async () => {
    const dataUrl = getQrDataUrl()
    if (!dataUrl) return

    // Convertir dataUrl en Blob pour le Web Share API
    const res = await fetch(dataUrl)
    const blob = await res.blob()
    const file = new File([blob], `qr-parrainage-${referralCode}.png`, { type: 'image/png' })

    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: 'Mon code de parrainage Budget Pilot',
          text: `Rejoins Budget Pilot avec mon code ${referralCode} : ${referralLink}`,
          files: [file],
        })
      } catch (e) {
        if (e.name !== 'AbortError') toast.error('Partage annulé')
      }
    } else {
      // Fallback : copier le lien
      navigator.clipboard.writeText(referralLink)
      toast.success('Lien copié ! (partage de fichier non supporté sur ce navigateur)')
    }
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode)
    toast.success('Code copié !')
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }} onClick={onClose}>
      <div style={{
        background: '#fff', borderRadius: '20px', padding: '32px',
        width: '360px', textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }} onClick={e => e.stopPropagation()}>
        <h3 style={{ margin: '0 0 24px', fontSize: '18px', fontWeight: '700' }}>Mon QR Code</h3>

        {/* Canvas QR */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <canvas ref={canvasRef} style={{ borderRadius: '12px', border: '1px solid #f0f0f0' }} />
        </div>

        {/* Code avec copier */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '24px' }}>
          <span style={{ fontSize: '14px', color: '#888' }}>Code :</span>
          <span style={{ fontSize: '16px', fontWeight: '700', letterSpacing: '2px' }}>{referralCode}</span>
          <button onClick={handleCopyCode} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1E88E5', display: 'flex', padding: '2px' }}>
            <ClipboardCopy size={16} />
          </button>
        </div>

        {/* Boutons téléchargement */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
          <button onClick={handleDownloadPng} style={{
            flex: 1, padding: '12px 8px', background: '#f5f7fa',
            color: '#333', border: '1px solid #e0e0e0', borderRadius: '12px',
            fontSize: '13px', fontWeight: '600', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
          }}>
            <Download size={14} /> PNG
          </button>
          <button onClick={handleDownloadPdf} style={{
            flex: 1, padding: '12px 8px', background: '#1E88E5', color: '#fff',
            border: 'none', borderRadius: '12px', fontSize: '13px', fontWeight: '600',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
          }}>
            <Download size={14} /> PDF
          </button>
        </div>

        {/* Bouton Partager */}
        <button onClick={handleShare} style={{
          width: '100%', padding: '12px', background: 'transparent',
          color: '#1E88E5', border: '1.5px solid #1E88E5', borderRadius: '12px',
          fontSize: '14px', fontWeight: '600', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          marginBottom: '10px',
        }}>
          <Send size={15} /> Partager le QR Code
        </button>

        <button onClick={onClose} style={{
          width: '100%', padding: '12px', background: 'transparent', color: '#aaa',
          border: 'none', borderRadius: '12px', fontSize: '14px', cursor: 'pointer',
        }}>
          Fermer
        </button>
      </div>
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function ReferralPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showQr, setShowQr] = useState(false)

  useEffect(() => {
    referralService.getInfo()
      .then(res => setData(res.data?.data))
      .catch(() => toast.error('Impossible de charger les données de parrainage'))
      .finally(() => setLoading(false))
  }, [])

  const currency = data?.currency || 'XOF'
  const referralCode = data?.referral_code || '--------'
  const referralLink = data?.referral_link || ''
  const shareMessage = `Rejoins Budget Pilot avec mon code ${referralCode} : ${referralLink}`

  const copyCode = () => {
    navigator.clipboard.writeText(referralCode)
    toast.success('Code copié !')
  }

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink)
    toast.success('Lien copié !')
  }

  const share = (platform) => {
    const msg = encodeURIComponent(shareMessage)
    const urls = {
      whatsapp: `https://wa.me/?text=${msg}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(`Rejoins Budget Pilot avec mon code ${referralCode}`)}`,
      sms: `sms:?body=${msg}`,
      email: `mailto:?subject=Budget Pilot&body=${msg}`,
    }
    const url = urls[platform]
    if (!url) return
    if (platform === 'sms' || platform === 'email') {
      window.location.href = url
    } else {
      window.open(url, '_blank')
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '40px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #1E88E5', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
      </div>
    )
  }

  const hasFilleuls = data?.filleuls?.length > 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>

      {/* ── Header pleine largeur ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 32px',
        flexShrink: 0,
      }}>
        <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '700', color: '#111' }}>Parrainage</h1>
        <UserBadge size={48} />
      </div>

      {/* ── Contenu ── */}
      <div style={{ padding: '0 32px 60px', width: '100%', boxSizing: 'border-box' }}>

      {/* Layout 2 colonnes */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>

        {/* ── Colonne gauche ── */}
        <div>
          {/* Hero card */}
          <div style={{
            background: '#fff', borderRadius: '20px', padding: '28px',
            boxShadow: '0 2px 16px rgba(0,0,0,0.07)', marginBottom: '16px',
            position: 'relative', overflow: 'hidden',
          }}>
            {/* Décor bleu */}
            <div style={{
              position: 'absolute', top: 0, right: 0,
              width: 90, height: 90, background: 'rgba(30,136,229,0.12)',
              borderRadius: '0 20px 0 90px',
            }} />

            <h2 style={{ margin: '32px 0 36px', fontSize: '36px', fontWeight: '700', lineHeight: 1.3, maxWidth: '320px' }}>
              Gagne de l'argent dès que tes filleuls s'abonnent
            </h2>

            {/* Code */}
            <div style={{ fontSize: '16px', color: '#888', marginBottom: '12px' }}>Ton code</div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              background: '#f5f7fa', borderRadius: '12px', padding: '16px 20px',
              marginBottom: '32px', border: '1px solid #e8eaed',
            }}>
              <span style={{ flex: 1, fontSize: '24px', fontWeight: '700', letterSpacing: '3px', fontFamily: 'monospace' }}>
                {referralCode}
              </span>
              <button onClick={copyCode} style={{
                background: 'rgba(30,136,229,0.1)', border: 'none', borderRadius: '8px',
                padding: '10px', cursor: 'pointer', color: '#1E88E5', display: 'flex',
              }}>
                <ClipboardCopy size={20} />
              </button>
            </div>

            {/* Partage ton lien */}
            <div style={{ fontSize: '16px', color: '#888', marginBottom: '16px' }}>Partage ton lien</div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '28px' }}>
              <ShareBtn label="WhatsApp" color="#25D366" bgColor="#E8F9EE" brandIcon={BrandIcons.whatsapp} onClick={() => share('whatsapp')} />
              <ShareBtn label="Telegram" color="#0088CC" bgColor="#E3F4FC" brandIcon={BrandIcons.telegram} onClick={() => share('telegram')} />
              <ShareBtn label="SMS"      color="#1E88E5" bgColor="#E3F2FD" brandIcon={BrandIcons.sms}      onClick={() => share('sms')} />
              <ShareBtn label="Email"    color="#FF9800" bgColor="#FFF3E0" brandIcon={BrandIcons.email}    onClick={() => share('email')} />
              <ShareBtn label="Copier"   color="#6B7280" bgColor="#F3F4F6" brandIcon={BrandIcons.copy}     onClick={copyLink} />
            </div>

            {/* Bouton QR */}
            <button onClick={() => setShowQr(true)} style={{
              width: '100%', padding: '12px', background: 'transparent',
              border: '1.5px solid #1E88E5', borderRadius: '12px',
              color: '#1E88E5', fontSize: '14px', fontWeight: '600',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              transition: 'background 0.15s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(30,136,229,0.06)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <QrCode size={16} /> Voir mon QR Code
            </button>
          </div>

          {/* KPIs empilés */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
            <KpiCard
              imgSrc="/icone_banque.svg" bgColor="rgba(243, 243, 243, 1)"
              label="Prochain versement"
              value={`${fmt(data?.next_payout || 0)} ${currency}`}
            />
            <KpiCard
              imgSrc="/icone_parrainage.svg" bgColor="rgba(243, 243, 243, 1)"
              label="Total gagné"
              value={`${fmt(data?.total_gained || 0)} ${currency}`}
            />
          </div>

          {/* Note */}
          <p style={{ fontSize: '12px', color: '#aaa', margin: '0 4px', lineHeight: 1.5 }}>
            ℹ️ Vous gagnez 10% de la valeur TTC des abonnements de chacun de vos filleuls.{' '}
            <span style={{ color: '#1E88E5' }}>
              Valable sur tous les abonnements. Les conditions et exigences sont détaillées dans la CGU &amp; Politique de Confidentialité.
            </span>
          </p>
        </div>

        {/* ── Colonne droite ── */}
        <div>
          {hasFilleuls ? (
            <>
              {/* Top filleuls */}
              <h3 style={{ margin: '0 0 14px', fontSize: '18px', fontWeight: '700' }}>Top filleuls</h3>
              <div style={{
                background: '#fff', borderRadius: '16px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)', overflow: 'hidden', marginBottom: '24px',
              }}>
                {data.top_filleuls.map((f, i) => (
                  <TopFilleulRow key={f.id || i} filleul={f} rank={i} currency={currency} isFirst={i === 0} />
                ))}
              </div>

              {/* Historique filleuls */}
              <h3 style={{ margin: '0 0 14px', fontSize: '18px', fontWeight: '700' }}>Historique filleuls</h3>
              <div style={{
                background: '#fff', borderRadius: '16px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: '24px', overflow: 'hidden',
              }}>
                {data.filleuls.map((f, i) => (
                  <FilleulRow key={f.id || i} filleul={f} currency={currency} isLast={i === data.filleuls.length - 1} />
                ))}
              </div>
            </>
          ) : (
            /* État vide */
            <div style={{
              background: '#fff', borderRadius: '20px', padding: '48px 32px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)', textAlign: 'center',
            }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>👥</div>
              <h3 style={{ margin: '0 0 10px', fontSize: '18px', fontWeight: '700' }}>Pas encore de filleuls</h3>
              <p style={{ color: '#888', fontSize: '14px', marginBottom: '24px', lineHeight: 1.6 }}>
                Partagez votre code et commencez à gagner 10% sur chaque abonnement souscrit.
              </p>
              <button onClick={() => share('whatsapp')} style={{
                padding: '12px 28px', background: '#1E88E5', color: '#fff',
                border: 'none', borderRadius: '12px', fontSize: '15px',
                fontWeight: '600', cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: '8px',
              }}>
                <Send size={16} /> Partager maintenant
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal QR */}
      {showQr && (
        <QrModal
          referralLink={referralLink}
          referralCode={referralCode}
          onClose={() => setShowQr(false)}
        />
      )}
      </div>
    </div>
  )
}
