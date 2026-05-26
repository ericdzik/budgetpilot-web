import { createBrowserRouter, Navigate } from 'react-router-dom'
import useAuthStore from './store/authStore'

// Layouts
import AppLayout from './components/layout/AppLayout'
import AuthLayout from './components/layout/AuthLayout'

// Pages Auth
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'

// Pages App
import DashboardPage from './pages/DashboardPage'
import DocumentsPage from './pages/DocumentsPage'
import DocumentFormPage from './pages/DocumentFormPage'
import ExpenseFormPage from './pages/ExpenseFormPage'
import RevenueFormPage from './pages/RevenueFormPage'
import ClientsPage from './pages/ClientsPage'
import ExpensesPage from './pages/ExpensesPage'
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

// Route protégée
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

// Route publique (redirige si déjà connecté)
function PublicRoute({ children }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children
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
      { path: 'expenses', element: <ExpensesPage /> },
      { path: 'expenses/new', element: <ExpenseFormPage /> },
      { path: 'expenses/:id/edit', element: <ExpenseFormPage /> },
      { path: 'revenues/new', element: <RevenueFormPage /> },
      { path: 'revenues/:id/edit', element: <RevenueFormPage /> },
      // TODO: Ajouter les autres routes (revenues, stats, settings, etc.)
    ],
  },
])
