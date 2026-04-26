import { Sidebar } from './Sidebar'
import { ToastContainer } from './Toast'

export const Layout = ({ children }) => (
  <div className="layout">
    <Sidebar />
    <div className="main-content">
      <ToastContainer />
      {children}
    </div>
  </div>
)

export const TopBar = ({ title, subtitle, actions }) => (
  <div className="topbar" style={{ height: 72 }}>
    <div>
      <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>{title}</h1>
      {subtitle && <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>{subtitle}</p>}
    </div>
    {actions && <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>{actions}</div>}
  </div>
)
