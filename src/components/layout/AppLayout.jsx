import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#f4f6f8' }}>
      <Sidebar />
      <main className="flex-1 overflow-y-auto" style={{
        backgroundColor: '#ffffff',
        borderRadius: '20px 0 0 0',
        margin: '28px 0 0 0',
      }}>
        <Outlet />
      </main>
    </div>
  )
}
