import { createBrowserRouter, Navigate } from 'react-router-dom'
import NotFoundPage from './pages/NotFoundPage'
import AppRedirectPage from './pages/AppRedirectPage'
import useAuthStore from './store/authStore'
import useTrackingAuthStore from './store/trackingAuthStore'
import useAdminAuthStore from './store/adminAuthStore'

// Layouts
import AppLayout from './components/layout/AppLayout'
import AuthLayout from './components/layout/AuthLayout'
import TrackingLayout from './components/layout/TrackingLayout'
import AdminLayout from './components/layout/AdminLayout'

// Pages Auth
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'

// Pages Tracking
import TrackingLoginPage from './pages/tracking/TrackingLoginPage'
import TrackingAnalysesPage from './pages/tracking/TrackingAnalysesPage'
import TrackingHistoriquePage from './pages/tracking/TrackingHistoriquePage'
import TrackingQRCodesPage from './pages/tracking/TrackingQRCodesPage'
import TrackingCalendrierPage from './pages/tracking/TrackingCalendrierPage'
import TrackingSettingsPage from './pages/tracking/TrackingSettingsPage'

// Pages Admin
import AdminLoginPage from './pages/admin/AdminLoginPage'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminUsersPage from './pages/admin/AdminUsersPage'
import AdminUserDetailPage from './pages/admin/AdminUserDetailPage'
import AdminReferralsPage from './pages/admin/AdminReferralsPage'
import AdminReferrerDetailPage from './pages/admin/AdminReferrerDetailPage'
import AdminBannersPage from './pages/admin/AdminBannersPage'

// Pages App
import DashboardPage from './pages/DashboardPage'
import DocumentsPage from './pages/DocumentsPage'
import DocumentFormPage from './pages/DocumentFormPage'
import ExpenseFormPage from './pages/ExpenseFormPage'
import RevenueFormPage from './pages/RevenueFormPage'
import ClientsPage from './pages/ClientsPage'
import ClientDetailPage from './pages/ClientDetailPage'
import ExpensesPage from './pages/ExpensesPage'
import RevenuePage from './pages/RevenuePage'
import HistoryPage from './pages/HistoryPage'
import StatsPage from './pages/StatsPage'
import SubscriptionPage from './pages/SubscriptionPage'
import SettingsPage from './pages/SettingsPage'
import ProfilePage from './pages/ProfilePage'
import PersonalProfilePage from './pages/PersonalProfilePage'
import CompanyProfilePage from './pages/CompanyProfilePage'
import FaqPage from './pages/FaqPage'
import TermsPage from './pages/TermsPage'
import ContactPage from './pages/ContactPage'
import ReferralPage from './pages/ReferralPage'

// Route protégée app Budget Pilot
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

// Route publique (redirige si déjà connecté)
function PublicRoute({ children }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children
}

// Route publique tracking (redirige si déjà connecté tracking)
function TrackingPublicRoute({ children }) {
  const { isTrackingAuthenticated } = useTrackingAuthStore()
  return isTrackingAuthenticated ? <Navigate to="/tracking/analyses" replace /> : children
}

// Route protégée tracking (redirige vers login si non connecté)
function ProtectedTrackingRoute({ children }) {
  const { isTrackingAuthenticated } = useTrackingAuthStore()
  return isTrackingAuthenticated ? children : <Navigate to="/tracking/login" replace />
}

// Route publique admin (redirige si déjà connecté)
function AdminPublicRoute({ children }) {
  const { isAdminAuthenticated } = useAdminAuthStore()
  return isAdminAuthenticated ? <Navigate to="/admin/dashboard" replace /> : children
}

