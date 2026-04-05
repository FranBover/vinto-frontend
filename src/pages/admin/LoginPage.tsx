import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginAdmin } from '../../api/adminApi'
import { useAuthStore } from '../../store/authStore'

export default function LoginPage() {
  const navigate = useNavigate()
  const guardarToken = useAuthStore(s => s.guardarToken)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const { token } = await loginAdmin(email.trim(), password)
      guardarToken(token)
      navigate('/admin/pedidos', { replace: true })
    } catch {
      setError('Email o contraseña incorrectos.')
      setLoading(false)
    }
  }

  const inputCls =
    'w-full border border-[#d0d0d0] px-3 py-3 text-sm rounded-none outline-none focus:border-[#1a1a1a] bg-white transition-colors'
  const labelCls =
    'block text-[10px] font-bold text-[#aaa] uppercase tracking-widest mb-1.5'

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: '#fafaf9' }}
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div
            style={{ backgroundColor: '#1a1a1a', width: 52, height: 52 }}
            className="flex items-center justify-center mb-4"
          >
            <span className="text-white font-bold text-2xl leading-none">V</span>
          </div>
          <h1 className="text-xl font-bold text-[#1a1a1a]">Vinto</h1>
          <p className="text-sm text-[#aaa] mt-1">Panel admin</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className={labelCls}>Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="admin@local.com"
              className={inputCls}
            />
          </div>

          <div>
            <label htmlFor="password" className={labelCls}>Contraseña</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className={inputCls}
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1a1a1a] text-white py-3 font-bold text-sm rounded-none disabled:opacity-50 flex items-center justify-between px-4 mt-2"
          >
            <span>{loading ? 'Ingresando…' : 'Ingresar'}</span>
            {!loading && <span>→</span>}
          </button>
        </form>
      </div>
    </div>
  )
}
