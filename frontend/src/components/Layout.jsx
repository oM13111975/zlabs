import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { ToastContainer } from './Toast'
import { Menu } from 'lucide-react'

export const Layout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className={`layout ${isSidebarOpen ? 'sidebar-open' : ''}`}>
      {/* Overlay for mobile when sidebar is open */}
      {isSidebarOpen && (
        <div 
          className="mobile-overlay" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <div className="main-content">
        <ToastContainer />
        
        {/* Mobile Header */}
        <div className="mobile-header">
          <button className="mobile-menu-toggle" onClick={() => setIsSidebarOpen(true)}>
            <Menu size={24} />
          </button>
          <span style={{ fontSize: 16, fontWeight: 700, marginLeft: 10 }}>ZLabs Portal</span>
        </div>
        
        {children}
      </div>
    </div>
  )
}

export const TopBar = ({ title, subtitle, actions }) => {
  return (
    <div className="topbar">
      <div>
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>{title}</h1>
        {subtitle && <p className="topbar-subtitle" style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>{subtitle}</p>}
      </div>
      {actions && <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>{actions}</div>}
    </div>
  )
}
