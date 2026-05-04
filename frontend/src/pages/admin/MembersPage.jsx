import { useState, useEffect } from 'react'
import { Layout, TopBar } from '../../components/Layout'
import { RoleBadge } from '../../components/StatusBadge'
import { Modal } from '../../components/Modal'
import { toast } from '../../components/Toast'
import { authApi } from '../../api'
import { useAuth } from '../../contexts/AuthContext'

export const MembersPage = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [editingUser, setEditingUser] = useState(null)
  const [newRole, setNewRole] = useState('')
  const { role: currentUserRole } = useAuth()
  const [acting, setActing] = useState(false)

  const loadUsers = () => {
    setLoading(true)
    // For Members page, we filter out 'intern' by default if no filter is set
    const effectiveRole = roleFilter || 'team_member,mentor,team_head'
    authApi.users({ search, role: effectiveRole })
      .then(r => {
        let data = r.data.results || r.data
        // Extra safety check to ensure no interns show up here unless explicitly filtered
        if (!roleFilter) {
          data = data.filter(u => u.profile?.role !== 'intern')
        }
        setUsers(data)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadUsers()
  }, [search, roleFilter])

  const handleUpdateRole = async () => {
    setActing(true)
    try {
      await authApi.updateUser(editingUser.id, { role: newRole })
      toast.success('User role updated successfully')
      setEditingUser(null)
      loadUsers()
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.detail || 'Failed to update user role')
    } finally {
      setActing(false)
    }
  }

  return (
    <Layout>
      <TopBar title="Team Members" subtitle={`${users.length} professional staff members`} />
      <div className="page slide-up">
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <input className="input" placeholder="Search name or email..." value={search}
            onChange={e => setSearch(e.target.value)} style={{ maxWidth: 260 }} />
          <select className="input" value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={{ maxWidth: 180 }}>
            <option value="">All Members</option>
            {['mentor', 'team_head', 'team_member'].map(r => <option key={r} value={r}>{r.replace('_', ' ').toUpperCase()}</option>)}
          </select>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Member</th>
                <th>Email</th>
                <th>Role</th>
                <th>Phone</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading records...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No members found.</td></tr>
              ) : users.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: 'white' }}>
                        {u.first_name?.[0] || u.username?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{u.first_name} {u.last_name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>@{u.username}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{u.email}</td>
                  <td><RoleBadge role={u.profile?.role} /></td>
                  <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{u.profile?.phone || '—'}</td>
                  <td>
                    <button 
                        className="btn btn-ghost btn-sm" 
                        style={{ padding: '0 8px', height: 28, fontSize: 11 }}
                        onClick={() => { setEditingUser(u); setNewRole(u.profile?.role) }}
                    >
                        Manage Account
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={!!editingUser} onClose={() => setEditingUser(null)} title="Manage Staff Account">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
                <label className="section-label">Member Details</label>
                <div style={{ padding: 14, background: 'var(--bg-raised)', borderRadius: 10 }}>
                    <div style={{ fontWeight: 800, fontSize: 15 }}>{editingUser?.first_name} {editingUser?.last_name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{editingUser?.email}</div>
                </div>
            </div>

            <div>
                <label className="section-label">Update Role / Position</label>
                <select className="input" value={newRole} onChange={e => setNewRole(e.target.value)}>
                    <option value="mentor">Mentor</option>
                    <option value="team_head">Team Head</option>
                    <option value="team_member">Team Member</option>
                    <option value="intern">Intern (Demote)</option>
                </select>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 10, lineHeight: 1.5 }}>
                    Changing a user's role will immediately update their access permissions across the portal.
                </p>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
                <button className="btn btn-ghost" onClick={() => setEditingUser(null)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleUpdateRole} disabled={acting}>Save Changes</button>
            </div>
        </div>
      </Modal>
    </Layout>
  )
}
