import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { getAlertas } from '../../api/adminApi'

const NAV_ITEMS = [
  {
    to: '/admin/pedidos',
    label: 'Pedidos',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
        <rect x="9" y="3" width="6" height="4" rx="1"/>
        <path d="M9 12h6M9 16h4"/>
      </svg>
    ),
  },
  {
    to: '/admin/productos',
    label: 'Productos',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m7.5 4.27 9 5.15M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
        <path d="m3.3 7 8.7 5 8.7-5M12 22V12"/>
      </svg>
    ),
  },
  {
    to: '/admin/stock',
    label: 'Stock',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 2 7 12 12 22 7 12 2"/>
        <polyline points="2 17 12 22 22 17"/>
        <polyline points="2 12 12 17 22 12"/>
      </svg>
    ),
  },
  {
    to: '/admin/categorias',
    label: 'Categorías',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
      </svg>
    ),
  },
  {
    to: '/admin/descuentos',
    label: 'Descuentos',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="19" y1="5" x2="5" y2="19"/>
        <circle cx="6.5" cy="6.5" r="2.5"/>
        <circle cx="17.5" cy="17.5" r="2.5"/>
      </svg>
    ),
  },
  {
    to: '/admin/cupones',
    label: 'Cupones',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>
        <path d="M13 5v14"/>
      </svg>
    ),
  },
  {
    to: '/admin/reportes',
    label: 'Reportes',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18"/>
        <path d="m19 9-5 5-4-4-3 3"/>
      </svg>
    ),
  },
  {
    to: '/admin/mi-local',
    label: 'Mi local',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
]

export default function Sidebar() {
  const logout = useAuthStore(s => s.logout)
  const navigate = useNavigate()
  const [alertaCount, setAlertaCount] = useState(0)

  useEffect(() => {
    void getAlertas()
      .then(data => setAlertaCount(data.length))
      .catch(() => {})
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/admin/login')
  }

  return (
    <aside
      style={{ width: 200, minWidth: 200, backgroundColor: '#1a1a1a' }}
      className="fixed top-0 left-0 h-screen flex flex-col z-40"
    >
      {/* Logo */}
      <div className="px-5 pt-6 pb-5 border-b border-white/10">
        <div
          style={{ backgroundColor: '#2d5a27', width: 36, height: 36 }}
          className="flex items-center justify-center mb-3"
        >
          <span className="text-white font-bold text-lg leading-none">V</span>
        </div>
        <span className="text-white/40 text-xs font-medium tracking-wide">Panel admin</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            style={({ isActive }) =>
              isActive
                ? {
                    borderLeft: '3px solid #2d5a27',
                    backgroundColor: '#222',
                    color: '#fff',
                  }
                : {
                    borderLeft: '3px solid transparent',
                    color: '#777',
                  }
            }
            className="flex items-center gap-3 px-5 py-3 text-sm font-medium transition-colors hover:text-white hover:bg-white/5"
          >
            {item.icon}
            <span className="flex-1">{item.label}</span>
            {item.to === '/admin/stock' && alertaCount > 0 && (
              <span
                className="flex items-center justify-center text-[10px] font-bold text-white rounded-full"
                style={{ backgroundColor: '#dc2626', minWidth: 18, height: 18, padding: '0 5px' }}
              >
                {alertaCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="w-full text-left text-xs text-[#777] hover:text-white transition-colors py-1"
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