// Route protégée admin
function ProtectedAdminRoute({ children }) {
  const { isAdminAuthenticated } = useAdminAuthStore()
  return isAdminAuthenticated ? children : <Navigate to="/admin/login" replace />
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '/',
    element: (
      <PublicRoute>
        <AuthLayout />
      </PublicRoute>
    ),
    children: [
      { path: 'forgot-password', element: <ForgotPasswordPage /> },
    ],
  },
  // Login et Register gèrent leur propre layout plein écran
  {
    path: '/login',
    element: (
      <PublicRoute>
        <LoginPage />
      </PublicRoute>
    ),
  },
  // Register gère ses propres étapes plein écran
  {
    path: '/register',
    element: (
      <PublicRoute>
        <RegisterPage />
      </PublicRoute>
    ),
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'history', element: <HistoryPage /> },
      { path: 'stats', element: <StatsPage /> },
      { path: 'subscription', element: <SubscriptionPage /> },
      { path: 'referral', element: <ReferralPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'profile/personal', element: <PersonalProfilePage /> },
      { path: 'profile/company', element: <CompanyProfilePage /> },
      { path: 'faq', element: <FaqPage /> },
      { path: 'terms', element: <TermsPage /> },
      { path: 'contact', element: <ContactPage /> },
      { path: 'documents', element: <DocumentsPage /> },
      { path: 'documents/new', element: <DocumentFormPage /> },
      { path: 'documents/:id/edit', element: <DocumentFormPage /> },
      { path: 'clients', element: <ClientsPage /> },
      { path: 'clients/:id', element: <ClientDetailPage /> },
      { path: 'expenses', element: <ExpensesPage /> },
      { path: 'expenses/new', element: <ExpenseFormPage /> },
      { path: 'expenses/:id/edit', element: <ExpenseFormPage /> },
      { path: 'revenues/new', element: <RevenueFormPage /> },
      { path: 'revenues/:id/edit', element: <RevenueFormPage /> },
      { path: 'revenues', element: <RevenuePage /> },
      // TODO: Ajouter les autres routes (revenues, stats, settings, etc.)
    ],
  },

  // ── Routes Tracking Getdenis ───────────────────────────────────────────────
  {
    path: '/tracking/login',
    element: (
      <TrackingPublicRoute>
        <TrackingLoginPage />
      </TrackingPublicRoute>
    ),
  },
  {
    path: '/tracking',
    element: (
      <ProtectedTrackingRoute>
        <TrackingLayout />
      </ProtectedTrackingRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/tracking/analyses" replace /> },
      { path: 'analyses',    element: <TrackingAnalysesPage /> },
      { path: 'historique',  element: <TrackingHistoriquePage /> },
      { path: 'calendrier',  element: <TrackingCalendrierPage /> },
      { path: 'qrcodes',     element: <TrackingQRCodesPage /> },
      { path: 'parametres',  element: <TrackingSettingsPage /> },
    ],
  },

  // ── Lien universel d'installation — parrainage & Meta Ads ────────────────
  // /app?ref=CODE → redirige vers Play Store (Android), App Store (iOS) ou site web (desktop)
  {
    path: '/app',
    element: <AppRedirectPage />,
  },

  // Catch-all — page 404
  {
    path: '*',
    element: <NotFoundPage />,
  },

  // ── Routes Admin Budget Pilot ──────────────────────────────────────────────
  {
    path: '/admin/login',
    element: (
      <AdminPublicRoute>
        <AdminLoginPage />
      </AdminPublicRoute>
    ),
  },
  {
    path: '/admin',
    element: (
      <ProtectedAdminRoute>
        <AdminLayout />
      </ProtectedAdminRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/admin/dashboard" replace /> },
      { path: 'dashboard',    element: <AdminDashboardPage /> },
      { path: 'users',        element: <AdminUsersPage /> },
      { path: 'users/:id',    element: <AdminUserDetailPage /> },
      { path: 'referrals',         element: <AdminReferralsPage /> },
      { path: 'referrals/:id',     element: <AdminReferrerDetailPage /> },
      { path: 'banners',      element: <AdminBannersPage /> },
    ],
  },
])
