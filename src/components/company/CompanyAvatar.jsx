import { useState } from 'react'
import { STORAGE_BASE_URL } from '../../config/constants'
import { companyInitials } from './companyInitials'

/** Médaillon d'une entreprise : son logo, ou ses initiales en bleu sur fond clair. */
export default function CompanyAvatar({ company, size = 44 }) {
  const [failed, setFailed] = useState(false)
  const hasLogo = company.logo_path && company.logo_path !== '0' && !failed

  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      backgroundColor: '#e3f2fd', color: '#1E88E5',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.36, fontWeight: '700', overflow: 'hidden',
    }}>
      {hasLogo
        ? <img
            src={`${STORAGE_BASE_URL}/${company.logo_path}`}
            alt={company.name}
            onError={() => setFailed(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        : companyInitials(company.name)}
    </div>
  )
}
