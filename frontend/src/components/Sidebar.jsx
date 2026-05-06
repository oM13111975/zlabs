import React, { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { chatApi } from '../api'
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
  LogOut,
  MessageSquare
} from 'lucide-react'

const NAV = {
  admin: [
    { to: '/admin', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { to: '/admin/applicants', label: 'Applicants', icon: <UserPlus size={18} /> },
    { to: '/admin/interns', label: 'Interns', icon: <GraduationCap size={18} /> },
    { to: '/admin/members', label: 'Members', icon: <Users size={18} /> },
    { to: '/admin/teams', label: 'Teams', icon: <Users size={18} /> },
    { to: '/admin/projects', label: 'Projects', icon: <FolderKanban size={18} /> },
    { to: '/admin/tasks/interns', label: 'Intern Tasks', icon: <CheckSquare size={18} /> },
    { to: '/admin/tasks/projects', label: 'Project Tasks', icon: <Hammer size={18} /> },
    { to: '/admin/hierarchy', label: 'Hierarchy', icon: <Network size={18} /> },
    { to: '/admin/users', label: 'Settings', icon: <User size={18} /> },
    { to: '/chat', label: 'Team Chat', icon: <MessageSquare size={18} /> },
    { to: '/profile', label: 'My Profile', icon: <User size={18} /> },
  ],
  team_member: [
    { to: '/team', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { to: '/team/interns', label: 'My Interns', icon: <GraduationCap size={18} /> },
    { to: '/team/tasks/interns', label: 'Intern Tasks', icon: <CheckSquare size={18} /> },
    { to: '/team/tasks/projects', label: 'Project Tasks', icon: <Hammer size={18} /> },
    { to: '/team/projects', label: 'Projects', icon: <FolderKanban size={18} /> },
    { to: '/chat', label: 'Team Chat', icon: <MessageSquare size={18} /> },
    { to: '/profile', label: 'My Profile', icon: <User size={18} /> },
  ],
  mentor: [
    { to: '/team', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { to: '/team/interns', label: 'My Interns', icon: <GraduationCap size={18} /> },
    { to: '/team/tasks/interns', label: 'Intern Tasks', icon: <CheckSquare size={18} /> },
    { to: '/team/tasks/projects', label: 'Project Tasks', icon: <Hammer size={18} /> },
    { to: '/team/projects', label: 'Projects', icon: <FolderKanban size={18} /> },
    { to: '/chat', label: 'Team Chat', icon: <MessageSquare size={18} /> },
    { to: '/profile', label: 'My Profile', icon: <User size={18} /> },
  ],
  team_head: [
    { to: '/team-head', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { to: '/team-head/members', label: 'Team Members', icon: <Users size={18} /> },
    { to: '/team-head/interns', label: 'My Interns', icon: <GraduationCap size={18} /> },
    { to: '/team-head/tasks/interns', label: 'Intern Tasks', icon: <CheckSquare size={18} /> },
    { to: '/team-head/tasks/projects', label: 'Project Tasks', icon: <Hammer size={18} /> },
    { to: '/team-head/projects', label: 'Projects', icon: <FolderKanban size={18} /> },
    { to: '/chat', label: 'Team Chat', icon: <MessageSquare size={18} /> },
    { to: '/profile', label: 'My Profile', icon: <User size={18} /> },
  ],
  intern: [
    { to: '/intern-portal', label: 'Intern Portal', icon: <LayoutDashboard size={18} /> },
    { to: '/profile', label: 'My Profile', icon: <User size={18} /> },
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

import { toast } from './Toast'

export const Sidebar = () => {
  const { user, role, logout } = useAuth()
  const links = NAV[role] || []
  const [totalUnread, setTotalUnread] = useState(0)
  const prevUnreadRef = React.useRef(0)

  useEffect(() => {
    if (!user) return;
    const fetchUnread = async () => {
      try {
        const res = await chatApi.getGroups();
        const loadedGroups = res.data?.results || res.data || [];
        const unread = loadedGroups.reduce((acc, g) => acc + (g.unread_count || 0), 0);
        
        if (unread > prevUnreadRef.current && window.location.pathname !== '/chat') {
          toast.info('New message in Team Chat!');
        }
        prevUnreadRef.current = unread;
        setTotalUnread(unread);
      } catch (err) {
        console.error('Failed to fetch unread count', err);
      }
    };
    
    fetchUnread();
    const interval = setInterval(fetchUnread, 10000); // Poll every 10 seconds globally
    return () => clearInterval(interval);
  }, [user]);

  const initials = user?.first_name
    ? `${user.first_name[0]}${user.last_name?.[0] || ''}`.toUpperCase()
    : user?.username?.[0]?.toUpperCase() || 'U'

  return (
    <div className="sidebar">
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/logo.png" alt="Logo" style={{ width: 32, height: 32, objectFit: 'contain' }} />
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>ZLabs Portal</span>
        </div>
      </div>

      <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid var(--border-sub)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px', borderRadius: 10, background: 'var(--bg-raised)' }}>
          <div className="avatar avatar-sm" style={{ background: '#fff', color: 'var(--blue)', border: '1px solid var(--border)', fontWeight: 800, fontSize: 10, overflow: 'hidden' }}>
            {user?.profile?.avatar ? (
              <img src={user.profile.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              initials
            )}
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
            <span style={{ fontSize: 14, width: 22, display: 'flex', alignItems: 'center' }}>{link.icon}</span>
            <span style={{ flex: 1 }}>{link.label}</span>
            {link.to === '/chat' && totalUnread > 0 && (
              <span style={{ 
                background: 'var(--blue)', color: 'white', fontSize: 10, 
                padding: '2px 6px', borderRadius: 10, fontWeight: 'bold' 
              }}>
                {totalUnread > 99 ? '99+' : totalUnread}
              </span>
            )}
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
