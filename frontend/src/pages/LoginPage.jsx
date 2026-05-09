import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { ArrowRight, Lock, User, CheckCircle2, ChevronRight } from 'lucide-react'

export const LoginPage = () => {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const role = await login(form.username, form.password)
      const routes = { 
        super_admin: '/admin',
        admin: '/admin', 
        mentor: '/team', 
        team_member: '/team', 
        team_head: '/team-head', 
        intern: '/intern-portal' 
      }
      navigate(routes[role] || '/')
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.error || 'Invalid username or password.')
    } finally { setLoading(false) }
  }

  // Design Tokens matching Landing Page
  const theme = {
    navy: '#101c44',
    accent: '#2563eb',
    slate: '#475569',
    bg: '#f8fafc',
    border: '#e2e8f0',
  }

  return (
    <div className="login-container" style={{ 
      minHeight: '100vh', 
      background: theme.bg, 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: 24,
      fontFamily: "'Inter', sans-serif"
    }}>
      <div className="login-card" style={{ 
        width: '100%', 
        maxWidth: 1000, 
        display: 'grid', 
        gridTemplateColumns: '1.2fr 1fr', 
        gap: 60, 
        alignItems: 'center',
        background: '#fff',
        padding: 40,
        borderRadius: 32,
        boxShadow: '0 20px 60px rgba(16, 28, 68, 0.08)',
        border: `1px solid ${theme.border}`
      }}>

        {/* Left Side: Branding & Value Prop */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48 }}>
            <img src="/logo.png" alt="ZPortal" style={{ width: 32, height: 32, objectFit: 'contain' }} />
            <span style={{ fontSize: 20, fontWeight: 800, color: theme.navy, letterSpacing: '-0.03em' }}>ZPortal</span>
          </div>

          <h1 style={{ fontSize: 36, fontWeight: 900, color: theme.navy, marginBottom: 16, lineHeight: 1.1, letterSpacing: '-0.04em' }}>
            The professional engine for <em>talent evolution.</em>
          </h1>
          <p style={{ color: theme.slate, lineHeight: 1.7, marginBottom: 40, fontSize: 16 }}>
            Manage the full lifecycle from internship application to full-time member. Track tasks, give feedback, and grow your team in one transparent ecosystem.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              'Role-based access & security',
              'Automated internship workflows',
              'Performance tracking & feedback',
              'One-click member conversion'
            ].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, color: theme.navy, fontWeight: 500 }}>
                <CheckCircle2 size={18} color={theme.accent} />
                {f}
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div style={{ 
          background: theme.bg, 
          padding: 32, 
          borderRadius: 24, 
          border: `1px solid ${theme.border}` 
        }}>
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 800, color: theme.navy, letterSpacing: '-0.02em' }}>Welcome back</h2>
            <p style={{ margin: 0, fontSize: 14, color: theme.slate }}>Enter your credentials to access the portal</p>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: theme.navy, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Username</label>
              <div style={{ position: 'relative' }}>
                <User size={16} color={theme.slate} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  style={{ 
                    width: '100%', 
                    padding: '12px 14px 12px 42px', 
                    borderRadius: 12, 
                    border: `1px solid ${theme.border}`,
                    fontSize: 14,
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    background: '#fff'
                  }}
                  placeholder="Enter your username"
                  value={form.username}
                  onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: theme.navy, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color={theme.slate} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="password"
                  style={{ 
                    width: '100%', 
                    padding: '12px 14px 12px 42px', 
                    borderRadius: 12, 
                    border: `1px solid ${theme.border}`,
                    fontSize: 14,
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    background: '#fff'
                  }}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required
                />
              </div>
            </div>

            {error && (
              <div style={{ 
                padding: '12px', 
                background: '#fef2f2', 
                border: '1px solid #fee2e2', 
                borderRadius: 10, 
                color: '#b91c1c', 
                fontSize: 13,
                fontWeight: 500
              }}>
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              style={{ 
                width: '100%', 
                padding: '14px', 
                marginTop: 8,
                background: theme.navy,
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                fontWeight: 700,
                fontSize: 15,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'all 0.2s'
              }}
            >
              {loading ? 'Authenticating...' : 'Sign In to Portal'}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <div style={{ marginTop: 32, paddingTop: 24, borderTop: `1px solid ${theme.border}`, textAlign: 'center' }}>
            <p style={{ margin: '0 0 16px', fontSize: 14, color: theme.slate }}>Are you an applicant?</p>
            <a href="/careers" style={{ 
              color: theme.accent, 
              textDecoration: 'none', 
              fontSize: 15, 
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4
            }}>
              View Open Internships <ChevronRight size={16} />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage

