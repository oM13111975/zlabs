import { NavLink } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { 
  LayoutDashboard, 
  UserPlus, 
  GraduationCap, 
  Users, 
  FolderKanban, 
  CheckSquare, 
  Hammer, 
  User,
  Network,
  LogOut
} from 'lucide-react'

const NAV = {
  admin: [
    { to: '/admin', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { to: '/admin/applicants', label: 'Applicants', icon: <UserPlus size={18} /> },
    { to: '/admin/interns', label: 'Interns', icon: <GraduationCap size={18} /> },
    { to: '/admin/teams', label: 'Teams', icon: <Users size={18} /> },
    { to: '/admin/projects', label: 'Projects', icon: <FolderKanban size={18} /> },
    { to: '/admin/tasks/interns', label: 'Intern Tasks', icon: <CheckSquare size={18} /> },
    { to: '/admin/tasks/projects', label: 'Project Tasks', icon: <Hammer size={18} /> },
    { to: '/admin/hierarchy', label: 'Hierarchy', icon: <Network size={18} /> },
    { to: '/admin/users', label: 'Users', icon: <User size={18} /> },
  ],
  team_member: [
    { to: '/team', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { to: '/team/interns', label: 'My Interns', icon: <GraduationCap size={18} /> },
    { to: '/team/tasks/interns', label: 'Intern Tasks', icon: <CheckSquare size={18} /> },
    { to: '/team/tasks/projects', label: 'Project Tasks', icon: <Hammer size={18} /> },
    { to: '/team/projects', label: 'Projects', icon: <FolderKanban size={18} /> },
  ],
  mentor: [
    { to: '/team', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { to: '/team/interns', label: 'My Interns', icon: <GraduationCap size={18} /> },
    { to: '/team/tasks/interns', label: 'Intern Tasks', icon: <CheckSquare size={18} /> },
    { to: '/team/tasks/projects', label: 'Project Tasks', icon: <Hammer size={18} /> },
    { to: '/team/projects', label: 'Projects', icon: <FolderKanban size={18} /> },
  ],
  team_head: [
    { to: '/team-head', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { to: '/team-head/members', label: 'Team Members', icon: <Users size={18} /> },
    { to: '/team-head/interns', label: 'My Interns', icon: <GraduationCap size={18} /> },
    { to: '/team-head/tasks/interns', label: 'Intern Tasks', icon: <CheckSquare size={18} /> },
    { to: '/team-head/tasks/projects', label: 'Project Tasks', icon: <Hammer size={18} /> },
    { to: '/team-head/projects', label: 'Projects', icon: <FolderKanban size={18} /> },
  ],
}
NAV.super_admin = NAV.admin

const ROLE_LABELS = {
  super_admin: 'Super Admin',
  admin: 'Administrator',
  mentor: 'Team Member',
  team_member: 'Team Member',
  team_head: 'Team Head',
  intern: 'Intern',
}

export const Sidebar = () => {
  const { user, role, logout } = useAuth()
  const links = NAV[role] || []

  const initials = user?.first_name
    ? `${user.first_name[0]}${user.last_name?.[0] || ''}`.toUpperCase()
    : user?.username?.[0]?.toUpperCase() || 'U'

  return (
    <div className="sidebar">
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, color: '#fff' }}>Z</div>
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>ZLabs Portal</span>
        </div>
      </div>

      <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid var(--border-sub)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px', borderRadius: 10, background: 'var(--bg-raised)' }}>
          <div className="avatar avatar-sm" style={{ background: '#fff', color: 'var(--blue)', border: '1px solid var(--border)', fontWeight: 800, fontSize: 10 }}>
            {initials}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.first_name} {user?.last_name?.[0] || ''}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{ROLE_LABELS[role]}</div>
          </div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
        <div style={{ padding: '0 10px 8px 20px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Menu
        </div>
        {links.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to.split('/').length <= 2}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <span style={{ fontSize: 14, width: 22 }}>{link.icon}</span>
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>

      <div style={{ padding: '12px 12px 24px', borderTop: '1px solid var(--border)' }}>
        <button onClick={logout} className="sidebar-link" style={{ width: '100%', textAlign: 'left', color: 'var(--red)', fontWeight: 600 }}>
          <span style={{ fontSize: 14, width: 22 }}>→</span>
          <span>Log Out</span>
        </button>
      </div>
    </div>
  )
}
