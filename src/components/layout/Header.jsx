import { Bell } from 'lucide-react'
import useAuthStore from '../../store/authStore'

export default function Header({ title, subtitle, actions }) {
  const { user } = useAuthStore()

  return (
    <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
      <div>
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        {actions}
        <button className="relative p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">
          <Bell className="w-5 h-5" />
        </button>
      </div>
    </header>
  )
}
