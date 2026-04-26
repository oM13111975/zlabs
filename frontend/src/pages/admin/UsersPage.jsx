import { useState, useEffect } from 'react'
import { Layout, TopBar } from '../../components/Layout'
import { RoleBadge } from '../../components/StatusBadge'
import { Modal } from '../../components/Modal'
import { toast } from '../../components/Toast'
import { authApi } from '../../api'
import { useAuth } from '../../contexts/AuthContext'

export const UsersPage = () => {
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
    authApi.users({ search, role: roleFilter })
      .then(r => setUsers(r.data.results || r.data))
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

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return
    setActing(true)
    try {
      await authApi.deleteUser(userId)
      toast.success('User deleted')
      loadUsers()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete user')
    } finally {
      setActing(false)
    }
  }

  return (
    <Layout>
      <TopBar title="Users" subtitle={`${users.length} users in system`} />
      <div className="page slide-up">
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <input className="input" placeholder="Search username or email..." value={search}
            onChange={e => setSearch(e.target.value)} style={{ maxWidth: 260 }} />
          <select className="input" value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={{ maxWidth: 180 }}>
            <option value="">All Roles</option>
            {['super_admin', 'admin', 'mentor', 'team_head', 'team_member', 'intern'].map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
          </select>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Phone</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>Loading...</td></tr>
              ) : users.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#3b82f6,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'white' }}>
                        {u.first_name?.[0] || u.username?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.first_name} {u.last_name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>@{u.username}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{u.email}</td>
                  <td><RoleBadge role={u.profile?.role} /></td>
                  <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{u.profile?.phone || '—'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                        {(currentUserRole === 'super_admin' || (currentUserRole === 'admin' && !['admin', 'super_admin'].includes(u.profile?.role))) && (
                          <button 
                              className="btn btn-ghost btn-sm" 
                              style={{ padding: '0 8px', height: 28, fontSize: 11 }}
                              onClick={() => { setEditingUser(u); setNewRole(u.profile?.role) }}
                          >
                              ✏️ Edit
                          </button>
                        )}
                        {(currentUserRole === 'super_admin' || (currentUserRole === 'admin' && !['admin', 'super_admin'].includes(u.profile?.role))) && (
                            <button 
                                className="btn btn-ghost btn-sm" 
                                style={{ padding: '0 8px', height: 28, fontSize: 11, color: 'var(--red)' }}
                                onClick={() => handleDeleteUser(u.id)}
                            >
                                🗑️ Delete
                            </button>
                        )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={!!editingUser} onClose={() => setEditingUser(null)} title="Modify User Account">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
                <label className="section-label">User Information</label>
                <div style={{ padding: 12, background: 'var(--bg-raised)', borderRadius: 8 }}>
                    <div style={{ fontWeight: 700 }}>{editingUser?.first_name} {editingUser?.last_name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{editingUser?.email}</div>
                </div>
            </div>

            <div>
                <label className="section-label">Assigned Role</label>
                <select className="input" value={newRole} onChange={e => setNewRole(e.target.value)}>
                    {currentUserRole === 'super_admin' ? (
                        <>
                            <option value="super_admin">Super Admin</option>
                            <option value="admin">Admin</option>
                        </>
                    ) : (
                        editingUser?.profile?.role === 'admin' && <option value="admin" disabled>Admin (Manageable only by Super Admin)</option>
                    )}
                    <option value="mentor">Mentor</option>
                    <option value="team_head">Team Head</option>
                    <option value="team_member">Team Member</option>
                    <option value="intern">Intern</option>
                </select>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
                    Note: Promoting someone to Admin or modifying an existing Admin account requires Super Admin permissions.
                </p>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
                <button className="btn btn-ghost" onClick={() => setEditingUser(null)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleUpdateRole} disabled={acting}>Update User</button>
            </div>
        </div>
      </Modal>
    </Layout>
  )
}
