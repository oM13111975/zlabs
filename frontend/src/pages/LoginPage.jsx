import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const DEMO_ACCOUNTS = [
  { role: 'Super Admin', user: 'nitesh', pass: 'admin@123' },
  { role: 'Admin', user: 'aryangiri', pass: 'admin@123' },
  { role: 'Team Head', user: 'teamhead_ali', pass: 'teamhead@123' },
  { role: 'Intern', user: 'intern_priya', pass: 'intern@123' },
]

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

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 880, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'start' }}>

        {/* Left panel: branding */}
        <div style={{ paddingTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 48 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 800, color: '#fff' }}>Z</div>
            <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>ZLabs</span>
          </div>

          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12, lineHeight: 1.2 }}>
            Internship &amp; Team Management Portal
          </h1>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 36, fontSize: 14 }}>
            Manage the full lifecycle from internship application to team member. Track tasks, give feedback, and grow your team — all in one place.
          </p>

          {/* Features */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 36 }}>
            {[
              'Role-based access for Admin, Team Head, Team Member',
              'Internship applications with resume upload',
              'Task assignment with public submission links',
              'Intern-to-team-member conversion workflow',
            ].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--text-secondary)' }}>
                <span style={{ color: 'var(--green)', fontSize: 12 }}>✓</span>
                {f}
              </div>
            ))}
          </div>

          {/* Demo accounts */}
          {/* <div>
            <div className="section-label">Demo accounts</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {DEMO_ACCOUNTS.map(a => (
                <button
                  key={a.user}
                  onClick={() => setForm({ username: a.user, password: a.pass })}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 12px', background: 'var(--bg-surface)', border: '1px solid var(--border)',
                    borderRadius: 6, cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.1s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--blue)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span className="role-badge">{a.role}</span>
                    <span style={{ fontSize: 13, color: 'var(--text-primary)', fontFamily: 'monospace' }}>{a.user}</span>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{a.pass}</span>
                </button>
              ))}
            </div>
          </div> */}
        </div>

        {/* Right panel: form */}
        <div className="card" style={{ padding: 28 }}>
          <h2 style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>Sign in</h2>
          <p style={{ margin: '0 0 24px', fontSize: 13, color: 'var(--text-muted)' }}>Enter your credentials to continue</p>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Username</label>
              <input
                className="input"
                placeholder="username"
                autoComplete="username"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Password</label>
              <input
                className="input"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
              />
            </div>

            {error && (
              <div style={{ padding: '8px 12px', background: 'var(--red-muted)', border: '1px solid #4d1a19', borderRadius: 6, color: 'var(--red)', fontSize: 13 }}>
                {error}
              </div>
            )}

            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', padding: '9px', marginTop: 4 }}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)', textAlign: 'center' }}>
            <a href="/careers" style={{ fontSize: 13, color: 'var(--blue)', textDecoration: 'none' }}>
              Looking for internship opportunities? →
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
