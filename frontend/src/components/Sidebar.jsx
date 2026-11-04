import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navigation = [
  { label: 'Dashboard', to: '/dashboard', icon: '▦' },
  { label: 'Products', to: '/products', icon: '□' },
  { label: 'Add product', to: '/products/new', icon: '+' },
  { label: 'Settings', to: '/settings', icon: '⚙' },
]

export default function Sidebar({ isOpen, onClose }) {
  const { logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <>
      {isOpen && (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-slate-950/50 lg:hidden"
          onClick={onClose}
          type="button"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-[#0b1f3a] px-4 py-6 text-white transition-transform lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-3">
          <NavLink className="text-2xl font-bold tracking-tight" to="/dashboard" onClick={onClose}>
            Stock<span className="text-blue-400">Flow</span>
          </NavLink>
          <button
            aria-label="Close navigation"
            className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white lg:hidden"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>

        <nav className="mt-10 space-y-1">
          <p className="px-3 pb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Workspace
          </p>
          {navigation.map((item) => (
            <NavLink
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-950/30'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`
              }
              key={item.to}
              onClick={onClose}
              to={item.to}
            >
              <span className="flex h-5 w-5 items-center justify-center text-base">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto border-t border-white/10 pt-4">
          <button
            className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
            onClick={handleLogout}
            type="button"
          >
            <span className="flex h-5 w-5 items-center justify-center">↪</span>
            Log out
          </button>
        </div>
      </aside>
    </>
  )
}
